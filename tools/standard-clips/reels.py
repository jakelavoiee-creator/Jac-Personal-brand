"""Where the reels live on your computer.

    REELS/DOWNLOADED/<id>.mp4   raw clip from the original source (fetch.py)
    REELS/DONE/<id>.mp4         finished reel: eye-open intro, sounds, captions, end card (render_hr.py)
    REELS/COVER/<id>.jpg        the reel's cover (covers.py)
    REELS/skip.txt              reels you deleted - never downloaded or rendered again (delete a line to bring one back)

REELS sits at the top of the project (next to tools/) and is git-ignored.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "REELS"
DOWNLOADED, DONE, COVER = ROOT / "DOWNLOADED", ROOT / "DONE", ROOT / "COVER"
SKIP = ROOT / "skip.txt"
for d in (DOWNLOADED, DONE, COVER):
    d.mkdir(parents=True, exist_ok=True)


def clip(m, base=None):
    """The downloaded clip for a moment (falls back to the old sources/clips location)."""
    p = DOWNLOADED / f"{m['id']}.mp4"
    if not p.exists() and base is not None and m.get("src") and (Path(base) / m["src"]).exists():
        return Path(base) / m["src"]
    return p


def skipped():
    if not SKIP.exists():
        return set()
    return {l.strip() for l in SKIP.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")}
