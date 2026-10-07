#!/usr/bin/env python3
"""Pack downloaded reels into small "study" zips (<= 25MB each) that are easy to upload.

    python ig_pack.py ascendrecode orvinworld

Reads ig/<account>/*.mp4 (+ the .json gallery-dl writes with --write-metadata), makes a light 360p copy of
each reel (enough to watch and transcribe; the final reels are rebuilt from the original YouTube sources),
and writes ig/pack/<account>-01.zip, -02.zip ... each with an index.json of captions, likes and dates.
"""
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

here = Path(__file__).resolve().parent
LIMIT = 25 * 1024 * 1024
accounts = sys.argv[1:] or sys.exit(__doc__)
out = here / "ig" / "pack"
out.mkdir(parents=True, exist_ok=True)


def meta(mp4):
    for j in (mp4.with_name(mp4.name + ".json"), mp4.with_suffix(".json")):
        if j.exists():
            m = json.loads(j.read_text(encoding="utf-8"))
            return {"shortcode": m.get("post_shortcode") or m.get("shortcode"), "date": str(m.get("date") or m.get("post_date") or ""),
                    "likes": m.get("likes"), "views": m.get("video_view_count") or m.get("play_count"),
                    "caption": (m.get("description") or "")[:600]}
    return {}


for acct in accounts:
    reels = sorted((here / "ig" / acct).glob("*.mp4"))
    print(f"{acct}: {len(reels)} reels")
    tmp = Path(tempfile.mkdtemp())
    part, size, index, zf = 0, 0, [], None

    def close():
        if zf:
            zf.writestr("index.json", json.dumps(index, indent=1, ensure_ascii=False))
            zf.close()
            print(f"  wrote {zf.filename}")

    for i, mp4 in enumerate(reels, 1):
        small = tmp / mp4.name
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vf", "scale=-2:360", "-r", "24",
                            "-c:v", "libx264", "-crf", "30", "-preset", "veryfast", "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(small)])
        if r.returncode or not small.exists():
            print(f"  skipped {mp4.name}")
            continue
        n = small.stat().st_size
        if zf is None or size + n > LIMIT:
            close()
            part, size, index = part + 1, 0, []
            zf = zipfile.ZipFile(out / f"{acct}-{part:02d}.zip", "w", zipfile.ZIP_STORED)
        zf.write(small, mp4.name)
        index.append({"file": mp4.name, **meta(mp4)})
        size += n
        small.unlink()
        print(f"  [{i}/{len(reels)}] {mp4.name}")
    close()
print(f"\nDone. Upload the zips in {out}")
