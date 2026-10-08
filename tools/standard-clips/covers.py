#!/usr/bin/env python3
"""AURA reel covers: one photo per speaker, a new headline per reel.

    python covers.py ig.json                 # every reel in the plan
    python covers.py ig.json a01-... a07-...  # just these

  canvas    1080x1920, black-to-grey grain gradient (assets/cover_bg.jpg)
  headline  condensed Times italic lowercase line, its LAST word huge in Akzidenz-Grotesk bold caps (+ @aura.miamii)
  photo     the speaker in black & white, cut out, solid, filling the bottom of the cover
  safe area everything that matters sits inside the centre 1080x1440 (the profile-grid crop)

Headline per reel: "cover": "TRUST THE TIMING." in the plan - the last word becomes the big one.
Speaker photo: speakers/<speaker>.jpg if present (yours, or fetched by portraits.py); otherwise the sharpest front-facing
frame of that speaker's first clip is picked, cut out, and saved to speakers/<speaker>.png, so every
cover for that speaker reuses the same photo. Delete that file to pick again, or replace it with your own.

Needs: pip install pillow numpy "opencv-python-headless<5" "rembg[cpu]"
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import brandfonts as bf  # noqa: E402  (Times New Roman Condensed + Akzidenz-Grotesk, or free stand-ins)
import reels  # noqa: E402
W, H = 1080, 1920
GRID_TOP, GRID_BOT = (H - 1440) // 2, (H + 1440) // 2       # what the 3:4 profile grid shows
HANDLE = "@aura.miamii"


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "speaker"


def speaker_of(m):
    if m.get("speaker"):
        return m["speaker"]
    cap = m.get("caption", "")
    return cap.split("—")[-1].strip() if "—" in cap else m["id"]


def font(size):
    return ImageFont.truetype(str(bf.GROTESK), size)


def serif_line(text, size):
    """Condensed Times italic, lowercase - the small line above the big word."""
    f = ImageFont.truetype(str(bf.SERIF), size)
    text = text.lower()
    w0, h0 = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)) + size, int(size * 1.4)
    im = Image.new("RGBA", (w0, h0), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((size // 2, int(size * 1.05)), text, font=f, fill="white", anchor="ls")
    im = im.crop(im.getbbox())
    return im.resize((max(1, int(im.width * bf.SERIF_SCALE)), im.height), Image.LANCZOS)


# ---------- speaker photo ----------
def best_frame(clip):
    """Sharpest, largest front-facing face in the clip -> (PIL image, face box)."""
    import cv2
    import numpy as np
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                            "-of", "csv=p=0", str(clip)], capture_output=True, text=True).stdout.strip().split(",")
    sw, sh = int(probe[0]), int(probe[1])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(clip), "-vf", "fps=2", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    n, best = len(raw) // (sw * sh * 3), None
    for i in range(n):
        rgb = np.frombuffer(raw[i * sw * sh * 3:(i + 1) * sw * sh * 3], np.uint8).reshape(sh, sw, 3)
        g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        small = cv2.resize(g, (640, int(640 * sh / sw)))
        k = sw / 640
        for (x, y, fw, fh) in casc.detectMultiScale(small, 1.1, 7, minSize=(50, 50)):
            x, y, fw, fh = int(x * k), int(y * k), int(fw * k), int(fh * k)
            sharp = cv2.Laplacian(g[y:y + fh, x:x + fw], cv2.CV_64F).var()
            centred = 1 - abs((x + fw / 2) / sw - 0.5)            # prefer faces near the middle
            score = fw * fh * min(sharp, 400) * centred
            if not best or score > best[0]:
                best = (score, rgb.copy(), (x, y, fw, fh))
    if not best:
        return None, None
    return Image.fromarray(best[1]), best[2]


def head_and_shoulders(im):
    """Crop a portrait to head and shoulders around the biggest face (full image if none is found)."""
    import cv2
    import numpy as np
    g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
    k = max(1, max(im.size) / 900)
    small = cv2.resize(g, (int(im.width / k), int(im.height / k)))
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = casc.detectMultiScale(small, 1.1, 6, minSize=(40, 40))
    if not len(faces):
        return im
    x, y, fw, fh = [int(v * k) for v in max(faces, key=lambda f: f[2] * f[3])]
    cw = int(fw * 2.7)
    cx, top = x + fw // 2, max(0, int(y - fh * 0.6))
    return im.crop((max(0, cx - cw // 2), top, min(im.width, cx + cw // 2), min(im.height, top + int(cw * 1.1))))


def speaker_photo(name, clip):
    d = HERE / "speakers"
    d.mkdir(exist_ok=True)
    for ext in ("jpg", "jpeg", "webp", "png"):           # your own / downloaded photo first, clip frame last
        p = d / f"{slug(name)}.{ext}"
        if p.exists():
            im = ImageOps.exif_transpose(Image.open(p))
            return im if im.mode == "RGBA" else cutout(head_and_shoulders(im.convert("RGB")))
    if not clip.exists():
        return None
    frame, box = best_frame(clip)
    if frame is None:                                      # no clear face in this clip
        return None
    x, y, fw, fh = box
    cw = int(fw * 2.7)                                     # head and shoulders, face big
    cx, top = x + fw // 2, max(0, int(y - fh * 0.6))
    box = (max(0, cx - cw // 2), top, min(frame.width, cx + cw // 2), min(frame.height, top + int(cw * 1.1)))
    im = cutout(frame.crop(box))
    im.save(d / f"{slug(name)}.png")
    print(f"  photo for {name}: speakers/{slug(name)}.png (replace it to use your own)")
    return im


def cutout(im):
    try:
        from rembg import new_session, remove
        global _SESSION
        if "_SESSION" not in globals():
            _SESSION = new_session("u2net_human_seg")
        return remove(im.convert("RGB"), session=_SESSION)
    except ImportError:                                    # no rembg: soft-edged rectangle instead
        im = im.convert("RGBA")
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rectangle((im.width * .08, im.height * .04, im.width * .92, im.height), fill=255)
        im.putalpha(mask.filter(ImageFilter.GaussianBlur(im.width * .06)))
        return im


# ---------- cover ----------
def background(text):
    """The AURA cover background: black-to-grey grain gradient (assets/cover_bg.jpg)."""
    return ImageOps.fit(Image.open(HERE / "assets" / "cover_bg.jpg").convert("RGB"), (W, H), Image.LANCZOS)


def fit(text, max_w, start, d):
    size = start
    while size > 40 and d.textlength(text, font=font(size)) > max_w:
        size -= 4
    return font(size)


def italic_bold(text, size):
    """Akzidenz-Grotesk bold caps, slanted - the big last word."""
    f = font(size)
    stroke = 0
    w0 = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)) + stroke * 2 + size // 3
    h0 = int(size * 1.15)
    im = Image.new("RGBA", (w0, h0), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((stroke + size // 6, h0 - size * 0.12), text, font=f, fill="white", anchor="ls",
                            stroke_width=stroke, stroke_fill="white")
    slant = 0.2
    im = im.transform((w0, h0), Image.AFFINE, (1, slant, -slant * h0 / 2, 0, 1, 0), Image.BICUBIC)
    return im.crop(im.getbbox())


def cover(m, photo, out):
    words = m.get("cover", "").replace("/", " ").split()
    if not words:
        return False
    kicker, big = " ".join(words[:-1]), words[-1]          # the big word is always the last one
    im = background(m.get("caption", "") + " " + m.get("punchline", ""))
    d = ImageDraw.Draw(im)
    # lay the headline out first, so the photo can fill everything below it
    y = GRID_TOP + 60
    ki = None
    if kicker:
        ks = 120
        while True:
            ki = serif_line(kicker, ks)
            if ki.width <= 940 or ks <= 50:
                break
            ks -= 6
    yb = y + (ki.height + 18 if ki else 0)
    size = 360
    while True:
        bi = italic_bold(big, size)
        if bi.width <= 1000 or size <= 120:
            break
        size -= 10
    y_handle = yb + bi.height + 14
    if photo is not None:                                  # photo: black & white, solid, filling the bottom
        p = photo.convert("RGBA")
        p = p.crop(p.getbbox() or (0, 0, p.width, p.height))
        alpha = p.getchannel("A")
        p = ImageOps.autocontrast(ImageOps.grayscale(p.convert("RGB")), cutoff=1).convert("RGBA")   # black & white
        p.putalpha(alpha)
        top = int(y_handle + 10)
        scale = max((H - top) / p.height, W / p.width)     # reach the bottom edge, full width
        p = p.resize((int(p.width * scale), int(p.height * scale)), Image.LANCZOS)
        if p.width > W:                                    # keep the face centred, trim the sides
            l = (p.width - W) // 2
            p = p.crop((l, 0, l + W, p.height))
        im.paste(p, ((W - p.width) // 2, H - p.height), p)
        d = ImageDraw.Draw(im)
    if ki:
        im.paste(ki, ((W - ki.width) // 2, int(y)), ki)
    shadow = Image.new("RGBA", bi.size, (0, 0, 0, 0))
    shadow.putalpha(bi.getchannel("A").point(lambda v: v * 3 // 4))
    x = (W - bi.width) // 2
    im.paste(shadow, (x + 6, int(yb) + 8), shadow)
    im.paste(bi, (x, int(yb)), bi)
    d.text((x + bi.width, y_handle), HANDLE, font=font(28), fill=(200, 200, 200), anchor="rt")
    out.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(out, quality=95)
    return True


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    plan_path = (Path.cwd() / args[0]).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    out_dir, skip = reels.COVER, reels.skipped()
    photos = {}
    for m in plan["moments"]:
        if (args[1:] and m["id"] not in args[1:]) or (not args[1:] and m["id"] in skip):
            continue
        name = speaker_of(m)
        if not photos.get(name):
            clips = [reels.clip(m, plan_path.parent)] + sorted(reels.DOWNLOADED.glob(f"{m['id'][:3]}-*.mp4"))
            for c in clips:                                # this reel's clip, else an older clip of the same reel
                photos[name] = speaker_photo(name, c) if c.exists() else None
                if photos[name] is not None:
                    break
            if photos.get(name) is None:
                print(f"  ! no photo for {name}: run fetch.py first, or put a photo in speakers/{slug(name)}.jpg")
        if cover(m, photos[name], out_dir / f"{m['id']}.jpg"):
            print(f"[cover] REELS/COVER/{m['id']}.jpg")
        else:
            print(f"[cover] {m['id']}: no \"cover\" text in the plan - skipped")


if __name__ == "__main__":
    main()
