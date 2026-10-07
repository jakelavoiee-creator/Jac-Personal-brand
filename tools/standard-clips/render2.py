#!/usr/bin/env python3
"""AURA v2 reels, modelled on the 1M-view AURA reel.

  frame     rounded, glowing-edged window on a dark textured background with a faint AURA pattern
  pacing    cold-open hook line, then the lesson; film b-roll cut in every ~2s while the voice runs
  captions  kinetic: heavy font, 1-3 words, pop-in, key words in yellow/red, slight tilt
  series    "AURA · LESSON NN" tag above the frame, AURA mark below it
  ending    none - the reel ends on the speaker's last line and loops (music is added in Instagram)

    python3 render2.py reel.json            # renders every reel in the plan
"""
import json
import random
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render as v1  # noqa: E402  vtt_words, chunk, keep_segments, remap, secs, tint_logo, font_file

HERE = Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30
WIN_W, WIN_H, WIN_Y = 960, 1080, 400      # the rounded window
YELLOW, RED, WHITE = "&H0000D4FF&", "&H002A2AFF&", "&H00FFFFFF&"   # ASS colours are BGR
POWER = set("""god light soul heart love faith fear believe belief truth never always everything nothing
inside within become better more change life purpose free mind power universe creator dream dreams
yourself you you're your success wealth peace alive real destiny miracle miracles skills problems easier""".split())


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{r.stderr[-2500:]}")


# ---------------------------------------------------------------- static layers

def background(path, logo):
    rnd = random.Random(3)
    im = Image.new("RGB", (W, H), (9, 9, 11))
    noise = Image.effect_noise((W, H), 18).convert("RGB")
    im = Image.blend(im, noise, 0.06)
    if logo:   # faint repeating AURA marks, like the symbol pattern behind the reference reel
        mark = v1.tint_logo(logo, "white", 120)
        mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.05)))
        for y in range(40, H, 170):
            for x in range(-60 + (y // 170 % 2) * 90, W, 190):
                im.paste(mark, (x + rnd.randint(-8, 8), y), mark)
    im.save(path)


def window_mask(path):
    m = Image.new("L", (WIN_W, WIN_H), 0)
    ImageDraw.Draw(m).rounded_rectangle((26, 26, WIN_W - 26, WIN_H - 26), radius=90, fill=255)
    m.filter(ImageFilter.GaussianBlur(16)).save(path)    # soft, glowing edge


def chrome(path, lesson, logo):
    """Series tag above the window + AURA mark below it (transparent overlay)."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(v1.font_file("Black"), 50)
    tag = f"AURA  ·  LESSON {lesson:02d}"
    d.text((W // 2, WIN_Y - 70), tag, font=f, fill=(255, 255, 255, 235), anchor="mm")
    if logo:
        mark = v1.tint_logo(logo, "white", 330)
        mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.9)))
        im.paste(mark, ((W - mark.width) // 2, WIN_Y + WIN_H + 70), mark)
    im.save(path)


# ---------------------------------------------------------------- kinetic captions

def styled(text, k):
    words = text.split()
    key = max(range(len(words)), key=lambda i: (re.sub(r"[^a-z']", "", words[i].lower()) in POWER, len(words[i])))
    accent = YELLOW if k % 3 else RED
    has_power = re.sub(r"[^a-z']", "", words[key].lower()) in POWER or len(words[key]) >= 7
    out = []
    for i, w in enumerate(words):
        out.append(f"{{\\c{accent}\\fs96}}{w}{{\\c{WHITE}\\fs80}}" if (i == key and has_power) else w)
    return " ".join(out)


def write_ass(chunks, path, dur):
    rnd = random.Random(11)
    cy = WIN_Y + WIN_H // 2 + 60
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: K,Inter Display Black,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,-1,0,1,3,5,5,90,90,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for k, c in enumerate(chunks):
        t0 = c["t0"]
        t1 = chunks[k + 1]["t0"] if k + 1 < len(chunks) else min(dur, c["t1"] + 0.4)
        if t1 <= t0:
            continue
        y = cy + rnd.randint(-70, 70)
        rot = rnd.choice([-4, -2, 0, 0, 2, 4])
        pop = "\\fscx70\\fscy70\\t(0,90,\\fscx110\\fscy110)\\t(90,170,\\fscx100\\fscy100)"
        ev.append(f"Dialogue: 0,{v1.ass_time(t0)},{v1.ass_time(t1)},K,,0,0,0,,"
                  f"{{\\an5\\pos({W // 2},{y})\\frz{rot}{pop}}}{styled(c['text'], k)}")
    Path(path).write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- reel

def build(reel, plan_dir, tmp):
    src = str(plan_dir / reel["src"])
    vtt = str(plan_dir / reel["vtt"])
    words_all = v1.vtt_words(vtt)

    # Segments of the source to play, in order: optional cold-open hook, then the lesson.
    parts = ([(v1.secs(reel["hook"][0]), v1.secs(reel["hook"][1]))] if reel.get("hook") else []) + \
            [(v1.secs(reel["start"]), v1.secs(reel["end"]))]
    off = v1.secs(reel.get("src_offset", 0))
    timeline, words, t = [], [], 0.0          # timeline: (source_a, source_b) pieces after dead-space cuts
    for a, b in parts:
        ws = [w for w in words_all if a - 0.05 <= w["t"] < b]
        keep = v1.keep_segments(src, a - off, b - a, [w["t"] - a for w in ws])
        for w in ws:
            words.append({"w": w["w"], "t": t + v1.remap(w["t"] - a, keep), "end": t + v1.remap(w["end"] - a, keep)})
        for ka, kb in keep:
            timeline.append((a + ka - off, a + kb - off))
        t += sum(kb - ka for ka, kb in keep)
    dur = t
    chunks = v1.chunk(words, max_words=3, max_chars=16, gap=0.3)

    # B-roll schedule: speaker for the hook and the last line; film shots every other beat between.
    shots = reel.get("broll", [])
    first = (v1.secs(reel["hook"][1]) - v1.secs(reel["hook"][0]) + 0.6) if reel.get("hook") else 2.5
    sched, at, i = [], first, 0
    starts = [c["t0"] for c in chunks]
    while i < len(shots) and at < dur - 3.0:
        cue = shots[i].get("on")    # optional: cut to this shot on the first beat containing this word
        if cue:
            hit = [c["t0"] for c in chunks if c["t0"] >= at and cue.lower() in c["text"].lower()]
            s0 = hit[0] if hit else None
        else:
            s0 = min((x for x in starts if x >= at), default=None)
        if s0 is None or s0 > dur - 3.0:
            if cue:          # cue word already passed or absent: skip just this shot
                i += 1
                continue
            break
        length = shots[i].get("dur", 2.0)
        sched.append((s0, min(length, dur - 2.5 - s0), shots[i]))
        at = s0 + length + (0.25 if cue else 1.8)   # back on the speaker before the next cut
        i += 1

    # Inputs: 0 = speaker source, 1.. = b-roll shots, then background, mask, chrome.
    inputs = ["-i", src]
    for _, d, s in sched:
        inputs += ["-ss", f"{v1.secs(s['from']):.2f}", "-t", f"{d + 0.1:.2f}", "-i", str(plan_dir / s["src"])]
    nb = len(sched)
    bg, mask, chr_ = tmp / "bg.png", tmp / "mask.png", tmp / "chrome.png"
    logo = str(plan_dir / reel["logo"]) if reel.get("logo") else None
    background(bg, logo)
    window_mask(mask)
    chrome(chr_, reel.get("lesson", 1), logo)
    inputs += ["-loop", "1", "-i", str(bg), "-loop", "1", "-i", str(mask), "-loop", "1", "-i", str(chr_)]
    ib, im_, ic = nb + 1, nb + 2, nb + 3

    fit = f"scale={WIN_W}:{WIN_H}:force_original_aspect_ratio=increase,crop={WIN_W}:{WIN_H},setsar=1"
    grade = "eq=contrast=1.08:saturation=1.12,format=yuv420p"
    sel = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in timeline)
    g = [f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,fps={FPS},{fit},{grade}[base]",
         f"[0:a]aselect='{sel}',asetpts=N/SR/TB,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
         f"afade=t=in:d=0.04,afade=t=out:st={max(0, dur - 0.05):.2f}:d=0.05[aout]"]
    last = "base"
    for j, (s0, d, _) in enumerate(sched, start=1):
        g.append(f"[{j}:v]fps={FPS},{fit},{grade},setpts=PTS-STARTPTS+{s0:.3f}/TB[b{j}]")
        g.append(f"[{last}][b{j}]overlay=0:0:enable='between(t,{s0:.3f},{s0 + d:.3f})':eof_action=pass[v{j}]")
        last = f"v{j}"
    ass_rel = f"build/k_{reel['id']}.ass"
    write_ass(chunks, HERE / ass_rel, dur)
    g += [f"[{im_}:v]format=gray,scale={WIN_W}:{WIN_H}[m]",
          f"[{last}]format=rgba[vr];[vr][m]alphamerge[win]",
          f"[{ib}:v]scale={W}:{H},format=rgba[bgr]",
          f"[bgr][win]overlay=(W-w)/2:{WIN_Y}:shortest=1[c1]",
          f"[c1][{ic}:v]overlay=0:0:shortest=1,subtitles={ass_rel}:fontsdir=assets/fonts,"
          f"trim=duration={dur:.3f},format=yuv420p[vout]"]
    out = plan_dir / reel.get("out_dir", "out/v2") / f"{reel['id']}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(g), "-map", "[vout]", "-map", "[aout]",
         "-r", str(FPS), "-c:v", "libx264", "-crf", "19", "-maxrate", "8M", "-bufsize", "16M", "-preset", "medium",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", "-t", f"{dur:.3f}", str(out)])
    print(f"[v2] {out}  {dur:.1f}s, {len(chunks)} caption beats, {nb} b-roll cuts")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    plan_path = (Path.cwd() / sys.argv[1]).resolve()
    plan = json.loads(plan_path.read_text())
    only = sys.argv[2:]
    (HERE / "build").mkdir(exist_ok=True)
    for reel in plan["reels"]:
        if only and reel["id"] not in only:
            continue
        reel.setdefault("logo", plan.get("logo"))
        reel.setdefault("out_dir", plan.get("out_dir", "out/v2"))
        build(reel, plan_path.parent, Path(tempfile.mkdtemp()))


if __name__ == "__main__":
    main()
