---
name: awakening-reel-recipe
description: Edit Jacob's 15-30 s relatable awakening talking videos with a retention spike at least every 2 seconds. Use for any raw talking clip from his personal brand series.
---

# Awakening Reel Recipe

For Jacob's personal brand: 15 to 30 s talking videos about relatable realisations and awakening. Sits on top of `reel-director`, `reel-type-and-layout` and `reel-sound-and-transitions`. Load all three. Numbers are starting values.

## Signature (locked system)
Fonts, caption look, SFX, intro, outro and transitions follow `SIGNATURE.md` exactly. Only the script and the b-roll change between reels. B-roll visual world: the soul as light in a vast universe (`BRAND.md`). Jac supplies the b-roll; place it by the vibe of each line, with the strongest clip on the felt line.

## North star
Calm, cinematic, intimate, with a new visual or sound beat arriving constantly underneath. Warm grade, grain, one accent color, black-and-white b-roll for abstract ideas, full color for concrete ones. Default caption style: Editorial Mix.

## The 2-second spike rule
A spike is any change the viewer notices: cut or punch-in, hero word pop with a tick, b-roll insert, text card, zoom reset, flash, SFX hit, color swap.
1. Build a spike map in plan.json: timestamp, type, word.
2. The gap between spikes never exceeds 2.0 s (about 8 to 15 spikes per video).
3. Snap spikes to word starts, phrase boundaries and breaths, not a fixed metronome.
4. Rotate types. No more than 2 of the same type in a row.
5. Most spikes are light (4 to 6% punch-in, caption pop, SFX tick). Heavy ones stay governed: at most 1 overlay per 8 s, text cards about every 8 to 10 s.
6. A gap about to exceed 2.0 s gets the lightest suitable spike: punch-in, hero pop, or a 0.6 to 1.2 s b-roll insert.

## Structure
- 0.0 to 1.0 s hook: first words as hero text with a punch-in and a hit. No slow intro.
- Body: one idea per phrase, hero word per phrase.
- The realisation line: text card or biggest hero treatment.
- Last 1.5 s: loop-friendly ending, final line as a hero card, last frame visually echoes the first.

## Keep it calm
Spikes small and varied. Captions in the safe zone. Voice clear on top, SFX 10 to 18 dB under, about -17 LUFS, publish-attached audio by default.

## QA additions
Report spike count and largest gap. No gap over 2.0 s, each spike within 50 ms of its word, no two heavy overlays touching.
