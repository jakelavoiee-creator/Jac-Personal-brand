# ad-edit: raw founder footage to finished ads

One script (`aedit.py`) that needs only ffmpeg and Python. Tested on 27 Oct 2026 with a synthetic 14.5 s founder clip: 38% dead air removed, captions with 0 overlaps, music ducked ~11 dB under the voice, final loudness −14.7 LUFS, 2 hooks × 2 ratios = 4 variants in about 65 s.

## Quick start
```bash
python3 aedit.py transcribe footage/A1_raw.mp4 -o footage/A1_words.json   # needs GEMINI_API_KEY
python3 aedit.py build examples/founder_spec.json
```
`build` runs the following steps in order:
1. cut
2. captions
3. mix
4. hooks
5. reframe
6. safe-zone preview

Finished files land in `out/`, named `<name>_H<hook>_<ratio>.mp4`.

## Steps
| Step | What it does | Main knobs |
|---|---|---|
| `cut` | Removes pauses longer than `min_silence`, keeps `pad` of breath around words, and zooms every other segment by `punch` (1.12 = 12%), so jump cuts read as intentional. Writes `.edl.json` so captions follow the cut | `noise_db` −35 (raise toward −30 in noisy rooms), `min_silence` 0.35, `pad` 0.08, `punch` 1.12 |
| `captions` | Word-by-word captions, up to 3 words per line, a new line at punctuation. The active word turns gold and pops to 112%. Emphasis words stay gold. Each line slides up 18 px on entry | `y` 0.60 (inside the Reels safe zone), `size` 0.052, `upper`, `emphasis` |
| `mix` | Music bed at −18 dB, ducked about 11 dB whenever the founder talks (sidechain, 15 ms attack, 350 ms release). SFX are placed at timestamps, then loudness is normalized to −14 LUFS / −1.5 dBTP | `music_db`, `whoosh_on_cuts`, `sfx` list |
| `hooks` | Puts each hook clip in front of the same body, giving one ad per hook. This is the cheapest way to test 3–5 hooks against one proven body | `hooks` list |
| `reframe` | 9:16 at 1080×1920 (Reels, Stories, TikTok) and 4:5 at 1080×1350 (Feed) | `y_bias` 0.3 keeps faces in the top third of a 4:5 crop |
| `safezone` | Shades the areas the platform UI covers (top 14%, bottom 35%, right 12%). Use it for review only | |

SFX pack: `aedit.py sfx` synthesizes whoosh, pop, hit and riser into `assets/sfx/` (no licensing issues). `build` runs it automatically.

## Transcripts
There is no offline speech model, because the container can't download Whisper weights. `transcribe` sends the audio to Gemini and asks for word timings, so it shares the free-tier quota with the study runners (resets about 07:00 UTC). You can also hand-write `words.json`: `[{"w": "Nobody", "s": 1.35, "e": 1.62}, ...]`, in **raw-take** time. The cut's `.edl.json` remaps the timings.

## What it doesn't do yet (next)
- B-roll inserts and split screens
- Green-screen cutouts
- Animated emoji/sticker overlays
- Automatic beat-synced cuts to the music

The specs for these are in `training/ad-editing/EDITING-PLAYBOOK.md`.
