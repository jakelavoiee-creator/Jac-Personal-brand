#!/usr/bin/env python3
"""Classic meme post: white caption bar on top + image below, 1080x1350 (IG 4:5), small handle watermark.
Usage:
  meme_post.py IMAGE "top line" OUT.jpg [--handle @thebiggiorgi]
  meme_post.py --batch captions.json IN_DIR OUT_DIR      # captions.json: {"1.png": "line", ...}
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Montserrat-ExtraBold.ttf")
W, H = 1080, 1350
PAD_X, PAD_Y, SIZE, LEADING = 60, 48, 58, 1.22


def wrap(draw, text, font, maxw):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= maxw:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def make(img_path, text, out, handle="@thebiggiorgi"):
    font = ImageFont.truetype(FONT, SIZE)
    probe = ImageDraw.Draw(Image.new("RGB", (W, 10)))
    lines = wrap(probe, text, font, W - 2 * PAD_X)
    line_h = int(SIZE * LEADING)
    bar = PAD_Y * 2 + line_h * len(lines)

    src = Image.open(img_path).convert("RGB")
    box_h = H - bar
    scale = max(W / src.width, box_h / src.height)          # cover-fit, center crop
    src = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
    left, top = (src.width - W) // 2, max(0, (src.height - box_h) // 3)  # bias crop toward the top (faces)
    src = src.crop((left, top, left + W, top + box_h))

    canvas = Image.new("RGB", (W, H), "white")
    canvas.paste(src, (0, bar))
    d = ImageDraw.Draw(canvas)
    y = PAD_Y
    for ln in lines:
        d.text((PAD_X, y), ln, font=font, fill="black")
        y += line_h

    if handle:
        hf = ImageFont.truetype(FONT, 30)
        tw = d.textlength(handle, font=hf)
        x, hy = W - tw - 28, H - 58
        layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.text((x + 2, hy + 2), handle, font=hf, fill=(0, 0, 0, 110))
        ld.text((x, hy), handle, font=hf, fill=(255, 255, 255, 200))
        canvas = Image.alpha_composite(canvas.convert("RGBA"), layer).convert("RGB")
    canvas.save(out, quality=94)
    return out


if __name__ == "__main__":
    a = sys.argv[1:]
    handle = "@thebiggiorgi"
    if "--handle" in a:
        i = a.index("--handle"); handle = a[i + 1]; del a[i:i + 2]
    if a and a[0] == "--batch":
        caps, ind, outd = json.load(open(a[1])), a[2], a[3]
        os.makedirs(outd, exist_ok=True)
        for name, text in caps.items():
            o = os.path.join(outd, os.path.splitext(name)[0] + "_meme.jpg")
            print(make(os.path.join(ind, name), text, o, handle))
    else:
        print(make(a[0], a[1], a[2], handle))
