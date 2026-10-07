---
name: awakening-carousels
description: Build dark, minimal, hybrid-athlete Instagram carousels for the personal brand's soul-awakening timeline (ages 18–24). Pulls aesthetic images from a Pinterest board or local photos into a tagged library, matches an image to the meaning of each slide, grades every image into one house look, and renders 1080x1350 slides with small, light type. Use for "make a carousel", "build the age 19 post", "pull my Pinterest board", "add these photos", "preview my grid", "awakening carousel", or any personal-brand (not Aura Miami) carousel work.
---

# Awakening Carousels

## North star
**Dark athletic awakening.** A hybrid athlete's body in the dark and a soul waking up inside it. The grid should read like one film: near-black, cold steel, film grain and quiet light. The words whisper.

Personal brand only. Aura Miami has its own skills.

## Locked (do not change without the user saying so)
- **Canvas:** 1080×1350 (4:5), 96px side gutter. Keep type inside the IG grid's 3:4 center crop.
- **Grade:** every image goes through the same `grade()`: near-monochrome, crushed shadows, a cold-steel tint, vignette and grain. This is what makes mixed sources read as one grid. Never post an ungraded image.
- **Type:** Inter Display Light, lowercase, bone white `#ECE9E3`. Cover 60px centered; inside slides 44px left-aligned in the lower third. Meta is Inter 20px tracked caps at ~55% opacity (`AGE 18` / `THE CRACK` on the cover, `18 · THE CRACK   02/07` on inner slides).
- **Words:** each slide carries at most 2–3 short lines and about 18 words. One idea per slide. 6–8 slides per carousel.

## The story spine (ages 18–24)
`references/story-map.md` holds one chapter per age, with its meaning, image vocabulary and accent darkness. Every carousel belongs to exactly one age. Read it before writing a spec.

## Pipeline
`C=.claude/skills/awakening-carousels/scripts/carousel.py` (run from the repo root; needs Pillow).

1. **Fill the library.** Use any of these:
   - `python3 $C search "winter arc aesthetic" "dark aesthetic" -n 40 --pull`: Pinterest keyword search (the site's own search endpoint, no login). Pins are saved to `library/candidates.jsonl`, and `--pull` (or a later `pull --candidates`) downloads them. Searching needs `www.pinterest.com` and downloading needs `i.pinimg.com`. Skip pins that are brand product shots or show identifiable people (creators, models): they aren't ours to post.
   - `python3 $C pull https://www.pinterest.com/<user>/<board>/`: reads the public board's RSS feed and downloads each pin at full size. This needs pinterest.com and i.pinimg.com to be reachable. The default cloud network policy blocks them, so run it locally or allow those domains.
   - `python3 $C add path/to/folder`: local photos (the user's own training shots, or images saved from Pinterest by hand).
2. **Tag by meaning, not by object.** Run `python3 $C untagged`, then **look at each image** (Read it) and tag it:
   `python3 $C tag <file> "empty gym, alone, discipline, isolation, start" --mood "cold, still"`
   Tags are what the image *means* in the awakening story (isolation, escape, surrender, identity, grit, light-breaking-through), plus the literal scene.
3. **Write the spec** in `brand/awakening-carousels/specs/age-NN-<slug>.json` (see the example `age-18-the-crack.json`). Each slide has `text`, plus an `image` that is a meaning query ("night run escape restless") or `"@<file>"` to pin a specific image. Optional per-slide fields are `position` (top/center/bottom/none), `size`, `align` and `darkness`. A spec can also set `caption` and `handle`.
4. **Render.** `python3 $C render brand/awakening-carousels/specs/age-18-the-crack.json` writes `out/<id>/01..NN.png`, `strip.jpg`, `plan.json` (which image went where) and `caption.txt`.
5. **Review like a director.** Open `strip.jpg`, then each slide, and check:
   - each image carries its slide's meaning
   - no two neighbouring slides look alike
   - type is legible everywhere (if not, set `position` or raise `darkness` for that slide)
   - nothing reads as cluttered

   Fix it, re-render, then hand over the strip.
6. **Grid check.** `python3 $C grid` writes `out/grid.jpg`, the last 9 covers as the profile shows them. Covers should alternate between bright and dark frames and between close and wide shots.

## Image sourcing rules
- **Ranking:** the user's own photos (real, his, meaningful) come first, then AI-generated images in the house style (Higgsfield `generate_image`, owned and consistent), then Pinterest. Pinterest images belong to their photographers. Use them for mood and reference, and credit or avoid them on posts the brand earns from.
- **Image vocabulary:** empty gyms with one light, a night run under street lamps, chalk and iron close-ups, a silhouette against a window, fog trails, dawn water, sweat and breath in cold air, a locker-room mirror, a track at night, a lone figure in a wide frame. These are hybrid athlete scenes with a soul subtext.
- **Prompt template for generated images:** `"cinematic 35mm film still, [scene], lone hybrid athlete, low-key lighting, deep shadows, monochrome, fine grain, negative space for text in lower third, 4:5"`.
