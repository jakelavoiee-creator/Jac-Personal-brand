# Assets checklist

## Fonts (included, OFL)
Instrument Serif, Playfair Display, DM Serif Display, EB Garamond, Bodoni Moda, Cormorant Garamond, Montserrat, Inter, Poppins (SemiBold, Bold, Light, Medium kept), League Spartan, Anton, Bebas Neue, Space Grotesk, DM Sans, Syne.
Variable fonts render at their default weight in ffmpeg/libass. For a specific weight, create a static instance with fontTools.

## Sounds: placeholders included. Swap in real ones with the same filename.
| File | Role |
|---|---|
| caption_tick.wav | Hero word pop, emphasis |
| soft_pop.wav | Icon or sticker appears |
| whoosh_short.wav | Cuts and whip pans |
| whoosh_long.wav | Scene changes, intros |
| riser.wav | Build into a hook, reveal or CTA |
| impact.wav | Hook word, title slam |
| sub_drop.wav | Biggest moment, once per video |
| camera_shutter.wav | Flash, freeze frame |
| glitch.wav | Glitch transitions |
| magic_shimmer.wav | Reveals |
| ui_click.wav | UI cards |
| tape_hiss_bed.wav | Texture bed |

Still to source if wanted: charge, jolt build up, camera focus beep, heartbeat, paper flip, cash ding, vinyl crackle, room tone, film projector bed, muffled underwater whoosh, keyboard typing.

## Overlays and grade
- flash_white.mp4: included.
- film_burn.mp4: not included. Add your own.
- A warm cinematic LUT (.cube) in assets/luts: not included. Without it a grade is built from ffmpeg curves plus grain.

## Music
assets/music/ is empty. Add cinematic tracks with an emotional build that you own or can use. music-arc-sync analyzes them. Nothing is downloaded from Spotify.

## Images
Put Pinterest-style or generated images in input/images/. Log where each came from.
