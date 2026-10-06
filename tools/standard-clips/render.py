#!/usr/bin/env python3
"""Render speaker clips in the @nextstandrd reel style, branded TOO CREATIVE FOR NINE TO FIVE.

Look (measured from @nextstandrd's top reels):
  canvas   1080x1920 black; 16:9 footage full-width, vertically centred (~32% of height)
  grade    black & white, contrast up, crushed blacks, film grain, soft vignette
  captions 1-3 words at a time, Inter Display Bold, UPPERCASE, white, centred on the speaker
  ending   footage fades to black (1.6s) -> logo on black (1.4s) -> logo on white (0.4s)
           -> logo on black (0.4s) -> "TOO CREATIVE FOR NINE TO FIVE. / LIVE NOW." on white (3.2s, fades)
           with the end-card sound bed hitting on each switch.

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

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
FOOT_H = W * 9 // 16                     # 607px footage band
FOOT_Y = (H - FOOT_H) // 2               # band top
FONT = "Inter Display"                   # closest installed match to their caption face
FONT_FILE = None                          # resolved lazily via fc-match
TAGLINE = ["TOO CREATIVE FOR NINE TO FIVE.", "LIVE NOW."]
FADE_TO_BLACK = 1.6
CARD = [("logo", "black", 1.4), ("logo", "white", 0.4), ("logo", "black", 0.4), ("text", "white", 3.2)]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
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


def font_file(style="Bold"):
    return run(["fc-match", "-f", "%{file}", f"{FONT}:style={style}"]).strip()


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
    alpha = im.getchannel("A")
    if alpha.getextrema() == (255, 255):  # no transparency: treat dark pixels as the mark
        alpha = im.convert("L").point(lambda v: 255 - v)
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
        mark = tint_logo(logo, fg, 190)
        im.paste(mark, ((W - mark.width) // 2, (H - mark.height) // 2), mark)
    else:
        d = ImageDraw.Draw(im)
        f = ImageFont.truetype(font_file("Bold"), 44)
        y = H // 2 - 30
        for line in TAGLINE:
            d.text((W // 2, y), line, font=f, fill=fg, anchor="mm")
            y += 60
    im.save(path)


def cmd_endcard(a):
    tmp = Path(tempfile.mkdtemp())
    logo = a.logo or placeholder_logo(tmp / "placeholder.png")
    inputs, filters = [], []
    for i, (kind, bg, dur) in enumerate(CARD):
        p = tmp / f"card{i}.png"
        card_frame(kind, bg, logo, p)
        inputs += ["-loop", "1", "-t", str(dur), "-framerate", str(FPS), "-i", str(p)]
        vf = f"[{i}:v]format=yuv420p,setsar=1"
        if i == len(CARD) - 1:
            vf += f",fade=t=out:st={dur - 0.6}:d=0.6:color=white"
        filters.append(vf + f"[v{i}]")
    total = sum(d for _, _, d in CARD)
    concat = "".join(f"[v{i}]" for i in range(len(CARD))) + f"concat=n={len(CARD)}:v=1:a=0[v]"
    if a.sfx:
        inputs += ["-i", a.sfx]
        audio = [f"[{len(CARD)}:a]aresample=48000,apad,atrim=0:{total},afade=t=out:st={total - 0.3}:d=0.3[a]"]
    else:
        inputs += ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=48000:cl=stereo"]
        audio = [f"[{len(CARD)}:a]anull[a]"]
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters + [concat] + audio),
         "-map", "[v]", "-map", "[a]", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", a.out])
    print(f"[endcard] {a.out} ({total:.1f}s)")


# ---------------------------------------------------------------- clip

def cmd_clip(a):
    start, end = secs(a.start), secs(a.end)
    src_offset = secs(a.src_offset) if a.src_offset else 0.0   # when --src is already a section
    dur = end - start
    tmp = Path(tempfile.mkdtemp())
    ass = tmp / "caps.ass"
    words = [w for w in vtt_words(a.vtt) if start - 0.05 <= w["t"] < end] if a.vtt else []
    write_ass(chunk(words), ass, start, dur)
    logo = a.logo
    wm = []
    if logo:
        mark = tint_logo(logo, "white", 70)
        mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.55)))
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 28), mark)
        canvas.save(tmp / "wm.png")
        wm = ["-i", str(tmp / "wm.png")]
    fade_st = max(0.0, dur - FADE_TO_BLACK)
    v = (f"[0:v]scale={W}:-2,setsar=1,format=gray,eq=contrast=1.22:brightness=-0.03,"
         f"curves=all='0/0 0.12/0.04 0.5/0.48 1/0.96',noise=alls=12:allf=t,vignette=PI/5,"
         f"pad={W}:{H}:0:(oh-ih)/2:black,format=yuv420p")
    if wm:
        v += "[g];[g][2:v]overlay=0:0"
    v += (f",subtitles={ass}:fontsdir=/usr/share/fonts,fps={FPS},"
          f"fade=t=out:st={fade_st}:d={FADE_TO_BLACK}[body]")
    au = (f"[0:a]aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
          f"afade=t=in:d=0.05,afade=t=out:st={fade_st}:d={FADE_TO_BLACK}[ba]")
    inputs = ["-ss", f"{start - src_offset:.3f}", "-t", f"{dur:.3f}", "-i", a.src, "-i", a.endcard, *wm]
    graph = f"{v};{au};[1:v]setsar=1,fps={FPS}[ev];[1:a]aresample=48000[ea];[body][ba][ev][ea]concat=n=2:v=1:a=1[v][a]"
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", a.out])
    print(f"[clip] {a.out} ({dur:.1f}s + end card)")


def cmd_batch(a):
    plan = json.loads(Path(a.plan).read_text())
    base = Path(a.plan).parent
    for c in plan["clips"]:
        if a.only and c["id"] not in a.only:
            continue
        ns = argparse.Namespace(src=str(base / c["src"]), vtt=str(base / c["vtt"]) if c.get("vtt") else None,
                                start=c["start"], end=c["end"], src_offset=c.get("src_offset"),
                                endcard=str(base / plan["endcard"]), logo=plan.get("logo") and str(base / plan["logo"]),
                                out=str(base / plan["out_dir"] / f"{c['id']}.mp4"))
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
    b = sub.add_parser("batch")
    b.add_argument("plan")
    b.add_argument("--only", nargs="*")
    a = p.parse_args()
    {"endcard": cmd_endcard, "clip": cmd_clip, "batch": cmd_batch}[a.cmd](a)


if __name__ == "__main__":
    main()
