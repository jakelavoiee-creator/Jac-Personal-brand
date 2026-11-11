---
name: image-to-motion-broll
description: Turn a still image (Pinterest-style, own or generated) into an animated 9:16 b-roll clip with an elegant, luxury, emotional feel. Use when a video needs cinematic b-roll from images.
---

# Image to Motion B-roll

Goal: a still image becomes a living, heartfelt shot that carries the feeling of what Jacob is saying (the soul, light, release, unity), in a consistent warm cinematic look.

## Inputs
Images in `input/images/`, plus `script_<slug>.json` or a line per image stating the emotion. Log each image's source in `broll_manifest.json`. Prefer images Jacob owns, has licensed, or generated. For saved Pinterest images, note the creator and ask whether permission or credit is needed before posting.

## Pick the motion by emotion
| Emotion | Recipe | Extras |
|---|---|---|
| Awe, expansion | push, 1.2 to 1.6 s | glow 0.5, particles 30 |
| Longing, distance | drift | leak 0.3, glow 0.3 |
| Awakening, light | push | glow 0.6 with slow pulse, rising particles 50 |
| Release, grief | pull | desat 0.6 then return to color on the felt line |
| Unity, belonging | still or slow push | many small particles 60, leak 0.2 |
| Stillness, soul | still | glow 0.4, grain, almost no camera move |

## Make the clip
Primary tool: `python3 scripts/broll_motion.py IMAGE OUT.mp4 --dur 1.4 --recipe push --glow 0.5 --particles 40 --leak 0.3 [--desat 0.6] [--depth depth.png] [--focus-y 0.4]`
It renders 1080x1920 at 30 fps with camera move, bloom that breathes at about 0.35 Hz, floating dust, warm light leak, warm tint, vignette and grain. About 30 s of compute per 1.4 s clip.
- 2.5D parallax: if torch is installable, make a depth map (Depth Anything V2 small) and pass `--depth`. Otherwise skip it.
- Natural motion (hair, water, clouds, fabric): if an image-to-video tool is connected (Higgsfield, Kling, Runway), generate 3 to 5 s with a prompt of subject + one small specific motion + slow camera move + light + "cinematic, elegant, soft film grain", then trim to the clip length and run the finishing pass (`--recipe still`) so every clip shares one look.
- Fallback with only ffmpeg: `zoompan=z='min(1+0.0009*on,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=42:s=1080x1920:fps=30`, after upscaling the source to 4320 px wide to avoid jitter.
- Low-resolution images: upscale first (Real-ESRGAN if available, else Lanczos).
- Framing: subject on a third, headroom 15%, faces never in the bottom 20% or right 12%.

## Pace and arc
- Fast clips 0.8 to 1.6 s while building, 2.0 to 2.4 s on the felt line. Never hold anything unchanged longer than 2.0 s.
- Arc: tension, then opening, then release. Put the strongest image on the felt line.
- One look across all clips (grade, grain, accent). Order for contrast, not similarity.
- Emphasis Swap: while b-roll leads, keep color and keep captions minimal.

## Sound pairing (see `reel-sound-and-transitions`, `music-arc-sync`)
Build: tape_hiss_bed or room tone under, sub_drop at the first b-roll cut, riser across the sequence ending 1 frame before the felt line. Release: magic_shimmer plus soft_pop on the felt-line image. whoosh_short on fast cuts only. Cut on the hit.

## Output
`broll/clip_01.mp4 ...` and `broll_manifest.json` (image, source, recipe, duration, emotion, SFX cue), then hand to `reel-director` as the b-roll layer.
