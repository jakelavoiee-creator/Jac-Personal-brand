# Reel editor

Builds the 9:16 reel from your clips with the reference edit style:
- every shot opens punched in (default 115%) and eases out to 100%
- hard cuts on the reference cut points (1.1 / 2.1 / 3.2 / 3.9 / 4.7 / 6.5 / 8.1 / 11.0 / 12.0 / 13.8 / 16.1 / 18.3 / 29.0 / 31.0s)
- click SFX at each `clicks` offset (seconds from the start of that shot)
- whoosh into the payoff, which plays letterboxed on black

`sfx/` holds original synthesized sounds (no licensing needed).

Run: `python3 build.py edit.json`

Per-shot options: `in` (start point inside the clip), `dur`, `clicks`, `zoom_from`, `zoom_to`, `focus_x`/`focus_y` (0-1 crop focus), `fit: "letterbox"`, `whoosh`.
