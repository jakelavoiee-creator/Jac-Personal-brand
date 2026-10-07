#!/usr/bin/env python3
"""Download the source videos + English auto-captions for the given plan files (Windows, Mac, Linux).

    python fetch.py clips.json clips2.json

Needs yt-dlp, ffmpeg and deno on PATH. Same job as fetch.sh, without bash.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
src = here / "sources"
src.mkdir(exist_ok=True)

for tool in ("yt-dlp", "ffmpeg"):
    if not shutil.which(tool):
        sys.exit(f"{tool} not found - install it first (see README, 'Download on your own computer').")

plans = sys.argv[1:] or ["clips.json"]
ids = sorted({c["youtube"] for p in plans for c in json.loads((here / p).read_text())["clips"]})
base = ["yt-dlp", "--no-warnings", "--sleep-requests", "1"]
CLIENTS = [None, "web_safari", "tv_simply", "web_embedded", "mweb", "android_vr"]

for i, vid in enumerate(ids, 1):
    url = f"https://www.youtube.com/watch?v={vid}"
    print(f"[{i}/{len(ids)}] {vid}")
    # YouTube refuses some clients (403 / SABR-only); fall back through others until one serves video.
    for client in CLIENTS:
        if (src / f"{vid}.mp4").exists():
            break
        extra = ["--extractor-args", f"youtube:player_client={client}"] if client else []
        print(f"    trying {client or 'default'} client...")
        subprocess.run(base + extra + ["-f", "bv*[height<=1080]+ba/b", "--merge-output-format", "mp4",
                                       "-o", str(src / f"{vid}.%(ext)s"), url])
    if not (src / f"{vid}.en.vtt").exists():
        subprocess.run(base + ["--skip-download", "--write-auto-subs", "--sub-langs", "en-orig",
                               "--sub-format", "vtt", "-o", str(src / f"{vid}.%(ext)s"), url])
        orig = src / f"{vid}.en-orig.vtt"
        if orig.exists():
            orig.rename(src / f"{vid}.en.vtt")

missing = [v for v in ids if not (src / f"{v}.mp4").exists()]
print(f"\nDone. Videos are in {src}" + (f"\nStill missing: {', '.join(missing)}" if missing else ""))
