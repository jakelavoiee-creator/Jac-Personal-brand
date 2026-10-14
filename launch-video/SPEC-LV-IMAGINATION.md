# Spec ad: Louis Vuitton Imagination, "Blue Hour"

**Status:** brief locked, not generated yet (needs a session with the full Higgsfield connector: generate_image / generate_video / upscale_video).
**Use:** portfolio spec ad and the payoff of the behind-the-scenes reel. LV is not on Trybe, so caption it: "Spec ad, not affiliated with Louis Vuitton."
**Reference photo:** the official bottle + Monogram Eclipse travel case shot at blue hour by the sea (user re-attaches it in the new session).

## North star
Quiet luxury. Blue hour by the sea: cool blue and slate, faint pink horizon, wet black sand, soft diffused light, slow motion. No people, no cuts inside a shot.

## Shots (6 × ~2.5s, 9:16, each generated separately with the photo as start/reference image)

1. Extreme macro: a single water drop slides down the glass bottle, light refracting through the pale blue liquid.
2. The bottle standing on wet black sand at blue hour, a small wave gently washes around its base in slow motion.
3. A citrus slice splitting in slow motion with cold mist, then black tea leaves drifting through clear water.
4. Macro of the travel case's silver latch clicking open, light gliding across the leather grain.
5. A slow 180-degree orbit around the bottle, pink horizon glowing behind it.
6. The bottle and travel case side by side as in the photo, slow push-in, empty space in the upper third.

## Generation rules
- Product fidelity: bottle shape, black cap, pale blue liquid, "IMAGINATION / LOUIS VUITTON" engraving and the Monogram Eclipse case with its silver latch match the photo exactly.
- No people, no hands, no generated text or extra logos.
- Highest-quality model, 1080p minimum, audio off. 2 variants per shot, upscale the best of each to 4K.
- QC: reject any shot where the engraving warps, the cap changes shape or the liquid changes color. Shots 2 and 5 carry the ad.

## Edit
- 15s master: shots 1-6 on the beat, slow cross-dissolves in shot 3, ambient sound bed.
- End card: "IMAGINATION" in thin white serif caps over shot 6, then a soft cut to black.
- Also export a 9s Reels cutdown (shots 1, 2, 5, 6).
- Drop the master into the BTS reel as the payoff (letterboxed, whoosh in), via `edit/build.py`.

## Paste-ready prompt (for claude.ai, if generating there instead)

```
Using Higgsfield, create a 15-second 9:16 luxury fragrance commercial for Louis Vuitton Imagination, using the attached photo as the product reference.

Product fidelity: the bottle shape, black cap, pale blue liquid, "IMAGINATION / LOUIS VUITTON" engraving and the Monogram Eclipse travel case with its silver latch must match the photo exactly. Use the photo as the start or reference image for every shot that shows the product.

World: blue hour by the sea. Cool blue and slate tones, faint pink horizon, wet black sand, soft diffused light, shallow depth of field, slow motion, locked exposure.

Generate these 6 shots separately (about 2.5s each), each one continuous with no cuts:
1. Extreme macro: a single water drop slides down the glass bottle, light refracting through the pale blue liquid.
2. The bottle standing on wet black sand at blue hour, a small wave gently washes around its base in slow motion.
3. A citrus slice splitting in slow motion with cold mist, then black tea leaves drifting through clear water.
4. Macro of the travel case's silver latch clicking open, light gliding across the leather grain.
5. A slow 180-degree orbit around the bottle, pink horizon glowing behind it.
6. The bottle and travel case side by side as in the photo, slow push-in, empty space in the upper third.

Rules: no people, no hands, no text or extra logos generated, keep the engraving sharp and correctly spelled. Use the highest-quality model, 1080p minimum. Make 2 variants per shot, then upscale the best of each to 4K and give me all 6 links.
```
