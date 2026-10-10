#!/usr/bin/env python3
"""Make the cover for a finished reel straight from the video (no raw clip, no plan run needed).

    python cover_from_reel.py reel.mp4 --id a01-lucy-hale-surrender-to-the-timing-of
    python cover_from_reel.py reel.mp4 --cover "trust the TIMING." --speaker "Lucy Hale"
    python cover_from_reel.py reel.mp4 --id ... --at 7.5        # use the frame at 7.5s for the photo
    python cover_from_reel.py reel.mp4 --sheet                  # contact sheet of the reel, to tell which one it is

The headline comes from the plan (ig.json, then archive.json) when --id is given. The photo is the speaker's best
front-facing frame in the reel (or speakers/<speaker>.jpg/.png if you have one), cropped and faded like every cover.
Writes REELS/COVER/<id>.jpg (or --out).
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import covers  # noqa: E402
import reels  # noqa: E402


def moment(rid):
    for f in ("ig.json", "archive.json"):
        for m in json.loads((HERE / f).read_text(encoding="utf-8"))["moments"]:
            if m["id"] == rid:
                return m
    sys.exit(f"{rid} isn't in ig.json or archive.json - pass --cover and --speaker instead")


def sheet(video, out):
    """12 frames of the reel in a grid, to identify it."""
    dur = float(covers.subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                       str(video)], capture_output=True, text=True).stdout.strip() or 20)
    frames = [covers.frame_at(video, dur * (i + 0.5) / 12) for i in range(12)]
    w, h = 270, 480
    grid = Image.new("RGB", (6 * w, 2 * h))
    for i, f in enumerate(frames):
        if f:
            grid.paste(f.resize((w, h)), ((i % 6) * w, (i // 6) * h))
    grid.save(out)
    print(f"sheet: {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--id")
    ap.add_argument("--cover")
    ap.add_argument("--speaker")
    ap.add_argument("--at", type=float, help="seconds: take the photo from this frame")
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()
    video = Path(a.video)
    if a.sheet:
        return sheet(video, Path(a.out or video.with_suffix(".sheet.jpg")))
    m = dict(moment(a.id)) if a.id else {"id": video.stem}
    if a.cover:
        m["cover"] = a.cover
    if a.speaker:
        m["speaker"] = a.speaker
    if not m.get("cover"):
        sys.exit("no headline: pass --cover \"words with the LAST one big\"")
    name = covers.speaker_of(m)
    if a.at is not None:
        frame = covers.frame_at(video, a.at)
        box = covers.find_face(frame) if frame else None
        if not box:
            sys.exit(f"no face found at {a.at}s - try another time")
        photo = covers.portrait(frame, box)
    else:
        photo = covers.speaker_photo(name, Path("-")) or covers.speaker_photo(name, video)
    if photo is None:
        sys.exit("no clear face in this reel - pass --at <seconds> on a frame where the speaker faces the camera")
    out = Path(a.out) if a.out else reels.COVER / f"{m['id']}.jpg"
    covers.cover(m, photo, out)
    print(f"[cover] {out}")


if __name__ == "__main__":
    main()
