#!/usr/bin/env python3
"""Awakening carousels: dark, minimal, athletic Instagram carousels.

Commands
  search   "QUERY" [...] [-n N]   Pinterest keyword search -> library/candidates.jsonl (add --pull to download)
  pull     URL [URL...]           Pinterest board (…/user/board/ or .rss) or direct image URLs -> library
  pull     --candidates           download every not-yet-downloaded search candidate
  add      PATH [PATH...]         copy local images (files or folders) into the library
  tag      FILE "tag, tag" [--mood M]   set the meaning tags for one library image
  untagged                        list library images that still need tags
  reject   FILE [FILE...]         remove off-brand images (stay blocked from future pulls)
  render   SPEC.json [--out DIR]  build every slide (1080x1350 PNG) + a contact strip
  grid     [DIR]                  3x3 preview of carousel covers, newest first (how the profile reads)

Library: brand/awakening-carousels/library/ (images + library.json with tags per image).
"""
import argparse, hashlib, http.cookiejar, json, random, re, sys, urllib.parse, urllib.request
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path.cwd()
BRAND = ROOT / "brand" / "awakening-carousels"
LIB = BRAND / "library"
LIB_JSON = LIB / "library.json"
CANDS = LIB / "candidates.jsonl"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36"
OUT = BRAND / "out"
FONTS = Path(__file__).resolve().parent.parent / "assets" / "fonts"

W, H = 1080, 1350          # 4:5, Instagram's tallest feed ratio
MARGIN = 96                # side gutter; IG grid crops to 3:4, keep type inside the middle 1012px
TEXT_W = 760               # max line width; short lines read calmer
INK = (255, 255, 255)      # headline white (matches the reel covers)
ACCENT = (164, 204, 228)   # #A4CCE4, the reel-cover blue: always the payoff line
DIM = (255, 255, 255, 150) # footer / meta

STOP = set("a an the of in on at to and or with for my i me is it this that".split())


# ---------- library ----------

def load_lib():
    if LIB_JSON.exists():
        return json.loads(LIB_JSON.read_text())
    return {}

def save_lib(lib):
    LIB.mkdir(parents=True, exist_ok=True)
    LIB_JSON.write_text(json.dumps(lib, indent=2, sort_keys=True))

def _ingest(data: bytes, source: str, lib, hint=""):
    h = hashlib.sha1(data).hexdigest()[:12]
    if any(v.get("sha") == h for v in lib.values()):
        return None
    try:
        from io import BytesIO
        im = Image.open(BytesIO(data)); im.verify()
        im = Image.open(BytesIO(data))
    except Exception:
        return None
    w, h_px = im.size
    if min(w, h_px) < 600:
        print(f"  skip (too small {w}x{h_px}): {source}")
        return None
    ext = (im.format or "jpg").lower().replace("jpeg", "jpg")
    name = f"{h}.{ext}"
    LIB.mkdir(parents=True, exist_ok=True)
    (LIB / name).write_bytes(data)
    lib[name] = {"sha": h, "source": source, "size": [w, h_px], "tags": [], "mood": "", "hint": hint}
    return name

def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def _board_rss(url):
    url = url.split("?")[0].rstrip("/")
    return url if url.endswith(".rss") else url + ".rss"

def pinterest_search(query, limit=40):
    """Pinterest's own web search (same endpoint the site uses, no login). Returns pins with original-size URLs."""
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    src = "/search/pins/?q=" + urllib.parse.quote(query) + "&rs=typed"
    op.open(urllib.request.Request("https://www.pinterest.com" + src, headers={"User-Agent": UA}), timeout=20).read()
    csrf = next((c.value for c in cj if c.name == "csrftoken"), "")
    pins, bookmark = [], None
    while len(pins) < limit:
        opts = {"query": query, "scope": "pins", "rs": "typed", "redux_normalize_feed": True, "source_url": src}
        if bookmark: opts["bookmarks"] = [bookmark]
        url = "https://www.pinterest.com/resource/BaseSearchResource/get/?" + urllib.parse.urlencode(
            {"source_url": src, "data": json.dumps({"options": opts, "context": {}})})
        req = urllib.request.Request(url, headers={
            "User-Agent": UA, "Accept": "application/json", "X-Requested-With": "XMLHttpRequest",
            "X-Pinterest-AppState": "active", "X-Pinterest-PWS-Handler": "www/search/[scope].js",
            "X-Pinterest-Source-Url": src, "X-CSRFToken": csrf, "Referer": "https://www.pinterest.com/"})
        d = json.loads(op.open(req, timeout=20).read())["resource_response"]
        for x in d["data"].get("results", []):
            im = (x.get("images") or {}).get("orig")
            if not im or x.get("videos") or x.get("story_pin_data_id"):
                continue
            pins.append({"id": x["id"], "query": query, "url": im["url"], "w": im["width"], "h": im["height"],
                         "title": (x.get("grid_title") or x.get("title") or "").strip(),
                         "desc": (x.get("description") or "").strip()[:200],
                         "pin": f"https://www.pinterest.com/pin/{x['id']}/"})
        bookmark = d.get("bookmark")
        if not bookmark or bookmark == "-end-":
            break
    return pins[:limit]

def cmd_search(a):
    LIB.mkdir(parents=True, exist_ok=True)
    seen = {json.loads(l)["id"] for l in CANDS.read_text().splitlines()} if CANDS.exists() else set()
    new = 0
    with CANDS.open("a") as fh:
        for q in a.queries:
            pins = [p for p in pinterest_search(q, a.n) if min(p["w"], p["h"]) >= 700]
            fresh = [p for p in pins if p["id"] not in seen]
            for p in fresh:
                fh.write(json.dumps(p) + "\n"); seen.add(p["id"])
            new += len(fresh)
            print(f"{q!r}: {len(pins)} pins, {len(fresh)} new")
    print(f"{new} new candidates -> {CANDS}")
    if a.pull:
        cmd_pull(argparse.Namespace(urls=[], candidates=True))

def cmd_pull(a):
    lib = load_lib(); added = 0
    if getattr(a, "candidates", False) and CANDS.exists():
        have = {v.get("pin_id") for v in lib.values()}
        for line in CANDS.read_text().splitlines():
            p = json.loads(line)
            if p["id"] in have: continue
            try:
                n = _ingest(_get(p["url"]), p["pin"], lib, hint=f"{p['query']} | {p['title']} {p['desc']}".strip())
                if n:
                    lib[n]["pin_id"] = p["id"]; added += 1; print(f"  + {n}  {p['title'][:50]}")
            except Exception as e:
                print(f"  ! {p['url']}: {e}")
                if "Tunnel" in str(e) or "403" in str(e):
                    save_lib(lib); sys.exit("image host blocked: allow i.pinimg.com in the network policy, then rerun `pull --candidates`")
    for url in a.urls:
        if "pinterest." in url and not re.search(r"\.(jpe?g|png|webp)$", url, re.I):
            rss = _board_rss(url)
            print(f"board feed: {rss}")
            try:
                root = ElementTree.fromstring(_get(rss))
            except Exception as e:
                sys.exit(f"could not read {rss}: {e}\n(boards must be public; in a cloud session pinterest.com must be allowed by the network policy)")
            for item in root.iter("item"):
                desc = item.findtext("description") or ""
                title = item.findtext("title") or ""
                for src in re.findall(r'src="([^"]+)"', desc):
                    full = re.sub(r"/\d+x/", "/originals/", src)   # thumbnail -> original
                    for cand in (full, re.sub(r"/\d+x/", "/736x/", src), src):
                        try:
                            n = _ingest(_get(cand), cand, lib, hint=title.strip())
                            if n: added += 1; print(f"  + {n}  {title[:60]}")
                            break
                        except Exception:
                            continue
        else:
            try:
                n = _ingest(_get(url), url, lib)
                if n: added += 1; print(f"  + {n}")
            except Exception as e:
                print(f"  ! {url}: {e}")
    save_lib(lib)
    print(f"{added} new image(s). Next: tag them (see `untagged`).")

def cmd_add(a):
    lib = load_lib(); added = 0
    paths = []
    for p in map(Path, a.paths):
        paths += sorted(x for x in p.rglob("*") if x.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")) if p.is_dir() else [p]
    for p in paths:
        n = _ingest(p.read_bytes(), str(p), lib, hint=p.stem.replace("-", " ").replace("_", " "))
        if n: added += 1; print(f"  + {n}  ({p.name})")
    save_lib(lib)
    print(f"{added} new image(s). Next: tag them (see `untagged`).")

def cmd_reject(a):
    """Drop images from the library; the record stays so search/pull never re-adds them."""
    lib = load_lib()
    for f in a.files:
        if f in lib:
            lib[f].update(rejected=True, tags=[])
            (LIB / f).unlink(missing_ok=True)
            print(f"rejected {f}")
    save_lib(lib)

def cmd_tag(a):
    lib = load_lib()
    if a.file not in lib:
        sys.exit(f"not in library: {a.file}")
    lib[a.file]["tags"] = [t.strip().lower() for t in a.tags.split(",") if t.strip()]
    if a.mood: lib[a.file]["mood"] = a.mood
    save_lib(lib)
    print(f"{a.file}: {', '.join(lib[a.file]['tags'])}")

def cmd_untagged(a):
    lib = load_lib()
    todo = [k for k, v in lib.items() if not v.get("tags") and not v.get("rejected")]
    for k in todo:
        print(f"{LIB / k}   hint: {lib[k].get('hint','')}")
    print(f"{len(todo)} untagged / {len(lib)} total")


# ---------- image matching ----------

def _words(s):
    return {w for w in re.findall(r"[a-z]+", s.lower()) if w not in STOP}

def pick_image(query, lib, used):
    """Explicit '@file' wins; otherwise best tag/mood overlap, unused first."""
    if query.startswith("@"):
        return query[1:]
    q = _words(query)
    best, best_score = None, -1.0
    for name, meta in lib.items():
        if meta.get("rejected") or not meta.get("tags"):
            continue
        tags = set()
        for t in meta.get("tags", []): tags |= _words(t)
        tags |= _words(meta.get("mood", ""))
        score = len(q & tags) + 0.25 * len(q & _words(meta.get("hint", "")))
        score -= 5 if name in used else 0
        score += random.random() * 0.01          # stable-ish tie break
        if score > best_score:
            best, best_score = name, score
    return best


# ---------- look ----------

def grade(im, darkness=0.55, warmth=0.0):
    """Cover-crop to 4:5 and push to the house look: near-mono, crushed, grain, vignette."""
    im = ImageOps.exif_transpose(im).convert("RGB")
    im = ImageOps.fit(im, (W, H), Image.LANCZOS, centering=(0.5, 0.42))
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=1)
    lut = [int(255 * ((i / 255) ** (1.35 + darkness))) for i in range(256)]   # crush mids + shadows
    g = g.point(lut)
    # cold-steel tint (athletic, night training) or slight warmth for later years
    r = g.point(lambda v: min(255, int(v * (0.96 + warmth))))
    b = g.point(lambda v: min(255, int(v * (1.04 - warmth))))
    im = Image.merge("RGB", (r, g, b))
    # vignette
    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * 0.25, -H * 0.2, W * 1.25, H * 1.2), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(220))
    im = Image.composite(im, Image.new("RGB", (W, H), (6, 6, 7)), vig)
    # film grain
    noise = Image.effect_noise((W, H), 28).point(lambda v: 128 + (v - 128) // 2)
    im = Image.blend(im, Image.merge("RGB", (noise,) * 3), 0.06)
    return im

def scrim(im, where):
    """Soft dark gradient under the type so it reads on any photo."""
    grad = Image.new("L", (1, H))
    for y in range(H):
        t = y / H
        if where == "bottom": a = max(0.0, (t - 0.38) / 0.62)
        elif where == "top":  a = max(0.0, (0.62 - t) / 0.62)
        else:                 a = 0.55 - abs(t - 0.5)
        grad.putpixel((0, y), int(255 * min(1.0, a) * 0.85))
    grad = grad.resize((W, H))
    return Image.composite(Image.new("RGB", (W, H), (4, 4, 5)), im, grad)


# ---------- type ----------

def font(name, size, weight=None):
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight:
        f.set_variation_by_axes([weight, 100] if "OpenSans" in name else [weight])
    return f

def headline(size):
    return font("BebasNeue-Regular.ttf", size)

def label(size):
    return font("OpenSans-VF.ttf", size, weight=700)

def tracked(draw, xy, text, f, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking
    return x

def tracked_len(draw, text, f, tracking):
    return sum(draw.textlength(c, font=f) for c in text) + tracking * max(0, len(text) - 1)

def wrap(draw, text, f, width):
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split():
            test = (line + " " + word).strip()
            if draw.textlength(test, font=f) <= width: line = test
            else: lines.append(line); line = word
        lines.append(line)
    return lines

def balanced_wrap(draw, text, f, width):
    """Same line count as a greedy wrap, but evenly filled: no one-word orphan lines."""
    n = len(wrap(draw, text, f, width))
    lo, hi = 1, width
    while lo < hi:                                   # narrowest width that still fits in n lines
        mid = (lo + hi) // 2
        if len(wrap(draw, text, f, mid)) <= n: hi = mid
        else: lo = mid + 1
    return wrap(draw, text, f, lo)

def compose(bg, slide, idx, total, spec):
    """House type, matched to the 100-day reel covers: Bebas Neue caps, white lines,
    the last line (the payoff) in #A4CCE4, Open Sans Bold labels."""
    cover = idx == 0
    pos = slide.get("position", "center" if cover else "bottom")
    im = scrim(bg, pos) if pos != "none" else bg
    d = ImageDraw.Draw(im, "RGBA")

    size = slide.get("size", 150 if cover else 96)
    f = headline(size)
    # cover style: caps, no end punctuation (apostrophes and mid-line commas stay)
    paras = [p.strip().rstrip(".:;") for p in slide["text"].upper().split("\n") if p.strip()]
    accent_from = len(paras) - 1 if slide.get("accent", True) and len(paras) > 1 else len(paras)
    lines = []                                   # (text, colour)
    for i, para in enumerate(paras):
        for ln in balanced_wrap(d, para, f, W - 2 * MARGIN if cover else TEXT_W + 80):
            lines.append((ln, ACCENT if i >= accent_from else INK))
    lh = int(size * 0.98)                        # Bebas is tall and tight; stack lines like the covers
    lab = label(30 if cover else 24)
    block = lh * len(lines) + (int(size * 0.35) + 34 if cover else 0)
    if pos == "top":      y = 200
    elif pos == "center": y = (H - block) // 2
    else:                 y = H - 200 - block
    align = slide.get("align", "center")
    placed = []
    for ln, col in lines:
        x = (W - d.textlength(ln, font=f)) // 2 if align == "center" else MARGIN
        placed.append((x, y, ln, col)); y += lh
    # soft shadow keeps white type legible over bright patches without a visible box
    sh = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(sh)
    for x, yy, ln, _ in placed: sd.text((x, yy + 3), ln, font=f, fill=255)
    sh = sh.filter(ImageFilter.GaussianBlur(size * 0.25)).point(lambda v: min(255, v * 2))
    im.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), sh.point(lambda v: int(v * 0.6)))
    d = ImageDraw.Draw(im, "RGBA")
    for x, yy, ln, col in placed: d.text((x, yy), ln, font=f, fill=col)

    age, ch = spec.get("age"), spec.get("chapter", "").upper()
    if cover:
        # the series label sits under the headline, exactly like "DAY 1/100" on the reels
        tag = f"AGE {age}/24" if age else ch
        y_tag = y + int(size * 0.35)
        d.text(((W - d.textlength(tag, font=lab)) // 2, y_tag), tag, font=lab, fill=INK)
        if ch and age:
            sub = label(22)
            tracked(d, ((W - tracked_len(d, ch, sub, 4)) // 2, H - 120), ch, sub, DIM, 4)
    else:
        meta = label(22)
        left = f"AGE {age} · {ch}" if age else ch
        tracked(d, (MARGIN, H - 100), left, meta, DIM, 3)
        num = f"{idx + 1:02d}/{total:02d}"
        tracked(d, (W - MARGIN - tracked_len(d, num, meta, 3), H - 100), num, meta, DIM, 3)
    if spec.get("handle") and idx == total - 1:
        hl = label(22); h = spec["handle"].upper()
        tracked(d, ((W - tracked_len(d, h, hl, 3)) // 2, 130), h, hl, DIM, 3)
    return im


def cmd_render(a):
    spec = json.loads(Path(a.spec).read_text())
    lib = load_lib()
    if not lib:
        sys.exit("library is empty: add images first (pull / add)")
    out = Path(a.out) if a.out else OUT / spec["id"]
    out.mkdir(parents=True, exist_ok=True)
    random.seed(spec["id"])
    used, slides, plan = set(), spec["slides"], []
    for i, s in enumerate(slides):
        name = pick_image(s.get("image", s["text"]), lib, used)
        used.add(name)
        bg = grade(Image.open(LIB / name), darkness=s.get("darkness", spec.get("darkness", 0.55)),
                   warmth=spec.get("warmth", 0.0))
        im = compose(bg, s, i, len(slides), spec)
        p = out / f"{i + 1:02d}.png"
        im.save(p, optimize=True)
        plan.append({"slide": i + 1, "image": name, "query": s.get("image", ""), "tags": lib[name].get("tags", [])})
        print(f"  {p.name}  <- {name}  [{', '.join(lib[name].get('tags', [])[:5])}]")
    # contact strip for quick review
    thumbs = [Image.open(out / f"{i + 1:02d}.png").resize((270, 338)) for i in range(len(slides))]
    strip = Image.new("RGB", (270 * len(thumbs) + 8 * (len(thumbs) - 1), 338), (20, 20, 20))
    for i, t in enumerate(thumbs): strip.paste(t, (i * 278, 0))
    strip.save(out / "strip.jpg", quality=88)
    (out / "plan.json").write_text(json.dumps(plan, indent=2))
    caption = spec.get("caption")
    if caption: (out / "caption.txt").write_text(caption.strip() + "\n")
    print(f"done: {out}  (strip.jpg = whole carousel at a glance)")

def cmd_grid(a):
    base = Path(a.dir) if a.dir else OUT
    covers = sorted(base.glob("*/01.png"), key=lambda p: p.stat().st_mtime, reverse=True)[:9]
    if not covers:
        sys.exit(f"no rendered carousels in {base}")
    tw, th = 360, 480                       # IG profile grid shows 3:4 center crops
    g = Image.new("RGB", (tw * 3 + 6, th * ((len(covers) + 2) // 3) + 3 * ((len(covers) - 1) // 3)), (0, 0, 0))
    for i, p in enumerate(covers):
        im = ImageOps.fit(Image.open(p), (tw, th), Image.LANCZOS)
        g.paste(im, ((i % 3) * (tw + 3), (i // 3) * (th + 3)))
    dest = base / "grid.jpg"
    g.save(dest, quality=90)
    print(dest)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("search"); p.add_argument("queries", nargs="+"); p.add_argument("-n", type=int, default=40); p.add_argument("--pull", action="store_true"); p.set_defaults(fn=cmd_search)
    p = sp.add_parser("pull"); p.add_argument("urls", nargs="*"); p.add_argument("--candidates", action="store_true"); p.set_defaults(fn=cmd_pull)
    p = sp.add_parser("add"); p.add_argument("paths", nargs="+"); p.set_defaults(fn=cmd_add)
    p = sp.add_parser("tag"); p.add_argument("file"); p.add_argument("tags"); p.add_argument("--mood", default=""); p.set_defaults(fn=cmd_tag)
    p = sp.add_parser("reject"); p.add_argument("files", nargs="+"); p.set_defaults(fn=cmd_reject)
    p = sp.add_parser("untagged"); p.set_defaults(fn=cmd_untagged)
    p = sp.add_parser("render"); p.add_argument("spec"); p.add_argument("--out"); p.set_defaults(fn=cmd_render)
    p = sp.add_parser("grid"); p.add_argument("dir", nargs="?"); p.set_defaults(fn=cmd_grid)
    a = ap.parse_args(); a.fn(a)

if __name__ == "__main__":
    main()
