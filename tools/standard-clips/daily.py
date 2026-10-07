#!/usr/bin/env python3
"""One command per day: download the day's clips, then render them.

    python daily.py day-01.json

Finished reels land in the plan's out_dir (e.g. out/day-01/), ready to post.
Needs: ffmpeg + deno on PATH, and  python -m pip install -U "yt-dlp[default]" pillow numpy
"""
import json
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
if len(sys.argv) != 2:
    sys.exit(__doc__)
plan = Path(sys.argv[1])
if not plan.is_absolute():
    plan = (Path.cwd() / plan).resolve()
rel = plan.relative_to(here) if plan.is_relative_to(here) else plan

print("== 1/2 downloading clips ==")
subprocess.run([sys.executable, str(here / "fetch.py"), str(rel)], cwd=here)
print("\n== 2/2 rendering reels ==")
subprocess.run([sys.executable, str(here / "render.py"), "batch", str(plan)], cwd=here)

data = json.loads(plan.read_text())
out = plan.parent / data["out_dir"]
done = sorted(out.glob("*.mp4")) if out.exists() else []
print(f"\n{len(done)}/{len(data['clips'])} reels ready in {out}")
