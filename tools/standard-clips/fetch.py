#!/usr/bin/env python3
"""Download the source videos + English auto-captions for the given plan files (Windows, Mac, Linux).

    python fetch.py clips.json clips2.json

Needs ffmpeg and deno on PATH, and yt-dlp (best: python -m pip install -U "yt-dlp[default]"). Same job as fetch.sh, without bash.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
src = here / "sources"
src.mkdir(exist_ok=True)

# Prefer the pip-installed yt-dlp module: the standalone Windows .exe can break (PyInstaller "Failed to extract").
try:
    import yt_dlp  # noqa: F401
    YTDLP = [sys.executable, "-m", "yt_dlp"]
except ImportError:
    YTDLP = ["yt-dlp"]
    if not shutil.which("yt-dlp"):
        sys.exit('yt-dlp not found - run:  python -m pip install -U "yt-dlp[default]"')
if not shutil.which("ffmpeg"):
    sys.exit("ffmpeg not found - install it first (see README, 'Download on your own computer').")

plans = sys.argv[1:] or ["clips.json"]
base = YTDLP + ["--no-warnings", "--sleep-requests", "1"]
CLIENTS = [None, "web_safari", "tv_simply", "web_embedded", "mweb", "android_vr"]

CLIP_PAD = 3.0  # must match render.py


def secs(t):
    out = 0.0
    for part in str(t).split(":"):
        out = out * 60 + float(part)
    return out


def download(url, out, extra):
    """Try each YouTube client until one serves video; True when `out` exists."""
    for client in CLIENTS:
        if out.exists():
            return True
        ec = ["--extractor-args", f"youtube:player_client={client}"] if client else []
        print(f"    trying {client or 'default'} client...")
        subprocess.run(base + ec + extra + ["-f", "bv*[height<=1080]+ba/b", "--merge-output-format", "mp4",
                                            "-o", str(out.with_suffix(".%(ext)s")), url])
    return out.exists()


# Default: download only each clip's few seconds (full quality, small files that fit upload limits).
# --full: download whole source videos instead.
full = "--full" in plans
plans = [p for p in plans if p != "--full"]
clips = [c for p in plans for c in json.loads((here / p).read_text())["clips"]]
(src / "clips").mkdir(exist_ok=True)
for i, c in enumerate(clips, 1):
    vid, url = c["youtube"], f"https://www.youtube.com/watch?v={c['youtube']}"
    print(f"[{i}/{len(clips)}] {c['id']}")
    if full:
        download(url, src / f"{vid}.mp4", [])
    elif not (src / f"{vid}.mp4").exists():
        a, b = max(0.0, secs(c["start"]) - CLIP_PAD), secs(c["end"]) + CLIP_PAD
        download(url, src / "clips" / f"{c['id']}.mp4", ["--download-sections", f"*{a:.2f}-{b:.2f}", "--force-keyframes-at-cuts"])
    if not (src / f"{vid}.en.vtt").exists():
        subprocess.run(base + ["--skip-download", "--write-auto-subs", "--sub-langs", "en-orig",
                               "--sub-format", "vtt", "-o", str(src / f"{vid}.%(ext)s"), url])
        orig = src / f"{vid}.en-orig.vtt"
        if orig.exists():
            orig.rename(src / f"{vid}.en.vtt")

missing = [c["id"] for c in clips if not ((src / f"{c['youtube']}.mp4").exists() or (src / "clips" / f"{c['id']}.mp4").exists())]
print(f"\nDone. Upload the files in {src / 'clips'}" + (f"\nStill missing: {', '.join(missing)}" if missing else ""))
