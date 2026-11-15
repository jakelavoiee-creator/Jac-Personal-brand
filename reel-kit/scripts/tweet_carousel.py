#!/usr/bin/env python3
"""Tweet-card carousel: black slide, avatar + name + handle, clean body text, optional image card.

Usage: python3 scripts/tweet_carousel.py SPEC.json OUT_DIR
Spec: {"name": "Jac", "handle": "@handle", "avatar": "carousels/avatar.png", "verified": false,
       "size": [1080, 1350],
       "slides": [{"text": "para one\n\npara two", "image": "optional/path.jpg"}]}
Paths are relative to the repo root.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
F = "/usr/share/fonts/opentype/inter/"
BG, WHITE, GREY = (0, 0, 0), (245, 245, 245), (138, 141, 145)
MARGIN = 96

def P(p): return p if os.path.isabs(p) else os.path.join(ROOT, p)

def wrap(text, font, maxw):
    lines = []
    for para in text.split("\n"):
        if not para.strip(): lines.append(""); continue
        cur = ""
        for w in para.split(" "):
            c = (cur + " " + w).strip()
            if font.getlength(c) <= maxw or not cur: cur = c
            else: lines.append(cur); cur = w
        lines.append(cur)
    return lines

def avatar(path, d):
    im = Image.open(P(path)).convert("RGB").resize((d, d), Image.LANCZOS)
    m = Image.new("L", (d * 4, d * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, d * 4, d * 4), fill=255)
    im.putalpha(m.resize((d, d), Image.LANCZOS)); return im

def badge(d, x, y, s):
    d.ellipse((x, y, x + s, y + s), fill=(29, 155, 240))
    d.line([(x + s * .28, y + s * .52), (x + s * .44, y + s * .67), (x + s * .73, y + s * .36)], fill=(255, 255, 255), width=max(3, s // 9))

def render(spec, slide, out):
    W, H = spec.get("size", [1080, 1350])
    img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)
    body = ImageFont.truetype(F + "Inter-Medium.otf", slide.get("size", spec.get("text_size", 46)))
    name_f = ImageFont.truetype(F + "Inter-Bold.otf", 44); handle_f = ImageFont.truetype(F + "Inter-Regular.otf", 40)
    lines = wrap(slide["text"], body, W - 2 * MARGIN)
    lh = int(body.size * 1.38); para_gap = int(body.size * 1.05)
    text_h = sum(para_gap if l == "" else lh for l in lines)
    av = 128; head_h = av + 52
    card = None
    if slide.get("image"):
        ci = Image.open(P(slide["image"])).convert("RGB")
        cw = W - 2 * MARGIN + 40; ch = int(cw * slide.get("image_ratio", 0.55))
        s = max(cw / ci.width, ch / ci.height); ci = ci.resize((int(ci.width * s) + 1, int(ci.height * s) + 1), Image.LANCZOS)
        fy = slide.get("focus_y", 0.5); y0 = int(min(max(ci.height * fy - ch / 2, 0), ci.height - ch)); x0 = (ci.width - cw) // 2
        card = ci.crop((x0, y0, x0 + cw, y0 + ch))
        mask = Image.new("L", (cw, ch), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw, ch), 30, fill=255)
        card.putalpha(mask)
    total = head_h + text_h + ((card.height + 56) if card else 0)
    y = spec.get("top", 190) if spec.get("fixed_top", True) else max(90, (H - total) // 2)
    img.paste(avatar(spec["avatar"], av), (MARGIN - 6, y), avatar(spec["avatar"], av))
    nx = MARGIN - 6 + av + 30
    d.text((nx, y + 20), spec["name"], font=name_f, fill=WHITE)
    if spec.get("verified"): badge(d, nx + name_f.getlength(spec["name"]) + 14, y + 26, 40)
    d.text((nx, y + 74), spec["handle"], font=handle_f, fill=GREY)
    y += head_h
    for l in lines:
        if l == "": y += para_gap; continue
        d.text((MARGIN, y), l, font=body, fill=WHITE); y += lh
    if card:
        y += 56; img.paste(card, (MARGIN - 20, y), card)
    img.save(out, optimize=True)

def main(spec_p, out_dir):
    spec = json.load(open(spec_p)); os.makedirs(out_dir, exist_ok=True)
    for i, s in enumerate(spec["slides"], 1):
        render(spec, s, os.path.join(out_dir, f"slide_{i:02d}.png"))
    print(len(spec["slides"]), "slides ->", out_dir)

if __name__ == "__main__":
    main(*sys.argv[1:3])
