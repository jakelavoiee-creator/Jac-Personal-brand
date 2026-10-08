#!/usr/bin/env python3
"""Fetch a high-quality, freely licensed portrait for every speaker in a plan (Wikipedia / Wikimedia Commons).

    python portraits.py ig.json            # speakers that don't have a photo yet (or only a frame from their clip)
    python portraits.py ig.json --force    # re-fetch everyone
    python portraits.py ig.json "Kevin Hart" "Lady Gaga"

Saves speakers/<speaker>.jpg (covers.py prefers it over the frame grabbed from the clip) and appends the
photographer + licence to speakers/CREDITS.txt. Only free licences are used (CC BY, CC BY-SA, CC0, public
domain); credit the photographer in the post caption when the licence asks for it (CC BY / BY-SA).
Wrong person or a bad shot? Set "wiki": "Exact_Wikipedia_Title" on that reel in the plan, or just drop your
own photo in speakers/ with the same name.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "speakers"
UA = {"User-Agent": "AuraMiamiCovers/1.0 (https://aura-miami.ca)"}
API = "https://en.wikipedia.org/w/api.php"
FREE = re.compile(r"^(cc[- ]by|cc[- ]by[- ]sa|cc0|public domain|pd)", re.I)

# Wikipedia titles for names that are ambiguous or differ from the page title
TITLES = {
    "Chris Williamson": "Chris Williamson (podcaster)",
    "Robert Greene": "Robert Greene (American author)",
    "Mr. Feeny": "William Daniels",
    "Owen Cooper": "Owen Cooper (actor)",
    "Shi Heng Yi": "Shi Heng Yi",
    "Kobe Bryant": "Kobe Bryant",
    "Tom Holland": "Tom Holland",
}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "speaker"


def speaker_of(m):
    if m.get("speaker"):
        return m["speaker"]
    cap = m.get("caption", "")
    return cap.split("—")[-1].strip() if "—" in cap else ""


def get(params):
    q = urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    with urllib.request.urlopen(urllib.request.Request(f"{API}?{q}", headers=UA), timeout=30) as r:
        return json.loads(r.read())


def lead_image(title):
    """(file name, resolved title) of the page's lead image, following redirects."""
    d = get({"action": "query", "titles": title, "prop": "pageimages", "piprop": "name", "redirects": 1})
    pages = d.get("query", {}).get("pages", [])
    if pages and not pages[0].get("missing") and pages[0].get("pageimage"):
        return pages[0]["pageimage"], pages[0]["title"]
    s = get({"action": "query", "list": "search", "srsearch": title, "srlimit": 1})
    hits = s.get("query", {}).get("search", [])
    if hits and hits[0]["title"] != title:
        return lead_image(hits[0]["title"])
    return None, None


def image_info(fname):
    d = get({"action": "query", "titles": f"File:{fname}", "prop": "imageinfo",
             "iiprop": "url|size|extmetadata", "iiurlwidth": 1800})
    pages = d.get("query", {}).get("pages", [])
    if not pages or "imageinfo" not in pages[0]:
        return None
    ii = pages[0]["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    lic = re.sub("<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", ""))
    artist = re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()
    return {"url": ii.get("thumburl") or ii["url"], "w": ii.get("width"), "h": ii.get("height"),
            "license": lic, "artist": artist, "page": ii.get("descriptionurl", "")}


def main():
    args = [a for a in sys.argv[1:] if a != "--force"]
    if not args:
        sys.exit(__doc__)
    force = "--force" in sys.argv
    plan = json.loads((Path.cwd() / args[0]).read_text(encoding="utf-8"))
    wanted = args[1:]
    OUT.mkdir(exist_ok=True)
    seen = {}
    for m in plan["moments"]:
        name = speaker_of(m)
        if name and name not in seen and (not wanted or name in wanted):
            seen[name] = m.get("wiki")
    credits = OUT / "CREDITS.txt"
    for name, wiki in seen.items():
        dest = OUT / f"{slug(name)}.jpg"
        if dest.exists() and not force:
            print(f"  {name}: already has {dest.name} - skipping (--force to refetch)")
            continue
        try:
            fname, title = lead_image(wiki or TITLES.get(name, name))
            info = image_info(fname) if fname else None
        except Exception as e:
            print(f"  {name}: lookup failed ({e})")
            continue
        if not info:
            print(f"  {name}: no photo on Wikipedia - keep the frame from the clip, or add speakers/{dest.name} yourself")
            continue
        if not FREE.match(info["license"]):
            print(f"  {name}: Wikipedia photo isn't freely licensed ({info['license'] or 'unknown'}) - skipped")
            continue
        if (info["h"] or 0) < 700:
            print(f"  {name}: only a small photo ({info['w']}x{info['h']}) - skipped")
            continue
        with urllib.request.urlopen(urllib.request.Request(info["url"], headers=UA), timeout=60) as r:
            dest.write_bytes(r.read())
        stale = OUT / f"{slug(name)}.png"            # the old frame-from-clip cut-out
        if stale.exists():
            stale.unlink()
        with credits.open("a", encoding="utf-8") as c:
            c.write(f"{name}: photo by {info['artist'] or 'unknown'}, {info['license']} - {info['page']}\n")
        print(f"  {name}: {dest.name} from '{title}' ({info['license']}, by {info['artist'][:40] or 'unknown'})")
        time.sleep(1)
    print(f"\nDone. Credits in {credits}. Now run: python covers.py {args[0]}")


if __name__ == "__main__":
    main()
