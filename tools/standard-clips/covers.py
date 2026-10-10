#!/usr/bin/env python3
"""AURA reel covers: one photo per speaker, a new headline per reel.

    python covers.py ig.json                 # every reel in the plan
    python covers.py ig.json a01-... a07-...  # just these
    python covers.py ig.json --done          # exactly the finished reels in REELS/DONE (also old ones, from archive.json)

  canvas    1080x1920, black-to-grey grain gradient (assets/cover_bg.jpg)
  headline  condensed Times italic lowercase line, its LAST word huge in Akzidenz-Grotesk bold caps (+ @aura.miamii)
  photo     the speaker in black & white, full frame, full width, its top 36% fading smoothly up into the headline
  safe area everything that matters sits inside the centre 1080x1440 (the profile-grid crop)

Headline per reel: "cover": "TRUST THE TIMING." in the plan - the last word becomes the big one.
Speaker photo, in this order (the first one found is reused for every cover of that speaker):
  1. speakers/<speaker>.jpg / .png - your own photo, or one fetched by portraits.py
  2. the best frame of the reel's raw clip in REELS/DOWNLOADED: a clear front-facing face beats a side-on one, then bigger, sharper, more
     central; cut out and saved to speakers/<speaker>.png. Delete that file to pick again, or replace it.
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

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import brandfonts as bf  # noqa: E402  (Times New Roman Condensed + Akzidenz-Grotesk, or free stand-ins)
import reels  # noqa: E402
W, H = 1080, 1920
GRID_TOP, GRID_BOT = (H - 1440) // 2, (H + 1440) // 2       # what the 3:4 profile grid shows
HANDLE = "@aura.miamii"
FADE = 0.36               # top 36% of the photo fades in from the background, under the headline
FADE_AROUND = 0.62        # with a face found: the background fades down to ~shoulder height, the head kept solid


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


def person_crop(frame):
    """No face found: find the person's silhouette and frame the top of it (head) like a face crop."""
    im = cutout(frame)
    box = im.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox()
    if not box or (box[2] - box[0]) * (box[3] - box[1]) < 0.04 * im.width * im.height:
        return None                                        # nobody clearly in frame
    l, t, r, b = box
    head = max(40, (r - l) // 3)                           # guess a head-sized box at the top of the silhouette
    return portrait(frame, ((l + r) // 2 - head // 2, t + head // 4, head, head))


PHOTO_ASPECT = 2 / 3      # photo area: full width, from the headline down to the bottom edge
FACE_AT = 0.40            # top of the face sits 40% down the photo, clear of the headline


def portrait(frame, box, reel=False):
    """Full-frame crop around a face, sized for the cover. The face sits FACE_AT down the crop; when the frame has no
    room above the head, the crop runs past its top edge (that part is inside the fade, so it just melts into black)."""
    l0, t0, r0, b0 = frame.convert("L").point(lambda v: 255 if v > 20 else 0).getbbox() or (0, 0, *frame.size)
    x, y, fw, fh = box                                     # (letterbox / pillarbox bars trimmed off first)
    if reel:                                               # a finished vertical reel: stop above our AURA mark
        b0 = t0 + int((b0 - t0) * 0.89)
    room_below = b0 - y
    cw = int(min(r0 - l0, max(fw * 1.8, min(fw * 3.2, room_below / (1 - FACE_AT) * PHOTO_ASPECT))))
    ch = int(cw / PHOTO_ASPECT)
    left = min(max(l0, x + fw // 2 - cw // 2), r0 - cw)
    top = min(int(y - ch * FACE_AT), b0 - ch)
    return frame.crop((left, top, left + cw, top + ch))


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


def head_and_shoulders(im):
    """Your own / downloaded photo: cropped the cover way around the face (background kept), small web photos upscaled."""
    box = find_face(im)
    crop = portrait(im, box) if box else im
    if crop.width < 900:
        k = 900 / crop.width
        crop = crop.resize((900, int(crop.height * k)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    return crop


def speaker_photo(name, clip):
    d = HERE / "speakers"
    d.mkdir(exist_ok=True)
    for ext in ("jpg", "jpeg", "webp", "png"):           # your own / downloaded photo first, clip frame last
        p = d / f"{slug(name)}.{ext}"
        if p.exists():
            im = ImageOps.exif_transpose(Image.open(p))
            if ext == "png" and im.mode == "RGBA":         # an old cut-out from the previous cover style: pick again
                continue
            return im.convert("RGB") if ext == "png" else head_and_shoulders(im.convert("RGB"))
    if not clip.exists():
        return None
    frame, box = best_frame(clip)
    if frame is None:                                      # unreadable clip
        return None
    if box:
        im = portrait(frame, box, reel=frame.height > frame.width)
    else:
        im = person_crop(frame)
        if im is None:
            return None
    im.save(d / f"{slug(name)}.png")
    print(f"  photo for {name}: speakers/{slug(name)}.png (replace it to use your own)")
    return im


def solid(im):
    """Share of the cut-out that is person (0..1)."""
    a = im.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    return sum(a.histogram()[255:]) / (im.width * im.height)


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
    if photo is not None:                                  # photo: black & white, full width, fading up into the headline
        top = int(y)                                       # the photo area starts at the headline...
        area = (W, H - top)
        p = ImageOps.autocontrast(ImageOps.grayscale(photo.convert("RGB")), cutoff=1)
        p = ImageOps.fit(p, area, Image.LANCZOS, centering=(0.5, 0.3)).convert("RGBA")
        rows = [sum(p.convert("L").crop((0, r, W, r + 1)).getdata()) / W for r in range(area[1] // 2)]
        start = next((r for r, v in enumerate(rows) if v > 14), 0)   # where the picture really starts (below padding)
        face = find_face(p.convert("RGB"))
        fade = int(area[1] * (FADE_AROUND if face else FADE))   # with a face to protect, the background fades longer
        ramp = [0] * start + [255] * (area[1] - start)
        for i in range(min(fade, area[1] - start)):
            u = i / fade
            ramp[start + i] = int(255 * u * u * (3 - 2 * u))   # smoothstep: no visible edge
        alpha = Image.frombytes("L", (1, area[1]), bytes(ramp)).resize(area)
        if face:                                           # the head (face + hair) stays solid: soft oval kept opaque
            x, y0, fw, fh = face
            keep = Image.new("L", area, 0)
            cx, cy = x + fw / 2, y0 + fh * 0.45
            ImageDraw.Draw(keep).ellipse((cx - fw * 1.05, cy - fh * 1.25, cx + fw * 1.05, cy + fh * 1.6), fill=255)
            short = max(1, min(int(area[1] * 0.28), int(y0 + fh * 0.1) - start))   # ...but eases in at the top edge,
            edge = [0] * start + [255 if i >= short else int(255 * (3 - 2 * i / short) * (i / short) ** 2)   # done by the brow
                                  for i in range(area[1] - start)]
            edge = Image.frombytes("L", (1, area[1]), bytes(edge)).resize(area)
            keep = ImageChops.multiply(keep.filter(ImageFilter.GaussianBlur(fw * 0.3)), edge)
            alpha = ImageChops.lighter(alpha, keep)
        p.putalpha(alpha)
        im.paste(p, (0, top), p)
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
        return speaker_photo(name, Path("-"))
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
            photos[name] = speaker_photo(name, Path("-"))  # 1. a photo you saved in speakers/
            for c in clips:                                # 2. this reel's raw clip, else an older clip of the same reel
                if photos[name] is not None:
                    break
                photos[name] = speaker_photo(name, c) if c.exists() else None
            if photos[name] is None:                       # 3. a free-licence portrait from Wikipedia
                photos[name] = wiki_photo(name, m)
            done = reels.DONE / f"{m['id']}.mp4"
            if photos[name] is None and done.exists():     # 4. last resort: a frame of the finished reel
                photos[name] = speaker_photo(name, done)
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
