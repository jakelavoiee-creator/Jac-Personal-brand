#!/usr/bin/env python3
"""Render speaker clips in the @nextstandrd reel style, branded TOO CREATIVE FOR NINE TO FIVE.

Look (measured from @nextstandrd's top reels):
  canvas   1080x1920 black; 16:9 footage full-width, vertically centred (~32% of height)
  grade    original colour, contrast up slightly, luma film grain, soft vignette
  captions 1-3 words at a time, Inter Display Bold, UPPERCASE, white, centred on the speaker
  ending   footage + audio fade to black (0.6s) -> logo centred on black, fading in and out (2.4s),
           with the end-card sound underneath.

Usage:
  python3 render.py endcard --logo logo.png --sfx endcard_sfx.wav --out build/endcard.mp4
  python3 render.py clip --src video.mp4 --vtt captions.vtt --start 7:04 --end 7:27 \
        --endcard build/endcard.mp4 [--logo logo.png] --out out/01-denzel.mp4
  python3 render.py batch clips.json          # renders every clip in the plan
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
FOOT_H = W * 9 // 16                     # 607px footage band
FOOT_Y = (H - FOOT_H) // 2               # band top
FONT = "Inter Display"                   # closest installed match to their caption face
CLIP_PAD = 3.0         # seconds fetch.py keeps either side of a clip when downloading only that section
SFX_TRIM = 1.0          # sound bed was timed to a 1.4s first card; trimmed so hits stay on the switches
CARD = [("logo", "black", 2.4)]   # simple ending: logo centred on black, fades in and out
END_FADE = 0.6                    # footage fades to black over the last 0.6s


def run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    if r.returncode:
        sys.exit(f"command failed: {' '.join(map(str, cmd[:6]))}...\n{r.stderr[-2000:]}")
    return r.stdout


def secs(t):
    t = str(t)
    parts = [float(p) for p in t.split(":")]
    s = 0.0
    for p in parts:
        s = s * 60 + p
    return s


HERE = Path(__file__).resolve().parent
FONTS = HERE / "assets" / "fonts"   # bundled Inter Display (SIL OFL) so renders match on every machine


def font_file(style="Bold"):
    return str(FONTS / f"InterDisplay-{style}.otf")


# ---------------------------------------------------------------- captions

def vtt_words(path):
    """Word-level timings from a YouTube auto-caption VTT (<00:00:01.234><c> word</c>)."""
    words, seen_cues = [], set()
    text = Path(path).read_text(encoding="utf-8")
    for block in text.split("\n\n"):
        m = re.search(r"(\d+:\d+:\d+\.\d+) --> (\d+:\d+:\d+\.\d+)", block)
        if not m or "<c>" not in block:
            continue
        line = [l for l in block.split("\n") if "<c>" in l][0]
        start = secs(m.group(1))
        if (start, line) in seen_cues:
            continue
        seen_cues.add((start, line))
        first = re.match(r"^([^<]+)", line)
        toks = []
        if first and first.group(1).strip():
            toks.append((start, first.group(1).strip()))
        for ts, w in re.findall(r"<(\d+:\d+:\d+\.\d+)><c>\s*([^<]+)</c>", line):
            toks.append((secs(ts), w.strip()))
        words.extend(toks)
    if not words:                                      # hand-made captions: no per-word times, spread each cue's words
        words = cue_words(text)
    words.sort()
    out = []
    for i, (t, w) in enumerate(words):
        if out and abs(out[-1]["t"] - t) < 1e-3 and out[-1]["w"] == w:
            continue
        out.append({"t": t, "w": w})
    for i, w in enumerate(out):
        w["end"] = out[i + 1]["t"] if i + 1 < len(out) else w["t"] + 0.5
        w["end"] = min(w["end"], w["t"] + 0.9)
    return out


def cue_words(text):
    """(time, word) from a plain VTT: each cue's words spread over the cue, longer words get more time."""
    toks = []
    for block in text.split("\n\n"):
        m = re.search(r"(\d+:\d+:\d+\.\d+) --> (\d+:\d+:\d+\.\d+)", block)
        if not m:
            continue
        body = " ".join(l for l in block.split("\n")[1:] if "-->" not in l)
        body = re.sub(r"<[^>]+>|\[[^\]]*\]|\([^)]*\)|♪", " ", body)
        ws = [w for w in re.sub(r"(^|\s)-(?=\S)", " ", body).split() if re.search(r"\w", w)]
        if not ws:
            continue
        t0, t1 = secs(m.group(1)), secs(m.group(2))
        total, at = sum(len(w) + 2 for w in ws), t0
        for w in ws:
            toks.append((round(at, 3), w))
            at += (t1 - t0) * (len(w) + 2) / total
    return toks


def chunk(words, max_words=3, max_chars=18, gap=0.35):
    groups, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or gap < w["t"] - cur[-1]["end"]
                    or len(" ".join(x["w"] for x in cur + [w])) > max_chars):
            groups.append(cur)
            cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return [{"t0": g[0]["t"], "t1": g[-1]["end"], "text": " ".join(x["w"] for x in g).upper()} for g in groups]


def ass_time(s):
    s = max(0.0, s)
    return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"


def write_ass(chunks, path, offset, duration):
    y = FOOT_Y + int(FOOT_H * 0.60)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,-1,0,1,0,1.2,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for i, c in enumerate(chunks):
        t0 = c["t0"] - offset
        t1 = (chunks[i + 1]["t0"] - offset) if i + 1 < len(chunks) else c["t1"] - offset + 0.3
        t1 = min(t1, c["t1"] - offset + 0.6, duration)
        if t1 <= 0 or t0 >= duration:
            continue
        text = c["text"].replace("{", "").replace("}", "")
        lines.append(f"Dialogue: 0,{ass_time(t0)},{ass_time(t1)},Cap,,0,0,0,,{{\\pos({W // 2},{y})}}{text}")
    Path(path).write_text(head + "\n".join(lines) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- brand assets

def tint_logo(logo, color, width):
    """Logo as a solid-colour silhouette (white on black cards, black on white cards)."""
    im = Image.open(logo).convert("RGBA")
    alpha, luma = im.getchannel("A"), im.convert("L")
    # The mark is whichever tone dominates the opaque pixels; the other tone is a knockout
    # (e.g. the white "miami" inside AURA's A) and stays transparent on both card colours.
    hist = luma.histogram(mask=alpha.point(lambda v: 255 if v > 128 else 0))
    dark_mark = sum(hist[:128]) >= sum(hist[128:])
    tone = luma.point(lambda v: 255 - v) if dark_mark else luma
    alpha = ImageChops.multiply(alpha, tone)
    fill = Image.new("RGBA", im.size, (255, 255, 255, 255) if color == "white" else (0, 0, 0, 255))
    fill.putalpha(alpha)
    bbox = alpha.getbbox() or (0, 0, *im.size)
    fill = fill.crop(bbox)
    h = int(fill.height * width / fill.width)
    return fill.resize((width, h), Image.LANCZOS)


def placeholder_logo(path):
    """Stand-in mark until the real TOO CREATIVE FOR NINE TO FIVE logo is dropped in."""
    f = ImageFont.truetype(font_file("Black"), 150)
    im = Image.new("RGBA", (900, 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((450, 110), "TC9—5", font=f, fill=(255, 255, 255, 255), anchor="mm")
    im = im.transform(im.size, Image.AFFINE, (1, 0.28, -30, 0, 1, 0), Image.BICUBIC)  # italic shear
    im.save(path)
    return path


def card_frame(kind, bg, logo, path):
    im = Image.new("RGB", (W, H), bg)
    fg = "black" if bg == "white" else "white"
    if kind == "logo":
        mark = tint_logo(logo, fg, 560)
        im.paste(mark, ((W - mark.width) // 2, (H - mark.height) // 2), mark)
    else:
        f = ImageFont.truetype(font_file("Bold"), 44)
        ImageDraw.Draw(im).text((W // 2, H // 2), kind, font=f, fill=fg, anchor="mm")
    im.save(path)


def synth_hits(path, total):
    """Original end-card VFX: a punchy impact on every card switch, a bigger final hit with a
    ringing tail on the last card. No music bed."""
    import wave
    import numpy as np
    sr = 48000
    out = np.zeros(int(sr * total) + sr)
    times = [0.0]
    for _, _, d in CARD[:-1]:
        times.append(times[-1] + d)
    rng = np.random.default_rng(7)

    def hit(at, big=False):
        n = int(sr * (2.2 if big else 0.45))
        t = np.arange(n) / sr
        f = 42 + (150 if big else 110) * np.exp(-t * 28)          # pitch-dropping sub thump
        body = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t * (2.2 if big else 9))
        click = rng.standard_normal(n) * np.exp(-t * 180)          # transient snap
        air = np.convolve(rng.standard_normal(n), np.ones(24) / 24, "same") * np.exp(-t * (1.6 if big else 14))
        ring = (np.sin(2 * np.pi * 880 * t) + 0.5 * np.sin(2 * np.pi * 1320 * t)) * np.exp(-t * 2.5) * 0.08 if big else 0
        sig = 0.9 * body + 0.35 * click + 0.25 * air + ring
        i = int(sr * at)
        out[i:i + n] += sig[:len(out) - i]

    for k, at in enumerate(times):
        hit(at, big=(k == len(times) - 1))
    out = out[: int(sr * total)]
    out *= 0.89 / (np.abs(out).max() + 1e-9)
    pcm = (np.repeat(out[:, None], 2, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return path


def cmd_endcard(a):
    tmp = Path(tempfile.mkdtemp())
    logo = a.logo or placeholder_logo(tmp / "placeholder.png")
    inputs, filters = [], []
    for i, (kind, bg, dur) in enumerate(CARD):
        p = tmp / f"card{i}.png"
        card_frame(kind, bg, logo, p)
        inputs += ["-loop", "1", "-t", str(dur), "-framerate", str(FPS), "-i", str(p)]
        vf = f"[{i}:v]format=yuv420p,setsar=1"
        if i == 0:
            vf += f",fade=t=in:d=0.3:color={bg}"
        if i == len(CARD) - 1:
            vf += f",fade=t=out:st={dur - 0.6}:d=0.6:color={bg}"
        filters.append(vf + f"[v{i}]")
    total = sum(d for _, _, d in CARD)
    concat = "".join(f"[v{i}]" for i in range(len(CARD))) + f"concat=n={len(CARD)}:v=1:a=0[v]"
    if a.sfx:  # a supplied sound bed (trimmed to the card timing)
        inputs += ["-ss", str(SFX_TRIM), "-i", a.sfx]
    else:      # default: original synthesized hits, no music
        inputs += ["-i", str(synth_hits(tmp / "hits.wav", total))]
    audio = [f"[{len(CARD)}:a]aresample=48000,apad,atrim=0:{total},afade=t=out:st={total - 0.3}:d=0.3[a]"]
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters + [concat] + audio),
         "-map", "[v]", "-map", "[a]", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", a.out])
    print(f"[endcard] {a.out} ({total:.1f}s)")



# ---------------------------------------------------------------- dead space

GAP_MIN, GAP_PAD, FLOOR_LIFT = 0.35, 0.10, 8   # cut pauses > 0.35s; "silence" = noise floor + 8dB


def keep_segments(src, start, dur, word_times=()):
    """Speech segments (relative to clip start) with the speaker's dead space removed.
    word_times: caption word starts (clip-relative); a cut never swallows one."""
    import numpy as np
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vn",
                          "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    hop = 320  # 20ms frames
    n = len(x) // hop
    if n == 0:
        return [(0.0, dur)]
    db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-6)
    quiet = db < np.percentile(db, 10) + FLOOR_LIFT
    starts, ends, i = [], [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.02 >= GAP_MIN:
                starts.append(i * 0.02)
                ends.append(j * 0.02)
            i = j
        else:
            i += 1
    cuts = []
    for s0, s1 in zip(starts, ends + [dur] * (len(starts) - len(ends))):
        a, b = max(0.0, s0 + GAP_PAD), min(dur, s1 - GAP_PAD)
        inside = [w for w in word_times if a - 0.05 <= w <= b]
        if inside:  # quiet word in the "silence": keep it, only cut the gap before it
            b = min(inside) - GAP_PAD
        if b - a > 0.15:
            cuts.append((a, b))
    keep, t = [], 0.0
    for a, b in cuts:
        if a > t:
            keep.append((t, a))
        t = b
    if t < dur:
        keep.append((t, dur))
    return keep or [(0.0, dur)]


def detect_bars(src, start, dur):
    """crop= filter that removes baked-in black bars from the source, or '' if there are none."""
    out = subprocess.run(["ffmpeg", "-v", "info", "-ss", f"{start:.3f}", "-t", f"{min(dur, 20):.3f}", "-i", src,
                          "-vf", "cropdetect=limit=24:round=2", "-an", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    found = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", out)
    size = re.search(r"Stream.*Video.*?, (\d{2,5})x(\d{2,5})", out)
    if not found or not size:
        return ""
    w, h, x, y = max(set(found), key=found.count)
    iw, ih = int(size.group(1)), int(size.group(2))
    if int(w) < iw * 0.96 or int(h) < ih * 0.96:
        return f"crop={w}:{h}:{x}:{y},"
    return ""


def remap(t, keep):
    """Clip-relative time -> time after dead space removal."""
    acc = 0.0
    for a, b in keep:
        if t < a:
            return acc
        if t <= b:
            return acc + t - a
        acc += b - a
    return acc


# ---------------------------------------------------------------- clip

def cmd_clip(a):
    a.out, a.src, a.endcard = (str(Path(x).resolve()) for x in (a.out, a.src, a.endcard))
    start, end = secs(a.start), secs(a.end)
    src_offset = secs(a.src_offset) if a.src_offset else 0.0   # when --src is already a section
    raw = end - start
    words = [w for w in vtt_words(a.vtt) if start - 0.05 <= w["t"] < end] if a.vtt else []
    keep = keep_segments(a.src, start - src_offset, raw, [w["t"] - start for w in words])
    dur = sum(b - a_ for a_, b in keep)
    tmp = Path(tempfile.mkdtemp())
    # Captions live under build/ and are referenced relative to HERE: absolute Windows paths ("C:\\...")
    # break ffmpeg's subtitles filter.
    (HERE / "build").mkdir(exist_ok=True)
    ass_rel = f"build/caps_{Path(a.out).stem}.ass"
    ass = HERE / ass_rel
    for w in words:  # move caption timing onto the tightened timeline
        w["t"], w["end"] = remap(w["t"] - start, keep), remap(w["end"] - start, keep)
    write_ass(chunk(words), ass, 0.0, dur)
    sel = "+".join(f"between(t,{a_:.3f},{b:.3f})" for a_, b in keep)
    logo = a.logo
    wm = []
    if logo:
        mark = tint_logo(logo, "white", 150)
        mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.55)))
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 28), mark)
        canvas.save(tmp / "wm.png")
        wm = ["-i", str(tmp / "wm.png")]
    zoom = float(getattr(a, "zoom", None) or 1.0)   # >1 crops in from the top, e.g. to drop a burned-in timecode
    crop = detect_bars(a.src, start - src_offset, raw)
    crop += f"crop=iw/{zoom}:ih/{zoom}:(iw-ow)/2:0," if zoom > 1 else ""
    v = (f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,{crop}scale={W}:-2,setsar=1,eq=contrast=1.12:brightness=-0.02:saturation=1.0,"
         f"curves=all='0/0 0.12/0.04 0.5/0.48 1/0.96',noise=c0s=10:c0f=t,vignette=PI/5,"
         f"pad={W}:{H}:0:(oh-ih)/2:black,format=yuv420p")
    if wm:
        v += "[g];[g][2:v]overlay=0:0"
    v += (f",subtitles={ass_rel}:fontsdir=assets/fonts,fps={FPS},"
          f"fade=t=out:st={max(0.0, dur - END_FADE)}:d={END_FADE}[body]")  # fade to black into the logo
    au = (f"[0:a]aselect='{sel}',asetpts=N/SR/TB,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
          f"afade=t=in:d=0.05,afade=t=out:st={max(0.0, dur - END_FADE)}:d={END_FADE}[ba]")
    inputs = ["-ss", f"{start - src_offset:.3f}", "-t", f"{raw:.3f}", "-i", a.src, "-i", a.endcard, *wm]
    graph = f"{v};{au};[1:v]setsar=1,fps={FPS}[ev];[1:a]aresample=48000[ea];[body][ba][ev][ea]concat=n=2:v=1:a=1[v][a]"
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "19", "-maxrate", "6M", "-bufsize", "12M", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", a.out], cwd=HERE)
    print(f"[clip] {a.out} ({raw:.1f}s -> {dur:.1f}s after {len(keep) - 1} dead-space cuts, + end card)")


def cmd_batch(a):
    plan = json.loads(Path(a.plan).read_text())
    base = Path(a.plan).parent
    for c in plan["clips"]:
        if a.only and c["id"] not in a.only:
            continue
        ns = argparse.Namespace(src=str(base / c["src"]), vtt=str(base / c["vtt"]) if c.get("vtt") else None,
                                start=c["start"], end=c["end"], src_offset=c.get("src_offset"), zoom=c.get("zoom"),
                                endcard=str(base / plan["endcard"]), logo=plan.get("logo") and str(base / plan["logo"]),
                                out=str(base / plan["out_dir"] / f"{c['id']}.mp4"))
        cut = base / "sources" / "clips" / f"{c['id']}.mp4"   # fetch.py's per-clip download (start - CLIP_PAD)
        if not Path(ns.src).exists() and cut.exists():
            ns.src, ns.src_offset = str(cut), str(max(0.0, secs(c["start"]) - CLIP_PAD))
        if not Path(ns.src).exists():
            print(f"[skip] {c['id']}: missing source {ns.src}")
            continue
        cmd_clip(ns)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("endcard")
    e.add_argument("--logo")
    e.add_argument("--sfx")
    e.add_argument("--out", default="build/endcard.mp4")
    c = sub.add_parser("clip")
    for f in ("--src", "--start", "--end", "--endcard", "--out"):
        c.add_argument(f, required=True)
    c.add_argument("--vtt")
    c.add_argument("--logo")
    c.add_argument("--src-offset", help="timestamp in the original video where --src begins")
    c.add_argument("--zoom", help="crop in from the top by this factor (e.g. 1.18) to remove burned-in overlays")
    b = sub.add_parser("batch")
    b.add_argument("plan")
    b.add_argument("--only", nargs="*")
    a = p.parse_args()
    {"endcard": cmd_endcard, "clip": cmd_clip, "batch": cmd_batch}[a.cmd](a)


if __name__ == "__main__":
    main()
