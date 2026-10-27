#!/usr/bin/env python3
"""Aura ad-edit toolkit: turn raw founder footage into Meta/TikTok-ready ads.

One file, no dependencies beyond ffmpeg/ffprobe and the Python stdlib.

Subcommands (run `aedit.py <cmd> -h` for options):
  sfx         generate the built-in SFX pack (whoosh, pop, hit, riser) into assets/sfx
  transcribe  word-level transcript -> words.json (Gemini API; or bring your own)
  cut         silence removal + jump cuts (+ punch-in zooms on alternating cuts)
  captions    words.json -> animated word-by-word ASS captions (Reels safe zone)
  mix         music bed ducked under the voice + SFX hits + loudness to -14 LUFS
  reframe     9:16 (1080x1920) or 4:5 (1080x1350) export
  hooks       prepend several hook clips to one body -> one ad variant per hook
  safezone    burn a Reels/TikTok UI safe-zone overlay for review
  build       run the whole pipeline from a JSON spec (see README.md)
"""
import argparse
import base64
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SFX_DIR = os.path.join(HERE, "assets", "sfx")
W, H, FPS = 1080, 1920, 30
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart"]
BRAND = {"font": "Inter", "text": "&H00FFFFFF", "accent": "&H0000D7FF", "outline": "&H00000000"}  # ASS colours are &HAABBGGRR
GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash",
                 "gemini-3-flash-preview", "gemini-flash-latest"]


def run(cmd, quiet=True):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd[:6])}...\n{p.stderr[-2000:]}")
    return p


def duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout
    return float(out.strip())


def has_audio(path):
    out = run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
               "-of", "csv=p=0", path]).stdout
    return bool(out.strip())


# ---------------------------------------------------------------- sfx
def cmd_sfx(a):
    os.makedirs(SFX_DIR, exist_ok=True)
    recipes = {
        # filtered noise swept up then down: the classic transition whoosh
        "whoosh.wav": "anoisesrc=d=0.6:c=pink:a=0.8,highpass=f=300,lowpass=f=6000,"
                      "afade=t=in:d=0.25,afade=t=out:st=0.3:d=0.3,volume=0.9",
        # short pitched blip for caption/emoji pops
        "pop.wav": "sine=f=880:d=0.09,afade=t=out:st=0.02:d=0.07,volume=0.6",
        # low boom for reveals and price drops
        "hit.wav": "sine=f=55:d=0.7,afade=t=out:st=0.05:d=0.65,volume=1.6",
        # rising noise into a cut (tension before the reveal)
        "riser.wav": "anoisesrc=d=1.5:c=white:a=0.5,highpass=f=800,afade=t=in:d=1.4,afade=t=out:st=1.4:d=0.1",
    }
    for name, f in recipes.items():
        run(["ffmpeg", "-y", "-hide_banner", "-f", "lavfi", "-i", f, "-ar", "48000", "-ac", "2",
             os.path.join(SFX_DIR, name)])
    print(f"wrote {len(recipes)} SFX to {SFX_DIR}")


# ---------------------------------------------------------------- transcribe
def cmd_transcribe(a):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY not set. Alternatively write words.json by hand: "
                 '[{"w": "word", "s": 0.00, "e": 0.32}, ...]')
    tmp = tempfile.mkdtemp()
    audio = os.path.join(tmp, "a.mp3")
    run(["ffmpeg", "-y", "-i", a.input, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", audio])
    data = base64.b64encode(open(audio, "rb").read()).decode()
    prompt = ("Transcribe this speech verbatim with WORD-LEVEL timestamps. Return ONLY a JSON array, "
              'each item {"w": word incl. punctuation, "s": start seconds, "e": end seconds}, '
              "times accurate to 0.05 s, in order, no gaps in coverage of spoken words.")
    body = json.dumps({"contents": [{"parts": [{"inline_data": {"mime_type": "audio/mp3", "data": data}},
                                               {"text": prompt}]}],
                       "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}).encode()
    last = None
    for model in GEMINI_MODELS:
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            data=body, headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            resp = json.load(urllib.request.urlopen(req, timeout=300))
            text = resp["candidates"][0]["content"]["parts"][0]["text"]
            words = json.loads(text)
            json.dump(words, open(a.output, "w"), indent=1)
            print(f"{len(words)} words via {model} -> {a.output}")
            return
        except Exception as e:  # quota or model errors: try the next model
            last = e
    sys.exit(f"transcription failed on all models: {last}")


# ---------------------------------------------------------------- cut
def detect_speech(path, noise_db, min_sil, pad):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", p.stderr)]
    total = duration(path)
    sil = list(zip(starts, ends + [total] * (len(starts) - len(ends))))
    keep, t = [], 0.0
    for s, e in sil:
        if s > t:
            keep.append([t, s])
        t = e
    if t < total:
        keep.append([t, total])
    segs = []
    for s, e in keep:  # pad so words aren't clipped, then merge overlaps
        s, e = max(0.0, s - pad), min(total, e + pad)
        if segs and s <= segs[-1][1] + 0.05:
            segs[-1][1] = max(segs[-1][1], e)
        else:
            segs.append([s, e])
    return [sg for sg in segs if sg[1] - sg[0] >= 0.25]


def cover_scale():
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1"


def cmd_cut(a):
    segs = detect_speech(a.input, a.noise, a.min_silence, a.pad)
    if not segs:
        sys.exit("no speech detected; lower --noise")
    parts, labels = [], []
    for i, (s, e) in enumerate(segs):
        z = a.punch if (a.punch > 1 and i % 2 == 1) else 1.0
        zoom = f",scale=iw*{z}:ih*{z},crop={W}:{H},setsar=1" if z > 1 else ""
        parts.append(f"[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS,{cover_scale()}{zoom},fps={FPS}[v{i}];"
                     f"[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,"
                     f"afade=t=out:st={max(0, e - s - 0.015):.3f}:d=0.015[a{i}];")
        labels.append(f"[v{i}][a{i}]")
    fc = "".join(parts) + "".join(labels) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
    run(["ffmpeg", "-y", "-hide_banner", "-i", a.input, "-filter_complex", fc, "-map", "[v]", "-map", "[a]"]
        + ENC + [a.output])
    # time map: lets captions made on the raw take follow the cut
    edl, out_t = [], 0.0
    for s, e in segs:
        edl.append({"src_s": round(s, 3), "src_e": round(e, 3), "out_s": round(out_t, 3)})
        out_t += e - s
    json.dump(edl, open(a.output + ".edl.json", "w"), indent=1)
    src = duration(a.input)
    print(f"{len(segs)} segments kept, {src:.1f}s -> {out_t:.1f}s ({100 * (1 - out_t / src):.0f}% dead air removed)")


def remap_words(words, edl):
    out = []
    for w in words:
        for seg in edl:
            if seg["src_s"] - 0.02 <= w["s"] < seg["src_e"]:
                off = seg["out_s"] - seg["src_s"]
                out.append({"w": w["w"], "s": w["s"] + off, "e": min(w["e"], seg["src_e"]) + off})
                break
    return out


# ---------------------------------------------------------------- captions
def ass_time(t):
    t = max(0.0, t)
    h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h}:{m:02d}:{t % 60:05.2f}"


def group_words(words, max_words, max_gap):
    groups, cur = [], []
    for w in words:
        brk = cur and (len(cur) >= max_words or w["s"] - cur[-1]["e"] > max_gap
                       or re.search(r"[.!?,]$", cur[-1]["w"]))
        if brk:
            groups.append(cur)
            cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return groups


def cmd_captions(a):
    words = json.load(open(a.words))
    if a.edl:
        words = remap_words(words, json.load(open(a.edl)))
    emph = {e.lower().strip(".,!?") for e in (a.emphasis or "").split(",") if e}
    size = int(H * a.size)
    y = int(H * a.y)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{a.font},{size},{BRAND['text']},{BRAND['text']},{BRAND['outline']},&H80000000,-1,0,0,0,100,100,0,0,1,{max(4, size // 14)},3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    groups = group_words(words, a.max_words, 0.6)
    for gi, g in enumerate(groups):
        end_g = g[-1]["e"] + 0.12
        if gi + 1 < len(groups):  # never overlap the next line
            end_g = min(end_g, groups[gi + 1][0]["s"])
        for i, w in enumerate(g):
            s = w["s"]
            e = g[i + 1]["s"] if i + 1 < len(g) else end_g
            toks = []
            for j, x in enumerate(g):
                txt = x["w"].upper() if a.upper else x["w"]
                key = x["w"].lower().strip(".,!?")
                if j == i:  # active word: accent colour + quick pop
                    toks.append(r"{\c" + BRAND["accent"] + r"&\fscx112\fscy112\t(0,90,\fscx100\fscy100)}" + txt + r"{\r}")
                elif key in emph:
                    toks.append(r"{\c" + BRAND["accent"] + "&}" + txt + r"{\r}")
                else:
                    toks.append(txt)
            # first word of a group slides up slightly so each new line feels alive
            intro = r"{\move(%d,%d,%d,%d,0,80)}" % (W // 2, y + 18, W // 2, y) if i == 0 else r"{\pos(%d,%d)}" % (W // 2, y)
            lines.append(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{intro}{' '.join(toks)}")
    open(a.output, "w").write(head + "\n".join(lines) + "\n")
    if a.video:
        out = a.burn or a.video.rsplit(".", 1)[0] + "_captioned.mp4"
        ass = a.output.replace("\\", "/").replace(":", r"\:")
        run(["ffmpeg", "-y", "-hide_banner", "-i", a.video, "-vf", f"ass='{ass}'", "-c:a", "copy"]
            + [x for x in ENC if x not in ("-c:a", "aac", "-b:a", "192k", "-ar", "48000")] + [out])
        print(f"{len(lines)} caption events -> {out}")
    else:
        print(f"{len(lines)} caption events -> {a.output}")


# ---------------------------------------------------------------- mix
def cmd_mix(a):
    vdur = duration(a.input)
    inputs = ["-i", a.input]
    chains = ["[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voice][sc]"]
    mixes = ["[voice]"]
    idx = 1
    if a.music:
        inputs += ["-stream_loop", "-1", "-i", a.music]
        chains.append(f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{vdur:.3f},"
                      f"volume={a.music_db}dB,afade=t=in:d=0.4,afade=t=out:st={max(0, vdur - 1):.3f}:d=1[mus]")
        # music ducks whenever the founder speaks
        chains.append("[mus][sc]sidechaincompress=threshold=0.03:ratio=3:attack=15:release=350:makeup=1[duck]")
        mixes.append("[duck]")
        idx += 1
    else:
        chains[0] = "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[voice]"
    for ev in (json.load(open(a.sfx)) if a.sfx else []):
        f = ev["file"] if os.path.isabs(ev["file"]) else os.path.join(SFX_DIR, ev["file"])
        inputs += ["-i", f]
        ms = int(ev["t"] * 1000)
        chains.append(f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,"
                      f"volume={ev.get('db', -8)}dB,adelay={ms}|{ms}[s{idx}]")
        mixes.append(f"[s{idx}]")
        idx += 1
    fc = ";".join(chains) + ";" + "".join(mixes) + \
        f"amix=inputs={len(mixes)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[aout]"
    run(["ffmpeg", "-y", "-hide_banner"] + inputs + ["-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", a.output])
    print(f"mixed {len(mixes)} audio layers -> {a.output} (-14 LUFS)")


def cut_points(edl):
    return [seg["out_s"] for seg in edl[1:]]


# ---------------------------------------------------------------- reframe / hooks / safezone
def cmd_reframe(a):
    tw, th = (1080, 1350) if a.ratio == "4:5" else (1080, 1920)
    vf = (f"scale={tw}:{th}:force_original_aspect_ratio=increase,"
          f"crop={tw}:{th}:(iw-{tw})/2:(ih-{th})*{a.y_bias},setsar=1")
    run(["ffmpeg", "-y", "-hide_banner", "-i", a.input, "-vf", vf] + ENC + [a.output])
    print(f"{a.ratio} -> {a.output}")


def normalise(src, dst):
    run(["ffmpeg", "-y", "-hide_banner", "-i", src, "-vf", cover_scale() + f",fps={FPS}",
         "-af", "aformat=sample_rates=48000:channel_layouts=stereo"] + ENC + [dst])


def cmd_hooks(a):
    os.makedirs(a.outdir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    body = os.path.join(tmp, "body.mp4")
    normalise(a.body, body)
    for i, hook in enumerate(a.hook, 1):
        h = os.path.join(tmp, f"h{i}.mp4")
        normalise(hook, h)
        out = os.path.join(a.outdir, f"{a.name}_H{i}.mp4")
        run(["ffmpeg", "-y", "-hide_banner", "-i", h, "-i", body, "-filter_complex",
             "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]", "-map", "[v]", "-map", "[a]"] + ENC + [out])
        print(f"variant {i}: {out}")


def cmd_safezone(a):
    # Reels/TikTok UI: top ~14% (header), bottom ~35% (caption + CTA), right ~12% (action buttons)
    vf = ("drawbox=x=0:y=0:w=iw:h=ih*0.14:color=red@0.25:t=fill,"
          "drawbox=x=0:y=ih*0.65:w=iw:h=ih*0.35:color=red@0.25:t=fill,"
          "drawbox=x=iw*0.88:y=ih*0.14:w=iw*0.12:h=ih*0.51:color=red@0.25:t=fill")
    run(["ffmpeg", "-y", "-hide_banner", "-i", a.input, "-vf", vf] + ENC + [a.output])
    print(f"safe-zone review -> {a.output}")


# ---------------------------------------------------------------- build
def cmd_build(a):
    spec = json.load(open(a.spec))
    base = os.path.dirname(os.path.abspath(a.spec))
    p = lambda x: x if os.path.isabs(x) else os.path.join(base, x)
    out = p(spec.get("outdir", "out"))
    work = os.path.join(out, "_work")
    os.makedirs(work, exist_ok=True)
    name = spec.get("name", "ad")
    ns = argparse.Namespace
    if not os.path.exists(os.path.join(SFX_DIR, "whoosh.wav")):
        cmd_sfx(None)

    cut = os.path.join(work, "1_cut.mp4")
    c = spec.get("cut", {})
    cmd_cut(ns(input=p(spec["input"]), output=cut, noise=c.get("noise_db", -35),
               min_silence=c.get("min_silence", 0.35), pad=c.get("pad", 0.08), punch=c.get("punch", 1.12)))
    edl = json.load(open(cut + ".edl.json"))
    cur = cut

    cap = spec.get("captions")
    if cap:
        out_cap = os.path.join(work, "2_captioned.mp4")
        cmd_captions(ns(words=p(cap["words"]), edl=cut + ".edl.json", output=os.path.join(work, "captions.ass"),
                        video=cur, burn=out_cap, font=cap.get("font", BRAND["font"]), size=cap.get("size", 0.052),
                        y=cap.get("y", 0.60), max_words=cap.get("max_words", 3), upper=cap.get("upper", True),
                        emphasis=",".join(cap.get("emphasis", []))))
        cur = out_cap

    snd = spec.get("sound", {})
    sfx = list(snd.get("sfx", []))
    if snd.get("whoosh_on_cuts"):
        sfx += [{"t": max(0, t - 0.12), "file": "whoosh.wav", "db": snd.get("whoosh_db", -14)} for t in cut_points(edl)]
    sfx_json = os.path.join(work, "sfx.json")
    json.dump(sfx, open(sfx_json, "w"))
    mixed = os.path.join(work, "3_mixed.mp4")
    cmd_mix(ns(input=cur, output=mixed, music=p(snd["music"]) if snd.get("music") else None,
               music_db=snd.get("music_db", -18), sfx=sfx_json if sfx else None))
    cur = mixed

    finals = []
    hooks = [p(h) for h in spec.get("hooks", [])]
    if hooks:
        cmd_hooks(ns(body=cur, hook=hooks, outdir=work, name=name))
        bodies = [os.path.join(work, f"{name}_H{i}.mp4") for i in range(1, len(hooks) + 1)]
    else:
        bodies = [cur]
    for i, b in enumerate(bodies, 1):
        tag = f"_H{i}" if hooks else ""
        for ratio in spec.get("ratios", ["9:16"]):
            o = os.path.join(out, f"{name}{tag}_{ratio.replace(':', 'x')}.mp4")
            cmd_reframe(ns(input=b, output=o, ratio=ratio, y_bias=spec.get("y_bias", 0.3)))
            finals.append(o)
    if spec.get("safezone_preview"):
        cmd_safezone(ns(input=finals[0], output=os.path.join(out, f"{name}_SAFEZONE_review.mp4")))
    if not spec.get("keep_work"):
        shutil.rmtree(work, ignore_errors=True)
    print("\nFINAL:\n  " + "\n  ".join(finals))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("sfx"); s.set_defaults(f=cmd_sfx)
    s = sp.add_parser("transcribe"); s.add_argument("input"); s.add_argument("-o", "--output", default="words.json"); s.set_defaults(f=cmd_transcribe)
    s = sp.add_parser("cut"); s.add_argument("input"); s.add_argument("-o", "--output", required=True)
    s.add_argument("--noise", type=float, default=-35, help="silence threshold dB")
    s.add_argument("--min-silence", type=float, default=0.35, help="pauses longer than this are cut (s)")
    s.add_argument("--pad", type=float, default=0.08, help="breathing room kept around speech (s)")
    s.add_argument("--punch", type=float, default=1.12, help="zoom on every other cut; 1 = off")
    s.set_defaults(f=cmd_cut)
    s = sp.add_parser("captions"); s.add_argument("words"); s.add_argument("-o", "--output", default="captions.ass")
    s.add_argument("--edl", help="cut .edl.json to remap raw-take timings onto the cut")
    s.add_argument("--video", help="burn captions into this video"); s.add_argument("--burn", help="output path for burned video")
    s.add_argument("--font", default=BRAND["font"]); s.add_argument("--size", type=float, default=0.052, help="fraction of frame height")
    s.add_argument("--y", type=float, default=0.60, help="vertical centre as fraction of height (keep 0.15-0.64)")
    s.add_argument("--max-words", type=int, default=3); s.add_argument("--upper", action="store_true")
    s.add_argument("--emphasis", help="comma list of words always in accent colour")
    s.set_defaults(f=cmd_captions)
    s = sp.add_parser("mix"); s.add_argument("input"); s.add_argument("-o", "--output", required=True)
    s.add_argument("--music"); s.add_argument("--music-db", type=float, default=-18)
    s.add_argument("--sfx", help='JSON list [{"t": 1.2, "file": "whoosh.wav", "db": -10}]'); s.set_defaults(f=cmd_mix)
    s = sp.add_parser("reframe"); s.add_argument("input"); s.add_argument("-o", "--output", required=True)
    s.add_argument("--ratio", choices=["9:16", "4:5"], default="9:16"); s.add_argument("--y-bias", type=float, default=0.3)
    s.set_defaults(f=cmd_reframe)
    s = sp.add_parser("hooks"); s.add_argument("body"); s.add_argument("--hook", action="append", required=True)
    s.add_argument("--outdir", default="out"); s.add_argument("--name", default="ad"); s.set_defaults(f=cmd_hooks)
    s = sp.add_parser("safezone"); s.add_argument("input"); s.add_argument("-o", "--output", required=True); s.set_defaults(f=cmd_safezone)
    s = sp.add_parser("build"); s.add_argument("spec"); s.set_defaults(f=cmd_build)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
