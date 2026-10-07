#!/usr/bin/env python3
"""AURA "moment" reels - modelled on @hustlersrevivalofficial.

  one famous moment, 12-30s, one truth
  canvas    1080x1920 black, the 16:9 clip untouched (original colour) across the middle
  open      fades up from black
  captions  small white sentence-case, 2-3 words
  punchline the key line as big stacked type: condensed caps with blackletter accent letters
  end       black card: TOO CREATIVE FOR NINE TO FIVE

    python3 render_hr.py moments.json [id ...]

Punchline markup: lines separated by "/", a letter wrapped in [ ] is set in blackletter,
e.g. "TAKE A CHANCE / ON DOING / WHAT YOU [L]OVE".
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render as v1  # noqa: E402

HERE = Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30
FOOT_H = 608
FOOT_Y = (H - FOOT_H) // 2
FONTS = HERE / "assets" / "fonts"
COND, GOTH, SANS = FONTS / "Oswald-Bold.ttf", FONTS / "UnifrakturMaguntia.ttf", FONTS / "InterDisplay-Bold.otf"
MANTRA = "TOO CREATIVE FOR NINE TO FIVE"
END_LEN, FADE_IN = 2.2, 0.35


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{r.stderr[-2500:]}")



def punchline_png(markup, path, size=112):
    """Stacked condensed caps on a shared baseline; [x] letters drawn in blackletter, a touch larger."""
    cond, goth = ImageFont.truetype(str(COND), size), ImageFont.truetype(str(GOTH), int(size * 1.12))
    lines = [l.strip() for l in markup.split("/")]
    im = Image.new("RGBA", (W, FOOT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    parsed = []
    for line in lines:
        parts = [(m.group(1), goth) if m.group(1) else (m.group(2), cond)
                 for m in re.finditer(r"\[([^\]])\]|([^\[]+)", line)]
        parsed.append((parts, sum(d.textlength(t, font=f) for t, f in parts)))
    cap = cond.getbbox("H", anchor="ls")[1] * -1            # cap height above the baseline
    gap = int(cap * 0.32)
    block = len(parsed) * cap + (len(parsed) - 1) * gap
    base = (FOOT_H - block) // 2 + cap
    for parts, width in parsed:
        x = (W - width) / 2
        for t, f in parts:
            d.text((x + 3, base + 4), t, font=f, fill=(0, 0, 0, 150), anchor="ls")
            d.text((x, base), t, font=f, fill=(255, 255, 255, 255), anchor="ls")
            x += d.textlength(t, font=f)
        base += cap + gap
    im.save(path)


def end_card(path):
    im = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(str(COND), 66)
    d.text((W // 2, H // 2), MANTRA, font=f, fill=(255, 255, 255), anchor="mm")
    im.save(path)


def write_ass(chunks, path, dur, hide):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Inter Display,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,0,1.5,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for k, c in enumerate(chunks):
        t0 = c["t0"]
        t1 = chunks[k + 1]["t0"] if k + 1 < len(chunks) else min(dur, c["t1"] + 0.4)
        t1 = min(t1, c["t1"] + 0.5, dur)
        if hide and t0 >= hide[0] - 0.05:          # the punchline takes over the screen from here
            continue
        if hide:
            t1 = min(t1, hide[0])
        if t1 > t0:
            ev.append(f"Dialogue: 0,{v1.ass_time(t0)},{v1.ass_time(t1)},S,,0,0,0,,"
                      f"{{\\an5\\pos({W // 2},{FOOT_Y + FOOT_H // 2})}}{c['text']}")
    Path(path).write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


def build(m, base, tmp):
    src, vtt = str(base / m["src"]), str(base / m["vtt"])
    a, b, off = v1.secs(m["start"]), v1.secs(m["end"]), v1.secs(m.get("src_offset", 0))
    ws = [w for w in v1.vtt_words(vtt) if a - 0.05 <= w["t"] < b]
    keep = v1.keep_segments(src, a - off, b - a, [w["t"] - a for w in ws])
    words = [{"w": w["w"], "t": v1.remap(w["t"] - a, keep), "end": v1.remap(w["end"] - a, keep)} for w in ws]
    dur = sum(kb - ka for ka, kb in keep)
    # sentence-case small captions (the reference keeps speech as spoken, not shouted)
    chunks = v1.chunk(words, max_words=3, max_chars=20, gap=0.35)
    for c in chunks:
        c["text"] = " ".join(w["w"] for w in words if c["t0"] <= w["t"] <= c["t1"] + 1e-3) or c["text"].lower()
    p_at = None
    if m.get("punch_from"):   # first spoken word of the punchline
        cue = m["punch_from"].lower()
        hit = [w["t"] for w in words if w["w"].lower().strip(",.") == cue and w["t"] >= dur * 0.4]
        p_at = hit[0] if hit else None
    ass_rel = f"build/hr_{m['id']}.ass"
    write_ass(chunks, HERE / ass_rel, dur, (p_at, dur) if p_at is not None else None)
    punch, endc = tmp / "punch.png", tmp / "end.png"
    punchline_png(m.get("punchline", ""), punch)
    end_card(endc)
    sel = "+".join(f"between(t,{a - off + ka:.3f},{a - off + kb:.3f})" for ka, kb in keep)
    g = [f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,fps={FPS},scale={W}:-2,setsar=1,"
         f"pad={W}:{H}:0:(oh-ih)/2:black,format=yuv420p[v0]",
         f"[v0]subtitles={ass_rel}:fontsdir=assets/fonts[v1]"]
    if p_at is not None:
        g.append(f"[1:v]format=rgba,fade=t=in:st=0:d=0.12:alpha=1,setpts=PTS+{p_at:.3f}/TB[pp]")
        g.append(f"[v1][pp]overlay=0:{FOOT_Y}:enable='gte(t,{p_at:.3f})':eof_action=repeat[v2]")
    else:
        g.append("[v1]null[v2]")
    g += [f"[v2]trim=duration={dur:.3f},fade=t=in:st=0:d={FADE_IN},fade=t=out:st={dur - 0.25:.3f}:d=0.25,format=yuv420p[body]",
          f"[0:a]aselect='{sel}',asetpts=N/SR/TB,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
          f"afade=t=in:d=0.2,afade=t=out:st={dur - 0.3:.3f}:d=0.3[ba]",
          f"[2:v]format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st={END_LEN - 0.4}:d=0.4,setsar=1[ev]",
          f"anullsrc=r=48000:cl=stereo,atrim=duration={END_LEN}[ea]",
          "[body][ba][ev][ea]concat=n=2:v=1:a=1[v][a]"]
    out = base / m.get("out_dir", "out/moments") / f"{m['id']}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-loop", "1", "-t", f"{dur:.3f}", "-i", str(punch),
         "-loop", "1", "-t", str(END_LEN), "-framerate", str(FPS), "-i", str(endc),
         "-filter_complex", ";".join(g), "-map", "[v]", "-map", "[a]", "-r", str(FPS),
         "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-c:a", "aac", "-b:a", "192k", str(out)])
    print(f"[moment] {out}  {dur:.1f}s + {END_LEN}s end card")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    plan_path = (Path.cwd() / sys.argv[1]).resolve()
    plan = json.loads(plan_path.read_text())
    (HERE / "build").mkdir(exist_ok=True)
    for m in plan["moments"]:
        if sys.argv[2:] and m["id"] not in sys.argv[2:]:
            continue
        m.setdefault("out_dir", plan.get("out_dir", "out/moments"))
        build(m, plan_path.parent, Path(tempfile.mkdtemp()))


if __name__ == "__main__":
    main()
