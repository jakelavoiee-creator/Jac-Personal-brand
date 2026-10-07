#!/usr/bin/env python3
"""Pull an Instagram account's reels (stats + top videos) from YOUR computer, using your logged-in cookies.

    python ig_fetch.py hustlersrevivalofficial            # top 8 reels
    python ig_fetch.py hustlersrevivalofficial --top 12
    python ig_fetch.py ascendrecode --top 999      # every reel on the page

Needs cookies.txt (exported from instagram.com while logged in) next to this script.
Writes ig/<account>/reels.json (all reels with plays/likes/captions) and ig/<account>/<code>.mp4 for the top ones.
Upload that folder so the reels can be analysed.
"""
import http.cookiejar
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

here = Path(__file__).resolve().parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
account = args[0].lstrip("@")
top = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 8

jar = http.cookiejar.MozillaCookieJar()
cookies = here / "cookies.txt"
if not cookies.exists():
    sys.exit("cookies.txt not found next to this script - export your instagram.com cookies first (see README).")
jar.load(str(cookies), ignore_discard=True, ignore_expires=True)
csrf = next((c.value for c in jar if c.name == "csrftoken" and "instagram" in c.domain), "")
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
HDR = {"User-Agent": UA, "X-IG-App-ID": "936619743392459", "X-CSRFToken": csrf, "X-Requested-With": "XMLHttpRequest",
       "Referer": f"https://www.instagram.com/{account}/reels/"}


def call(url, data=None):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data else None, headers=HDR)
    with opener.open(req, timeout=30) as r:
        return json.loads(r.read())


user = call(f"https://www.instagram.com/api/v1/users/web_profile_info/?username={account}")["data"]["user"]
print(f"{user['full_name']} | {user['edge_followed_by']['count']:,} followers")
items, max_id = [], None
for _ in range(10):
    form = {"target_user_id": user["id"], "page_size": 24, "include_feed_video": "true"}
    if max_id:
        form["max_id"] = max_id
    d = call("https://www.instagram.com/api/v1/clips/user/", form)
    items += [it["media"] for it in d.get("items", [])]
    pi = d.get("paging_info") or {}
    if not pi.get("more_available"):
        break
    max_id = pi.get("max_id")
    time.sleep(3)

out = here / "ig" / account
out.mkdir(parents=True, exist_ok=True)
rows = [{"code": m["code"], "plays": m.get("play_count") or m.get("ig_play_count") or 0, "likes": m.get("like_count"),
         "comments": m.get("comment_count"), "seconds": round(m.get("video_duration") or 0),
         "caption": ((m.get("caption") or {}).get("text") or ""), "taken_at": m.get("taken_at"),
         "video": (m.get("video_versions") or [{}])[0].get("url")} for m in items]
rows.sort(key=lambda r: -r["plays"])
(out / "reels.json").write_text(json.dumps(rows, indent=1))
print(f"{len(rows)} reels saved to {out / 'reels.json'}")
for r in rows[:top]:
    f = out / f"{r['code']}.mp4"
    if r["video"] and not f.exists():
        urllib.request.urlretrieve(r["video"], f)
        time.sleep(2)
    print(f"  {r['plays']:>10,} plays  {r['seconds']:>3}s  {f.name}")
print(f"\nDone. Upload the folder {out}")
