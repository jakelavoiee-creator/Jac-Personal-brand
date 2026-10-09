#!/usr/bin/env python3
"""Classic viral meme: Impact-style white text with black outline, TOP and BOTTOM, on the image itself.
Keeps the image's aspect ratio (scaled to 1080 wide). Small @handle watermark.
Usage: meme_classic.py --batch memes.json IN_DIR OUT_DIR
  memes.json: {"file.png": ["TOP TEXT", "BOTTOM TEXT"], ...}   (either may be "")
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Anton-Regular.ttf")
W = 1080
MARGIN = 40


def fit_lines(draw, text, max_size, min_size=56, max_lines=3):
    """Largest font size where the text wraps into <= max_lines within the width."""
    for size in range(max_size, min_size - 1, -4):
        font = ImageFont.truetype(FONT, size)
        lines, cur = [], ""
        for w in text.split():
            t = f"{cur} {w}".strip()
            if draw.textlength(t, font=font) <= W - 2 * MARGIN:
                cur = t
            else:
                lines.append(cur); cur = w
        lines.append(cur)
        if len(lines) <= max_lines:
            return font, balance(draw, text.split(), font, len(lines))
    return font, lines


def balance(draw, words, font, n):
    """Split words into n lines minimizing the widest line (no lonely last word)."""
    if n == 1:
        return [" ".join(words)]
    best, best_w = None, 1e9
    k = len(words)
    cuts = [(i,) for i in range(1, k)] if n == 2 else [(i, j) for i in range(1, k) for j in range(i + 1, k)]
    for c in cuts:
        idx = (0,) + c + (k,)
        ls = [" ".join(words[idx[t]:idx[t + 1]]) for t in range(n)]
        w = max(draw.textlength(l, font=font) for l in ls)
        if w <= W - 2 * MARGIN and w < best_w:
            best, best_w = ls, w
    return best


def draw_block(d, text, top):
    if not text:
        return
    font, lines = fit_lines(d, text.upper(), 118)
    lh = int(font.size * 1.08)
    stroke = max(6, font.size // 13)
    y = MARGIN // 2 if top else d.im.size[1] - MARGIN - lh * len(lines)
    for ln in lines:
        x = (W - d.textlength(ln, font=font)) / 2
        d.text((x, y), ln, font=font, fill="white", stroke_width=stroke, stroke_fill="black")
        y += lh


def make(src, top, bottom, out, handle="@itsgiorgi"):
    im = Image.open(src).convert("RGB")
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    draw_block(d, top, True)
    draw_block(d, bottom, False)
    if handle:
        hf = ImageFont.truetype(FONT, 30)
        tw = d.textlength(handle, font=hf)
        d.text((W - tw - 24, im.height // 2), handle, font=hf, fill=(255, 255, 255),
               stroke_width=2, stroke_fill=(0, 0, 0))
    im.save(out, quality=94)
    return out


if __name__ == "__main__":
    _, spec, ind, outd = sys.argv[1:5]
    os.makedirs(outd, exist_ok=True)
    for name, (top, bottom) in json.load(open(spec)).items():
        print(make(os.path.join(ind, name), top, bottom,
                   os.path.join(outd, os.path.splitext(name)[0] + ".jpg")))
