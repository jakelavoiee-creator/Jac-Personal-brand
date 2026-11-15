#!/usr/bin/env python3
"""Jac signature carousel renderer: JSON spec in, 1080x1350 (4:5) PNG slides out.

Usage: python3 scripts/carousel.py SPEC.json OUT_DIR

Spec: {"handle": "", "slides": [{"bg": "path.jpg" | "black", "dim": 0.55, "focus_y": 0.5,
        "y": 0.30, "blocks": [{"t": "text", "s": "sans|hero|small|quote"}], "swipe": false}]}
Locked system (SIGNATURE.md): Inter Black + Instrument Serif Italic (cream glow),
black-and-white cosmic imagery, grain, slide counter, the light is the soul.
"""
import json, os, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1350
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANS = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
SANS_MED = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
SERIF = os.path.join(KIT, "assets/fonts/instrumentserif/InstrumentSerif-Italic.ttf")
WHITE, CREAM, MUTED = (255, 255, 255), (255, 236, 200), (200, 196, 188)
MARGIN = 110            # keeps text inside Instagram's 3:4 grid crop (1012 px wide)
MAXW = W - 2 * MARGIN
STYLE = {  # font, size, color, line height factor, glow
    "sans":  (SANS, 62, WHITE, 1.16, 8),
    "hero":  (SERIF, 132, CREAM, 0.98, 18),
    "quote": (SERIF, 84, CREAM, 1.05, 14),
    "small": (SANS_MED, 36, MUTED, 1.35, 0),
}

def font(s): f, size, *_ = STYLE[s]; return ImageFont.truetype(f, size)

def wrap(text, fnt, maxw):
    out = []
    for para in text.split("\n"):
        line = ""
        for w in para.split(" "):
            cand = (line + " " + w).strip()
            if fnt.getlength(cand) <= maxw or not line: line = cand
            else: out.append(line); line = w
        out.append(line)
    return out

def background(spec):
    bg = spec.get("bg", "black")
    if bg == "black":
        img = Image.new("RGB", (W, H), (6, 6, 8))
        rnd = random.Random(spec.get("seed", 7)); d = ImageDraw.Draw(img)
        for _ in range(420):   # quiet starfield
            x, y = rnd.randrange(W), rnd.randrange(H); v = rnd.randint(60, 200); r = rnd.choice([0, 0, 0, 1])
            d.ellipse((x - r, y - r, x + r, y + r), fill=(v, v, v))
    else:
        src = Image.open(os.path.join(KIT, bg)).convert("RGB")
        s = max(W / src.width, H / src.height) * spec.get("zoom", 1.0)
        src = src.resize((int(src.width * s) + 1, int(src.height * s) + 1), Image.LANCZOS)
        fy = spec.get("focus_y", 0.5)
        x0 = (src.width - W) // 2; y0 = int(min(max(src.height * fy - H / 2, 0), src.height - H))
        img = src.crop((x0, y0, x0 + W, y0 + H)).convert("L").convert("RGB")
    a = np.asarray(img).astype(np.float32)
    a *= 1 - spec.get("dim", 0.45)
    a *= np.array([1.03, 1.0, 0.95])  # faint warm tint, same look as the reels
    yy, xx = np.mgrid[0:H, 0:W]
    a *= (1 - 0.45 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2)).clip(0.25, 1)[..., None]
    a += np.random.default_rng(3).normal(0, 7, (H, W, 1))
    return Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert("RGBA")

def text_layer(spec):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    lines = []
    for b in spec["blocks"]:
        f = font(b["s"]); _, _, col, lh, glow = STYLE[b["s"]]
        for ln in wrap(b["t"], f, MAXW): lines.append((ln, f, col, int(f.size * lh), glow, b.get("indent", 0)))
        lines.append(None)  # gap between blocks
    if lines and lines[-1] is None: lines.pop()
    gap = 34
    total = sum(l[3] if l else gap for l in lines)
    y = int(H * spec.get("y", 0.5) - total / 2) if spec.get("center_v", True) else int(H * spec.get("y", 0.3))
    glow_l = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow_l)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shadow)
    for l in lines:
        if l is None: y += gap; continue
        ln, f, col, lh, glow, ind = l
        x = MARGIN + ind
        d.text((x, y), ln, font=f, fill=col + (255,))
        sd.text((x, y + 3), ln, font=f, fill=(0, 0, 0, 170))
        if glow: g.text((x, y), ln, font=f, fill=col + (200,))
        y += lh
    out = Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)), glow_l.filter(ImageFilter.GaussianBlur(16)))
    return Image.alpha_composite(out, layer)

def chrome(img, n, total, spec, handle):
    d = ImageDraw.Draw(img); f = ImageFont.truetype(SANS_MED, 30)
    tag = f"{n:02d} / {total:02d}"
    d.text((W - MARGIN - f.getlength(tag), 70), tag, font=f, fill=(210, 205, 196, 200))
    sig = ImageFont.truetype(SERIF, 44)
    d.text((MARGIN, H - 120), handle or "jac", font=sig, fill=CREAM + (220,))
    if spec.get("swipe"):
        s = "swipe  →"; d.text((W - MARGIN - f.getlength(s), H - 108), s, font=f, fill=(230, 225, 215, 230))
    return img

def main(spec_p, out_dir):
    spec = json.load(open(spec_p)); os.makedirs(out_dir, exist_ok=True)
    slides = spec["slides"]
    for i, s in enumerate(slides, 1):
        img = Image.alpha_composite(background(s), text_layer(s))
        img = chrome(img, i, len(slides), s, spec.get("handle", ""))
        img.convert("RGB").save(os.path.join(out_dir, f"slide_{i:02d}.png"), optimize=True)
    print(f"{len(slides)} slides -> {out_dir}")

if __name__ == "__main__":
    main(*sys.argv[1:3])
