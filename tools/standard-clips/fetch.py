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
# Gentle pacing: bursts of requests are what trigger YouTube's "confirm you're not a bot" check.
base = YTDLP + ["--no-warnings", "--sleep-requests", "2", "--sleep-interval", "4", "--max-sleep-interval", "8"]
# A logged-in cookies.txt next to this script (git-ignored) gets past the bot check.
cookies = here / "cookies.txt"
if cookies.exists():
    base += ["--cookies", str(cookies)]
else:
    print("note: no cookies.txt found - if YouTube asks to 'confirm you're not a bot', add one (see README).")
CLIENTS = [None, "web_safari", "tv_simply"]

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
        subprocess.run(base + ec + extra + ["-f", "bv*[height<=2160]+ba/b", "--merge-output-format", "mp4",   # up to 4K source
                                            "-o", str(out.with_suffix(".%(ext)s")), url])
    return out.exists()


def ts(t):
    return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{t % 60:06.3f}"


def transcribe(clip, vtt, offset):
    """Speech-to-text with word timings (Whisper), written as a YouTube-style auto-caption VTT."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(f"    no captions on YouTube for this one - to transcribe it: python -m pip install faster-whisper, then run fetch.py again")
        return
    print(f"    no captions on YouTube - transcribing {clip.name} (first run downloads the speech model)...")
    global _WHISPER
    if "_WHISPER" not in globals():
        _WHISPER = WhisperModel("small.en", device="cpu", compute_type="int8")
    segments, _ = _WHISPER.transcribe(str(clip), language="en", word_timestamps=True, vad_filter=True)
    out = ["WEBVTT", "Kind: captions", "Language: en", ""]
    for seg in segments:
        ws = [w for w in (seg.words or []) if w.word.strip()]
        if not ws:
            continue
        line = ws[0].word.strip() + "".join(f"<{ts(w.start + offset)}><c> {w.word.strip()}</c>" for w in ws[1:])
        out += [f"{ts(ws[0].start + offset)} --> {ts(ws[-1].end + offset)}", line, ""]
    vtt.write_text("\n".join(out), encoding="utf-8")
    print(f"    wrote {vtt.name}")


# Default: download only each clip's few seconds (full quality, small files that fit upload limits).
# --full: download whole source videos instead.
full = "--full" in plans
plans = [p for p in plans if p != "--full"]
clips = [c for p in plans for k in ("clips", "moments") for c in json.loads((here / p).read_text()).get(k, [])]
sys.path.insert(0, str(here))
import reels  # noqa: E402  REELS/DOWNLOADED, DONE, COVER
skip = reels.skipped()
clips = [c for c in clips if c["id"] not in skip]
for i, c in enumerate(clips, 1):
    vid, url = c["youtube"], f"https://www.youtube.com/watch?v={c['youtube']}"
    print(f"[{i}/{len(clips)}] {c['id']}")
    if full:
        download(url, src / f"{vid}.mp4", [])
    elif not (src / f"{vid}.mp4").exists() and not reels.clip(c, here).exists():
        a, b = max(0.0, secs(c["start"]) - CLIP_PAD), secs(c["end"]) + CLIP_PAD
        download(url, reels.DOWNLOADED / f"{c['id']}.mp4", ["--download-sections", f"*{a:.2f}-{b:.2f}", "--force-keyframes-at-cuts"])
    vtt = src / f"{vid}.en.vtt"
    if not vtt.exists():                               # auto-captions first, else the uploader's own captions
        subprocess.run(base + ["--skip-download", "--write-auto-subs", "--write-subs", "--sub-langs", "en-orig,en,en-US,en-GB",
                               "--sub-format", "vtt", "-o", str(src / f"{vid}.%(ext)s"), url])
        for lang in ("en-orig", "en-US", "en-GB"):
            alt = src / f"{vid}.{lang}.vtt"
            if alt.exists() and not vtt.exists():
                alt.rename(vtt)
    if not vtt.exists():                               # no captions on YouTube at all: transcribe the clip here
        clip = reels.clip(c, here)
        if clip.exists():
            transcribe(clip, vtt, 0.0 if full else max(0.0, secs(c["start"]) - CLIP_PAD))

missing = [c["id"] for c in clips if not ((src / f"{c['youtube']}.mp4").exists() or reels.clip(c, here).exists())]
print(f"\nDone. Clips are in {reels.DOWNLOADED}" + (f"\nStill missing: {', '.join(missing)}" if missing else ""))
