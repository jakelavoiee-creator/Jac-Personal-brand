#!/usr/bin/env python3
"""AURA reel covers: one photo per speaker, a new headline per reel.

    python covers.py ig.json                 # every reel in the plan
    python covers.py ig.json a01-... a07-...  # just these
    python covers.py ig.json --done          # exactly the finished reels in REELS/DONE (also old ones, from archive.json)

  canvas    1080x1350 (4:5), smooth gradient: near-black at the top to warm light grey at the bottom
  headline  serif italic lowercase line, its LAST word huge in heavy italic grotesk caps (Akzidenz-Grotesk bold)
  speaker   in colour, cut out of their photo, standing in front of the big word and filling down to the bottom edge;
            face ~400px wide, centred, its top at y=585
  handle    @aura.miamii in serif italic, right-aligned under the big word, on top of everything

Headline per reel: "cover": "TRUST THE TIMING." in the plan - the last word becomes the big one.
Speaker photo, in this order (the first one found is reused for every cover of that speaker):
  1. speakers/<speaker>.jpg / .jpeg / .webp - your own photo (a clean portrait works best)
  2. the best frame of the reel's raw clip in REELS/DOWNLOADED (clear front-facing face first, then bigger, sharper,
     more central), saved to speakers/<speaker>.frame.jpg. Delete that file to pick again.
  3. a free-licence portrait from Wikipedia (when there's no raw clip, or no face in it)
  4. last resort: a frame of the finished reel in REELS/DONE
No photo at all (clip not downloaded yet) -> no cover is written, and the summary at the end says why.

Needs: pip install pillow numpy "opencv-python-headless<5" "rembg[cpu]"
"""
import io
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
W, H = 1080, 1350
HANDLE = "@aura.miamii"
# background colour down the left edge of the template, every 135px
STOPS = [(9, 9, 9), (24, 24, 24), (49, 49, 49), (83, 81, 82), (119, 117, 118), (155, 152, 152), (185, 180, 180),
         (205, 200, 199), (216, 212, 211), (220, 215, 215), (221, 216, 216)]
WORD_BOTTOM, WORD_MAX_W, WORD_MAX_H = 452, 920, 178       # the big word
WORD_SQUEEZE = 0.86                                       # letters narrowed: taller word at the same width
KICKER_GAP, KICKER_MAX_W = 16, 900                        # the small line above it
HANDLE_RIGHT, HANDLE_TOP, HANDLE_SIZE = 990, 472, 44
FACE_W, FACE_TOP = 400, 585                               # where the speaker's face goes

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "speaker"


def speaker_of(m):
    if m.get("speaker"):
        return m["speaker"]
    cap = m.get("caption", "")
    return cap.split("—")[-1].strip() if "—" in cap else m["id"]


def font(size):
    return ImageFont.truetype(str(bf.GROTESK), size)


# ---------- speaker photo ----------
DETECT_W = 960                                             # faces are found on a small copy, the cover uses full res


def probe_size(clip):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", str(clip)], capture_output=True, text=True).stdout.strip().split(",")
    return int(out[0]), int(out[1])


def frame_at(clip, t):
    """One full-resolution frame at t seconds."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(clip), "-frames:v", "1",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    return Image.open(io.BytesIO(raw)).convert("RGB") if raw else None


def faces_in(g, cascades):
    """(tier, box) per face: 0 = clear front face, 1 = looser front face, 2 = side / three-quarter face."""
    import cv2
    out = [(0, f) for f in cascades[0].detectMultiScale(g, 1.1, 8, minSize=(48, 48))]
    if out:
        return out
    out = [(1, f) for f in cascades[0].detectMultiScale(g, 1.1, 5, minSize=(48, 48))]
    out += [(2, f) for f in cascades[1].detectMultiScale(g, 1.1, 6, minSize=(48, 48))]
    flipped = cv2.flip(g, 1)
    out += [(2, (g.shape[1] - x - w, y, w, h)) for (x, y, w, h) in cascades[1].detectMultiScale(flipped, 1.1, 6, minSize=(48, 48))]
    return out


def best_frame(clip):
    """The speaker's best frame -> (full-res PIL frame, face box), or (frame, None) if no face.
    Clear front-facing faces beat looser / side-on ones. Detections are grouped by camera shot (face position + size)
    and only the shots on screen most are kept - in a clip of someone talking that's them, not the host's cut-aways.
    Then bigger, sharper, more central wins."""
    import cv2
    import numpy as np
    cascades = [cv2.CascadeClassifier(cv2.data.haarcascades + f) for f in
                ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml")]
    sw, sh = probe_size(clip)
    dw, dh = DETECT_W, int(DETECT_W * sh / sw) // 2 * 2
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(clip), "-vf", f"fps=2,scale={dw}:{dh}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], capture_output=True).stdout
    n, hits, sharpest = len(raw) // (dw * dh), [], None
    if not n:
        return None, None
    for i in range(n):
        g = np.frombuffer(raw[i * dw * dh:(i + 1) * dw * dh], np.uint8).reshape(dh, dw)
        whole = cv2.Laplacian(g, cv2.CV_64F).var()
        if not sharpest or whole > sharpest[0]:
            sharpest = (whole, i)
        for tier, (x, y, fw, fh) in faces_in(g, cascades):
            sharp = cv2.Laplacian(g[y:y + fh, x:x + fw], cv2.CV_64F).var()
            centred = 1 - abs((x + fw / 2) / dw - 0.5)
            shot = (round((x + fw / 2) / dw * 5), round(np.log2(fw) * 2))
            hits.append((tier, shot, i, fw * fh * min(sharp, 400) * centred, (x, y, fw, fh)))
    if not hits:
        return frame_at(clip, sharpest[1] / 2), None
    top = min(h[0] for h in hits)
    hits = [h for h in hits if h[0] == top]
    frames = {}
    for h in hits:
        frames.setdefault(h[1], set()).add(h[2])
    most = max(len(v) for v in frames.values())
    hits = [h for h in hits if len(frames[h[1]]) >= 0.6 * most]
    _, _, i, _, box = max(hits, key=lambda h: h[3])
    frame = frame_at(clip, i / 2)
    if frame is None:
        return None, None
    # re-find the face on the full-res frame, so the crop sits exactly on it
    k = sw / dw
    box = tuple(int(v * k) for v in box)
    g = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2GRAY)
    small = cv2.resize(g, (dw, int(dw * frame.height / frame.width)))
    kk = frame.width / dw
    near = [tuple(int(v * kk) for v in f) for _, f in faces_in(small, cascades)]
    near = [f for f in near if box[0] < f[0] + f[2] / 2 < box[0] + box[2] and box[1] < f[1] + f[3] / 2 < box[1] + box[3]
            and 0.6 < f[2] / box[2] < 1.6]                # same face: centre inside the first box, similar size
    if near:
        box = max(near, key=lambda f: f[2] * f[3])
    return frame, box


def find_face(im):
    import cv2
    import numpy as np
    g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
    k = max(1, max(im.size) / 900)
    small = cv2.resize(g, (int(im.width / k), int(im.height / k)))
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = casc.detectMultiScale(small, 1.1, 6, minSize=(40, 40))
    if not len(faces):
        return None
    return tuple(int(v * k) for v in max(faces, key=lambda f: f[2] * f[3]))


def footage(frame, box):
    """Trim black bars; on a finished vertical reel keep only the footage band, above our AURA mark."""
    l, t, r, b = frame.convert("L").point(lambda v: 255 if v > 20 else 0).getbbox() or (0, 0, *frame.size)
    if frame.height > frame.width:
        b = t + int((b - t) * 0.89)
    frame = frame.crop((l, t, r, b))
    return frame, ((box[0] - l, box[1] - t, box[2], box[3]) if box else None)


def speaker_source(name, clip):
    """(photo, face box) for a speaker: your photo in speakers/, else the best frame of the clip (saved for next time)."""
    d = HERE / "speakers"
    d.mkdir(exist_ok=True)
    for p in [d / f"{slug(name)}.{ext}" for ext in ("jpg", "jpeg", "webp")] + [d / f"{slug(name)}.frame.jpg"]:
        if p.exists():
            im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
            return im, find_face(im)
    if not clip.exists():
        return None
    frame, box = best_frame(clip)
    if frame is None:
        return None
    frame, box = footage(frame, box)
    frame.save(d / f"{slug(name)}.frame.jpg", quality=95)
    print(f"  photo for {name}: speakers/{slug(name)}.frame.jpg (or save your own as speakers/{slug(name)}.jpg)")
    return frame, box or find_face(frame)


def cutout(im):
    try:
        from rembg import new_session, remove
        global _SESSION
        if "_SESSION" not in globals():
            try:                                           # best hair edges; ~1 min per photo on a CPU
                _SESSION = new_session("birefnet-portrait")
            except Exception:
                _SESSION = new_session("u2net_human_seg")
        return remove(im.convert("RGB"), session=_SESSION)
    except ImportError:                                    # no rembg: soft-edged rectangle instead
        im = im.convert("RGBA")
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rectangle((im.width * .08, im.height * .04, im.width * .92, im.height), fill=255)
        im.putalpha(mask.filter(ImageFilter.GaussianBlur(im.width * .06)))
        return im


# ---------- cover ----------
def background():
    """Smooth vertical gradient sampled from the template: near-black top, warm light grey bottom."""
    col = []
    for y in range(H):
        f = y / 135
        i = min(int(f), len(STOPS) - 2)
        t = min(1.0, f - i)
        col.append(tuple(round(a + (b - a) * t) for a, b in zip(STOPS[i], STOPS[i + 1])))
    strip = Image.new("RGB", (1, H))
    strip.putdata(col)
    return strip.resize((W, H))


def person(src):
    """The speaker cut out of their photo, scaled and placed on a transparent cover-sized layer."""
    im, box = src
    if im.width < 1000:                                    # small web photos: upscale before the cut-out
        k = 1000 / im.width
        im = im.resize((1000, round(im.height * k)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
        box = tuple(round(v * k) for v in box) if box else None
    import hashlib
    key = hashlib.md5(im.resize((64, 64)).tobytes()).hexdigest()[:16]
    cache = HERE / "speakers" / ".cutouts" / f"{key}.png"   # the cut-out model is slow: once per photo
    if cache.exists():
        cut = Image.open(cache).convert("RGBA")
    else:
        cut = cutout(im)
        cache.parent.mkdir(parents=True, exist_ok=True)
        cut.save(cache)
    alpha = cut.getchannel("A")
    bbox = alpha.point(lambda v: 255 if v > 128 else 0).getbbox()
    if not bbox:
        return None
    if box:
        x, y, fw, fh = box
        s = FACE_W / fw
        if (bbox[3] - y) * s < H - FACE_TOP:              # the person always reaches the bottom edge
            s = (H - FACE_TOP) / (bbox[3] - y)
        ox, oy = W / 2 - (x + fw / 2) * s, FACE_TOP - y * s
    else:                                                  # no face found: fit the silhouette, bottom-anchored
        s = 0.8 * W / (bbox[2] - bbox[0])
        ox, oy = W / 2 - (bbox[0] + bbox[2]) / 2 * s, H - bbox[3] * s
    cut = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
    a = cut.getchannel("A").point(lambda v: 0 if v < 40 else v)         # drop the faint fringe...
    cut.putalpha(a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))   # ...and pull the edge in
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(cut, (round(ox), round(oy)), cut)
    return layer


def italic_bold(text, size):
    """Heavy italic grotesk caps - the big last word."""
    f = font(size)
    stroke = max(1, size // 30)                            # a touch heavier than the font's bold
    w0 = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)) + stroke * 2 + size // 3
    h0 = int(size * 1.15)
    im = Image.new("RGBA", (w0, h0), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((stroke + size // 6, h0 - size * 0.12), text, font=f, fill="white", anchor="ls",
                            stroke_width=stroke, stroke_fill="white")
    slant = 0.2
    im = im.transform((w0, h0), Image.AFFINE, (1, slant, -slant * h0 / 2, 0, 1, 0), Image.BICUBIC)
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * WORD_SQUEEZE), im.height), Image.LANCZOS)   # tall and tight, like the template


def serif_text(text, size):
    f = ImageFont.truetype(str(bf.SERIF), size)
    w0, h0 = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)) + size, int(size * 1.5)
    im = Image.new("RGBA", (w0, h0), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((size // 2, int(size * 1.1)), text, font=f, fill="white", anchor="ls")
    return im.crop(im.getbbox())


def cover(m, src, out):
    words = m.get("cover", "").replace("/", " ").split()
    if not words:
        return False
    kicker, big = " ".join(words[:-1]).lower(), words[-1].upper()   # the big word is always the last one
    im = background().convert("RGBA")
    size = 260
    while True:
        bi = italic_bold(big, size)
        if (bi.width <= WORD_MAX_W and bi.height <= WORD_MAX_H) or size <= 80:
            break
        size -= 6
    by = WORD_BOTTOM - bi.height
    im.alpha_composite(bi, ((W - bi.width) // 2, by))
    if kicker:
        ks = 112
        while True:
            ki = serif_text(kicker, ks)
            if ki.width <= KICKER_MAX_W or ks <= 40:
                break
            ks -= 4
        im.alpha_composite(ki, ((W - ki.width) // 2, by - KICKER_GAP - ki.height))
    layer = person(src) if src else None
    if layer:
        im.alpha_composite(layer)                          # the speaker stands in front of the big word
    hi = serif_text(HANDLE, HANDLE_SIZE)
    im.alpha_composite(hi, (HANDLE_RIGHT - hi.width, HANDLE_TOP))
    out.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(out, quality=95)
    return True


def wiki_photo(name, m):
    """Last resort: a free-licence portrait from Wikipedia (portraits.py), saved to speakers/<speaker>.jpg."""
    try:
        import portraits
        fname, _ = portraits.lead_image(m.get("wiki") or portraits.TITLES.get(name, name))
        info = portraits.image_info(fname) if fname else None
        if not info or not portraits.FREE.match(info["license"]) or (info["h"] or 0) < 700:
            return None
        import urllib.request
        with urllib.request.urlopen(urllib.request.Request(info["url"], headers=portraits.UA), timeout=60) as r:
            (HERE / "speakers" / f"{slug(name)}.jpg").write_bytes(r.read())
        with (HERE / "speakers" / "CREDITS.txt").open("a", encoding="utf-8") as c:
            c.write(f"{name}: photo by {info['artist'] or 'unknown'}, {info['license']} - {info['page']}\n")
        print(f"  photo for {name}: speakers/{slug(name)}.jpg from Wikipedia ({info['license']})")
        return speaker_source(name, Path("-"))
    except Exception as e:                                 # offline / blocked: just report it
        print(f"  (Wikipedia lookup for {name} failed: {e})")
        return None


def done_reels(plan):
    """The moments for every finished reel in REELS/DONE: from the plan, else from archive.json (older plans)."""
    by_id = {m["id"]: m for m in json.loads((HERE / "archive.json").read_text(encoding="utf-8"))["moments"]}
    by_id.update({m["id"]: m for m in plan["moments"]})
    ids = sorted({re.sub(r"( - Copy)+( \(\d+\))?$", "", f.stem) for f in reels.DONE.glob("*.mp4")})
    found = [by_id[i] for i in ids if i in by_id]
    for i in ids:
        if i not in by_id:
            print(f"  ? REELS/DONE/{i}.mp4 isn't in any plan - add a \"cover\" line for it to ig.json")
    return found


def main():
    args = [a for a in sys.argv[1:] if a != "--done"]
    if not args:
        sys.exit(__doc__)
    plan_path = (Path.cwd() / args[0]).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    out_dir, skip = reels.COVER, reels.skipped()
    photos, made, missing = {}, 0, []
    todo = plan["moments"]
    if "--done" in sys.argv:
        todo = done_reels(plan)
        print(f"{len(todo)} finished reels in REELS/DONE")
    for m in todo:
        if (args[1:] and m["id"] not in args[1:]) or (not args[1:] and m["id"] in skip and "--done" not in sys.argv):
            continue
        name = speaker_of(m)
        if photos.get(name) is None:
            clips = [reels.clip(m, plan_path.parent)] + sorted(reels.DOWNLOADED.glob(f"{m['id'][:3]}-*.mp4"))
            photos[name] = speaker_source(name, Path("-"))  # 1. a photo you saved in speakers/
            for c in clips:                                # 2. this reel's raw clip, else an older clip of the same reel
                if photos[name] is not None:
                    break
                photos[name] = speaker_source(name, c) if c.exists() else None
            if photos[name] is None:                       # 3. a free-licence portrait from Wikipedia
                photos[name] = wiki_photo(name, m)
            done = reels.DONE / f"{m['id']}.mp4"
            if photos[name] is None and done.exists():     # 4. last resort: a frame of the finished reel
                photos[name] = speaker_source(name, done)
        if photos[name] is None:                           # never save a cover without the speaker on it
            missing.append((m["id"], name, reels.clip(m, plan_path.parent).exists()))
            continue
        if cover(m, photos[name], out_dir / f"{m['id']}.jpg"):
            made += 1
            print(f"[cover] REELS/COVER/{m['id']}.jpg")
        else:
            print(f"[cover] {m['id']}: no \"cover\" text in the plan - skipped")
    print(f"\n{made} covers in REELS/COVER")
    if missing:
        print(f"{len(missing)} skipped - no speaker photo:")
        for i, name, have_clip in missing:
            why = "no face found in the clip" if have_clip else "no clip - run: python fetch.py " + args[0]
            print(f"  {i}  ({why}; or save a photo as speakers/{slug(name)}.jpg)")


if __name__ == "__main__":
    main()
