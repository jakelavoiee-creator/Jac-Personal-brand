---
name: reel-type-and-layout
description: Caption, typography, b-roll and text-screen rules for short-form reels: hero/support hierarchy, safe zones, Emphasis Swap, key-point cards. Use when styling or placing text on a video.
---

# Reel Type and Layout

Numbers are starting values to tune on real clips. Font files live in `assets/fonts/<family>/`. Full approved taste list: see `taste-library.md` in this folder.

## Safe zone (9:16, 1080x1920)
- Keep all text and key subjects out of the bottom 20% and right 12%.
- Default caption block sits 20 to 28% up from the bottom. 100% compliance, fixed before rendering.

## Hero and support hierarchy
- One hero element per line (a number, a name, the key verb): Instrument Serif Italic, large.
- 2 to 4 support words at about 25% of hero size in Inter Medium, as a tidy block under or beside the hero.
- Hero choice from the transcript: numbers, money, names, the strongest verb, the contrast word. Emphasis-word detection stays an internal engine.
- Every text element animates in: hero first, support 3 to 5 frames later.

## Literal-word effects
Effect matches the spoken word, fires within 50 ms of its start. Max 1 literal effect per sentence.

## Text behind subject / contour / floor-wall text
Need a subject matte or plane tracking. If unavailable, use flat text over the video in the safe zone and say so.

## B-roll and the Emphasis Swap
- When the caption leads: desaturate and slightly darken the b-roll under it.
- When the b-roll leads: full color, caption drops to support size.
- Decide both in one pass.

## Text screens (key-point cards)
Use at the strongest statement. Three variants: white card + accent text, black card + white text, accent card + white text. Light grain 6 to 10%. Hold 1.0 to 1.8 s. In 15 to 30 s videos about one every 8 to 10 s.

## A-roll
Soft key light, dim background, clean mic, smooth zooms. If the footage is flat, noisy or the audio is weak, say so before rendering.

## Emoji and icons
Open decision. Until settled use no emoji and no glyphs.
