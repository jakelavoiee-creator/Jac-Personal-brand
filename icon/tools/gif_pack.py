#!/usr/bin/env python3
"""Giorgi GIF pack for GIPHY: animated reaction GIFs from stills + loops from videos.
Each GIF: 480px, ~15fps, short Anton label (white, black outline), small @handle watermark.
Usage: gif_pack.py SPEC.json OUT_DIR
SPEC: {"stills": [{"src", "out", "label", "anim": punch|shake|push|zoomface}],
       "loops":  [{"src", "out", "label", "start", "dur"}]}
"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Anton-Regular.ttf")
HANDLE = "@thebiggiorgi"
FPS = 15


def label(img, text):
    d = ImageDraw.Draw(img)
    w, h = img.size
    if text:
        size = 64
        f = ImageFont.truetype(FONT, size)
        while d.textlength(text, font=f) > w - 40 and size > 30:
            size -= 4; f = ImageFont.truetype(FONT, size)
        x = (w - d.textlength(text, font=f)) / 2
        d.text((x, h - size * 1.35 - 14), text, font=f, fill="white", stroke_width=5, stroke_fill="black")
    hf = ImageFont.truetype(FONT, 22)
    d.text((w - d.textlength(HANDLE, font=hf) - 10, 8), HANDLE, font=hf, fill="white", stroke_width=2, stroke_fill="black")
    return img


def still_frames(src, anim, n=30, W=480, H=480, face_y=0.42):
    base = Image.open(src).convert("RGB")
    base = base.resize((W * 2, round(base.height * W * 2 / base.width)), Image.LANCZOS)
    bw, bh = base.size
    frames = []
    for i in range(n):
        t = i / (n - 1)
        dx = dy = 0
        if anim == "punch":                       # beat, then snap-zoom in and hold
            z = 1.0 + 0.3 * min(1.0, max(0.0, (t - 0.12) / 0.1))
        elif anim == "shake":                     # zoom + jitter
            z = 1.12
            dx, dy = [(-14, 6), (12, -8), (-8, -10), (14, 10), (-12, 4), (8, -6)][i % 6]
        elif anim == "push":                      # slow dolly in
            z = 1.0 + 0.18 * t
        else:                                     # zoomface: hold, then crash zoom to face
            z = 1.0 if t < 0.4 else 1.0 + 0.9 * min(1, (t - 0.4) / 0.2)
        cw = bw / z; ch = min(cw * H / W, bh)
        cx = bw / 2 + dx * 2
        cy = min(max(bh * face_y + dy * 2, ch / 2), bh - ch / 2)
        box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
        frames.append(base.crop(tuple(round(v) for v in box)).resize((W, H), Image.LANCZOS))
    return frames


def video_frames(src, start, dur, tmp, W=480):
    pat = os.path.join(tmp, "f%04d.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(dur), "-i", src,
                    "-vf", f"fps={FPS},scale={W}:-2:flags=lanczos", pat], check=True)
    fs = sorted(f for f in os.listdir(tmp) if f.startswith("f"))
    return [Image.open(os.path.join(tmp, f)).convert("RGB") for f in fs]


def write_gif(frames, out, txt):
    tmp = tempfile.mkdtemp()
    for i, fr in enumerate(frames):
        label(fr, txt).save(os.path.join(tmp, f"o{i:04d}.png"))
    pat = os.path.join(tmp, "o%04d.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", pat, "-vf",
                    "split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a",
                    "-loop", "0", out], check=True)
    print(out, f"{len(frames)}f", f"{os.path.getsize(out)/2**20:.1f}MB")


if __name__ == "__main__":
    spec, outd = json.load(open(sys.argv[1])), sys.argv[2]
    os.makedirs(outd, exist_ok=True)
    for s in spec.get("stills", []):
        write_gif(still_frames(s["src"], s["anim"], face_y=s.get("face_y", 0.42)), os.path.join(outd, s["out"]), s["label"])
    for l in spec.get("loops", []):
        write_gif(video_frames(l["src"], l["start"], l["dur"], tempfile.mkdtemp()), os.path.join(outd, l["out"]), l["label"])
