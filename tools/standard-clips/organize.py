#!/usr/bin/env python3
"""One-time move of your existing files into REELS/DOWNLOADED, DONE and COVER.

    python organize.py ig.json

  sources/clips/*.mp4          -> REELS/DOWNLOADED
  out/ig/*.mp4, out/moments/   -> REELS/DONE
  out/covers/*.jpg             -> REELS/COVER
Reels in the plan that you deleted (downloaded but no finished reel) go into REELS/skip.txt, so they're
never downloaded or rendered again. Open skip.txt and delete a line to bring a reel back.
"""
import json
import shutil
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here))
import reels  # noqa: E402

moved = {"DOWNLOADED": 0, "DONE": 0, "COVER": 0}
for pattern, dest, key in [("sources/clips/*.mp4", reels.DOWNLOADED, "DOWNLOADED"),
                           ("out/ig/*.mp4", reels.DONE, "DONE"), ("out/moments/*.mp4", reels.DONE, "DONE"),
                           ("out/covers/*.jpg", reels.COVER, "COVER")]:
    for f in sorted(here.glob(pattern)):
        target = dest / f.name
        if not target.exists():
            shutil.move(str(f), target)
            moved[key] += 1
print("moved:", ", ".join(f"{n} -> REELS/{k}" for k, n in moved.items()))

if len(sys.argv) > 1:
    plan = json.loads((Path.cwd() / sys.argv[1]).read_text(encoding="utf-8"))
    done = {f.stem for f in reels.DONE.glob("*.mp4")}
    deleted = [m["id"] for m in plan["moments"] if m["id"] not in done and reels.clip(m).exists()]
    if deleted:
        old = reels.skipped()
        new = [i for i in deleted if i not in old]
        with reels.SKIP.open("a", encoding="utf-8") as f:
            if not old:
                f.write("# reels you deleted - never downloaded or rendered again. Delete a line to bring one back.\n")
            f.write("".join(i + "\n" for i in new))
        print(f"{len(new)} deleted reels added to REELS/skip.txt:\n  " + "\n  ".join(new))
print(f"\nREELS/DONE now has {len(list(reels.DONE.glob('*.mp4')))} reels, REELS/COVER {len(list(reels.COVER.glob('*.jpg')))} covers.")
