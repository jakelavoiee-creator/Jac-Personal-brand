#!/usr/bin/env python3
"""Download the full-size image from a Pinterest pin link (pinterest.com/pin/... or pin.it/...).

Usage: python3 reel-kit/scripts/pin_fetch.py PIN_URL NAME
Saves carousels/images/NAME.jpg and logs the pin + source in carousels/images/SOURCES.md
(Pinterest images belong to their creators: credit them or get permission before posting.)
"""
import os, re, sys, html, datetime, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "carousels", "images")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.geturl(), r.read()

def main(url, name):
    final, page = get(url)
    text = page.decode("utf-8", "ignore")
    cands = re.findall(r'https://i\.pinimg\.com/originals/[^"\'\\\s]+\.(?:jpg|jpeg|png|webp)', text)
    if not cands:
        m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', text)
        if m: cands = [html.unescape(m.group(1))]
    if not cands:
        cands = re.findall(r'https://i\.pinimg\.com/\d+x/[^"\'\\\s]+\.(?:jpg|jpeg|png|webp)', text)
    if not cands: sys.exit("No image found on that pin page.")
    img = cands[0]
    # Prefer the original upload over a resized copy.
    orig = re.sub(r'i\.pinimg\.com/\d+x[^/]*/', 'i.pinimg.com/originals/', img)
    for u in (orig, img):
        try:
            _, data = get(u); img = u; break
        except Exception:
            continue
    else:
        sys.exit("Could not download the image.")
    os.makedirs(OUT, exist_ok=True)
    ext = os.path.splitext(img)[1] or ".jpg"
    dest = os.path.join(OUT, name + ext)
    open(dest, "wb").write(data)
    title = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]*)"', text)
    with open(os.path.join(OUT, "SOURCES.md"), "a") as f:
        f.write(f"- {name}{ext}: pin {final} | image {img} | title: {html.unescape(title.group(1)) if title else '?'} | {datetime.date.today()}\n")
    print(dest, len(data), "bytes")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
