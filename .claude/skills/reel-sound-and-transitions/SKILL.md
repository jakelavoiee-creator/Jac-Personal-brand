---
name: reel-sound-and-transitions
description: Sound design and transition rules for reels: default SFX per element, hard cuts on the hit, transition governor, loudness, two audio modes. Use when adding SFX, music or transitions to a video.
---

# Reel Sound and Transitions

Numbers are starting values. Sound files are in `assets/sfx/` and are synthetic placeholders. Real sounds can replace them by keeping the same filenames. Never download or invent licensed audio.

## Default SFX per element
| Element | File | Spec |
|---|---|---|
| Hero word pop, caption emphasis | caption_tick.wav | 40 to 80 ms, 8 to 10 dB below the voice |
| Icon, sticker appears | soft_pop.wav | 60 to 120 ms |
| Cut, whip pan | whoosh_short.wav | peak on the cut frame, 6 to 8 dB below voice |
| Scene change | whoosh_long.wav | 600 to 1000 ms |
| Build into hook or CTA | riser.wav | ends 1 frame before the cut; pair with a hit |
| Hook word, title slam | impact.wav | 150 to 400 ms |
| Biggest moment | sub_drop.wav | max once per video |
| Flash, freeze frame | camera_shutter.wav | with assets/overlays/flash_white.mp4 |
| Glitch transition | glitch.wav | 150 to 300 ms |
| Reveal | magic_shimmer.wav | 400 to 800 ms |
| UI card | ui_click.wav | 40 to 120 ms |
| Texture bed | tape_hiss_bed.wav | 18 to 24 dB below voice |

Missing file: skip and log.

## Timing
- Hard cut on the hit: the cut lands on the SFX peak frame.
- Manual offset per cue: -200 to +200 ms.
- Final loudness about -17 LUFS, no clipping.

## Transition library
Camera Flash (flash_white.mp4 present), Film Burn (needs a film burn clip in assets/overlays; if missing use Camera Flash), Mask Glitch, Blackout, Whip Pan, chapter label card, subtitle bar. If the footage has an in-camera transition (hand over lens, whip), use it as the cut and add the sound only.

## Transition governor
- Transitions only on script transitions (topic or beat changes), never every cut.
- At most 1 overlay per 8 s, never on two cuts in a row.
- Goal: draw the viewer into the edit, not out.

## Audio modes
- `publish-attached` (default): export voice + SFX only. Trending sound attached at publish.
- `personal`: bake a user-supplied music file. Add a notice that licensing is the user's responsibility. Off by default for client work.
- Music present: snap cuts to beats within the offset range.
