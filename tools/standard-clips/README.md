# Standard Clips

Speaker clips in the @nextstandrd reel style, branded **TOO CREATIVE FOR NINE TO FIVE**.

## North star
Cinematic, stripped back, hard-hitting. One idea per clip, 20–45s, opening on the strongest line.

## Locked look
| Zone | Spec |
|---|---|
| Canvas | 1080×1920 black. 16:9 footage full-width, centred vertically (~32% of height) |
| Grade | Black & white, contrast +22%, crushed blacks, temporal film grain, soft vignette |
| Captions | 1–3 words at a time, Inter Display Bold 40px, UPPERCASE, white, on the speaker at 60% of the footage height. Timed word by word from YouTube captions |
| Watermark | Logo, 70px wide, 55% opacity, bottom centre of the footage (only when a logo is set) |
| Ending (5.4s) | Footage + audio fade to black (1.6s) → logo on black 1.4s → logo on white 0.4s → "TOO CREATIVE FOR NINE TO FIVE." white on black 0.4s → "LIVE NOW." black on white 3.2s, fading out. The end-card sound bed runs under all of it |
| Audio | Original speech only, loudness-normalised to −14 LUFS |

## Run it
```bash
cd tools/standard-clips
./fetch.sh                                   # sources + captions into sources/
python3 render.py endcard --logo logo.png --sfx endcard_sfx.wav --out build/endcard.mp4
python3 render.py batch clips.json           # renders out/01-….mp4 … out/10-….mp4
python3 render.py batch clips.json --only 05-harvey-jump   # just one
```
To use the real logo, put a transparent PNG at `tools/standard-clips/logo.png`, set `"logo": "logo.png"` in `clips.json`, and re-run the endcard and batch steps. The renderer makes white and black versions from the logo's shape. Until then it uses a placeholder mark.

`sources/`, `build/` and `out/` are git-ignored (large media).

## Rights
These clips are other people's speeches, and the default end-card sound bed is taken from @nextstandrd's reels. Swap in a licensed SFX (`--sfx`) before posting.
