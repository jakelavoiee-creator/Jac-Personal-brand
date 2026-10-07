#!/usr/bin/env python3
"""AURA "moment" reels - the locked AURA template (modelled on @hustlersrevivalofficial).

  one famous moment, ~12-25s, one truth
  canvas    black 9:16, the 16:9 clip untouched (original colour) across the middle
  open      fades up from black
  captions  Bebas Neue Regular, big, one word at a time
  punchline the key line as big stacked type (condensed caps + blackletter accent letters), right-aligned
  mark      small AURA logo, bottom-centre of the footage, on every frame
  end       TOO CREATIVE(TM) / FOR NINE TO FIVE, centred in the footage area, AURA mark beneath

    python3 render_hr.py moments.json [id ...]          # 4K (2160x3840) by default
    python3 render_hr.py moments.json --hd [id ...]     # 1080x1920

Punchline markup: lines separated by "/", a letter wrapped in [ ] is set in blackletter,
e.g. "HOW HIGH / [I] CAN FLY". Optional per-moment "punch_align": "right" (default) | "center".
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
FONTS = HERE / "assets" / "fonts"
COND, GOTH = FONTS / "Oswald-Bold.ttf", FONTS / "UnifrakturMaguntia.ttf"
FPS, END_LEN, FADE_IN = 30, 2.2, 0.35
CAP_SIZE = 120                           # captions: Bebas Neue Regular, one word at a time, big

S = 2                                    # 2 = 4K (2160x3840), 1 = 1080x1920
W, H = 1080 * S, 1920 * S
FOOT_H = W * 9 // 16
FOOT_Y = (H - FOOT_H) // 2


def set_scale(s):
    global S, W, H, FOOT_H, FOOT_Y
    S, W, H = s, 1080 * s, 1920 * s
    FOOT_H = W * 9 // 16
    FOOT_Y = (H - FOOT_H) // 2


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{r.stderr[-2500:]}")


def stacked(d, lines, size, align, box_w, box_h, shadow=True):
    """Draw stacked condensed caps; [x] letters in blackletter. Returns nothing (draws on d)."""
    cond, goth = ImageFont.truetype(str(COND), size), ImageFont.truetype(str(GOTH), int(size * 1.12))
    parsed = []
    for line in lines:
        parts = [(m.group(1), goth) if m.group(1) else (m.group(2), cond)
                 for m in re.finditer(r"\[([^\]])\]|([^\[]+)", line)]
        parsed.append((parts, sum(d.textlength(t, font=f) for t, f in parts)))
    cap = -cond.getbbox("H", anchor="ls")[1]
    gap = int(cap * 0.30)
    block = len(parsed) * cap + (len(parsed) - 1) * gap
    base = (box_h - block) // 2 + cap
    for parts, width in parsed:
        x = box_w - width - int(box_w * 0.07) if align == "right" else (box_w - width) / 2
        for t, f in parts:
            if shadow:
                d.text((x + 2 * S, base + 3 * S), t, font=f, fill=(0, 0, 0, 140), anchor="ls")
            d.text((x, base), t, font=f, fill=(255, 255, 255, 255), anchor="ls")
            x += d.textlength(t, font=f)
        base += cap + gap


def punchline_png(markup, path, align="right"):
    im = Image.new("RGBA", (W, FOOT_H), (0, 0, 0, 0))
    lines = [l.strip() for l in markup.split("/")]
    stacked(ImageDraw.Draw(im), lines, 62 * S if align == "right" else 104 * S, align, W, FOOT_H)
    im.save(path)


def logo_mark(logo, width):
    mark = v1.tint_logo(logo, "white", width)
    mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.7)))
    return mark


def watermark_png(path, logo):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if logo:
        mark = logo_mark(logo, 64 * S)
        im.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 12 * S), mark)
    im.save(path)


def end_card(path, logo):
    """TOO CREATIVE(TM) / FOR NINE TO FIVE centred in the footage area, AURA mark beneath."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(str(COND), 50 * S)
    cy = FOOT_Y + FOOT_H // 2
    l1, l2 = "TOO CREATIVE", "FOR NINE TO FIVE"
    d.text((W // 2, cy - 4 * S), l1, font=f, fill="white", anchor="ms")
    w1 = d.textlength(l1, font=f)
    tm = ImageFont.truetype(str(COND), 15 * S)
    d.text((W // 2 + w1 / 2 + 2 * S, cy - 40 * S), "TM", font=tm, fill="white", anchor="ls")
    d.text((W // 2, cy + 52 * S), l2, font=f, fill="white", anchor="ms")
    if logo:
        mark = logo_mark(logo, 64 * S)
        im.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 12 * S), mark)
    im.convert("RGB").save(path)


def write_ass(chunks, path, dur, hide_from, hide_len=2.0):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Bebas Neue,{CAP_SIZE * S},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,{1 * S},0,1,0,{3 * S},5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for k, c in enumerate(chunks):
        t0 = c["t0"]
        t1 = chunks[k + 1]["t0"] if k + 1 < len(chunks) else min(dur, c["t1"] + 0.4)
        t1 = min(t1, c["t1"] + 0.5, dur)
        if hide_from is not None:                 # the punchline takes over while it's on screen
            if hide_from - 0.05 <= t0 < hide_from + hide_len:
                continue
            if t0 < hide_from < t1:                   # a caption already up gives way when it lands
                t1 = hide_from
        if t1 > t0:
            ev.append(f"Dialogue: 0,{v1.ass_time(t0)},{v1.ass_time(t1)},S,,0,0,0,,"
                      f"{{\\an5\\pos({W // 2},{FOOT_Y + FOOT_H // 2})}}{c['text']}")
    Path(path).write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


def build(m, base, tmp, logo):
    src, vtt = str(base / m["src"]), str(base / m["vtt"])
    a, b, off = v1.secs(m["start"]), v1.secs(m["end"]), v1.secs(m.get("src_offset", 0))
    ws = [w for w in v1.vtt_words(vtt) if a - 0.05 <= w["t"] < b]
    keep = v1.keep_segments(src, a - off, b - a, [w["t"] - a for w in ws])
    words = [{"w": w["w"], "t": v1.remap(w["t"] - a, keep), "end": v1.remap(w["end"] - a, keep)} for w in ws]
    dur = sum(kb - ka for ka, kb in keep)
    # one word per caption, held until the next word starts (or briefly after the last one)
    chunks = [{"t0": w["t"], "t1": max(w["end"], w["t"] + 0.12), "text": w["w"].strip(" ,.;:").upper()} for w in words if w["w"].strip(" ,.;:")]
    p_at = None
    if m.get("punch_from"):
        cue = m["punch_from"].lower()
        hit = [w["t"] for w in words if w["w"].lower().strip(",.!?") == cue and w["t"] >= dur * 0.3]
        p_at = hit[0] if hit else None
    p_len = float(m.get("punch_len", 2.0))       # the punchline is a beat, not a takeover
    ass_rel = f"build/hr_{m['id']}.ass"
    write_ass(chunks, HERE / ass_rel, dur, p_at, p_len)
    punch, endc, mark = tmp / "punch.png", tmp / "end.png", tmp / "mark.png"
    punchline_png(m.get("punchline", ""), punch, m.get("punch_align", "right"))
    end_card(endc, logo)
    watermark_png(mark, logo)
    sel = "+".join(f"between(t,{a - off + ka:.3f},{a - off + kb:.3f})" for ka, kb in keep)
    g = [f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,fps={FPS},scale={W}:{FOOT_H}:flags=lanczos,setsar=1,"
         f"pad={W}:{H}:0:{FOOT_Y}:black,format=yuv420p[v0]",
         f"[v0][3:v]overlay=0:0[vm]",
         f"[vm]subtitles={ass_rel}:fontsdir=assets/fonts[v1]"]
    if p_at is not None:
        g.append(f"[1:v]format=rgba,fade=t=in:st=0:d=0.1:alpha=1,setpts=PTS+{p_at:.3f}/TB[pp]")
        g.append(f"[v1][pp]overlay=0:{FOOT_Y}:enable='between(t,{p_at:.3f},{p_at + p_len:.3f})':eof_action=repeat[v2]")
    else:
        g.append("[v1]null[v2]")
    g += [f"[v2]trim=duration={dur:.3f},fade=t=in:st=0:d={FADE_IN},format=yuv420p[body]",
          f"[0:a]aselect='{sel}',asetpts=N/SR/TB,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
          f"afade=t=in:d=0.2,afade=t=out:st={dur - 0.15:.3f}:d=0.15[ba]",
          f"[2:v]format=yuv420p,fade=t=out:st={END_LEN - 0.35}:d=0.35,setsar=1[ev]",
          f"anullsrc=r=48000:cl=stereo,atrim=duration={END_LEN}[ea]",
          "[body][ba][ev][ea]concat=n=2:v=1:a=1[v][a]"]
    out = base / m.get("out_dir", "out/moments") / f"{m['id']}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-loop", "1", "-t", f"{dur:.3f}", "-i", str(punch),
         "-loop", "1", "-t", str(END_LEN), "-framerate", str(FPS), "-i", str(endc),
         "-loop", "1", "-t", f"{dur:.3f}", "-i", str(mark),
         "-filter_complex", ";".join(g), "-map", "[v]", "-map", "[a]", "-r", str(FPS),
         "-c:v", "libx264", "-crf", "16" if S == 2 else "17", "-preset", "slow", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", "-c:a", "aac", "-b:a", "256k", str(out)])
    print(f"[moment] {out}  {W}x{H}, {dur:.1f}s + {END_LEN}s end card")


def main():
    args = [a for a in sys.argv[1:] if a != "--hd"]
    if not args:
        sys.exit(__doc__)
    set_scale(1 if "--hd" in sys.argv else 2)
    plan_path = (Path.cwd() / args[0]).resolve()
    plan = json.loads(plan_path.read_text())
    logo = str(plan_path.parent / plan["logo"]) if plan.get("logo") else None
    (HERE / "build").mkdir(exist_ok=True)
    for m in plan["moments"]:
        if args[1:] and m["id"] not in args[1:]:
            continue
        m.setdefault("out_dir", plan.get("out_dir", "out/moments"))
        build(m, plan_path.parent, Path(tempfile.mkdtemp()), logo)


if __name__ == "__main__":
    main()
