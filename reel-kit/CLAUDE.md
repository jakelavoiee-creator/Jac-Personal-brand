# Reel Kit: raw talking video in, ready-to-post reel out

Owner: Jacob Lavoie. Product idea: an AI editor for Instagram and TikTok creators (built with Fab). This folder is the first test: Claude Code does the editing with ffmpeg until Fab's engine exists.

## How to run
1. Put the raw video in `input/`.
2. Say: "Use awakening-reel-recipe with reel-director on the video in input/. Accent #9B2226, publish-attached audio, assets in ./assets." Add a caption style if wanted (default: Editorial Mix).
3. Claude Code writes to `output/`: reel_v1.mp4, plan.json, captions.ass, change log.
4. Give feedback as: what works, one specific change, what stays locked.

## Skills (in .claude/skills/)
- reel-director: the pipeline (probe, transcript, plan, render, QA, deliver).
- reel-type-and-layout: captions, hero/support type, safe zones, b-roll Emphasis Swap, text screens. Includes taste-library.md (approved fonts and caption styles).
- reel-sound-and-transitions: SFX mapping, hard cut on the hit, transition governor, loudness, audio modes.
- awakening-reel-recipe: Jacob's 15 to 30 s awakening series, with a retention spike at least every 2.0 s.
- awakening-script-writer: scripts in Jacob's voice to attract awakened souls (needs voice/voice.md; it will ask for samples).
- image-to-motion-broll: still image to animated 9:16 b-roll (scripts/broll_motion.py, tested).
- music-arc-sync: analyze a supplied music track, find its build and drop, align the edit.

## Assets
- assets/fonts: 15 open-license (OFL) font families from Google Fonts. Licenses included.
- assets/sfx: synthetic placeholder sounds so the test runs. Replace with real sounds by keeping the filenames (see ASSETS.md).
- assets/overlays: flash_white.mp4. Add film_burn.mp4 when available.
- assets/music: put cinematic tracks here (your own files only; nothing is downloaded from Spotify).
- assets/luts: empty. Add a warm cinematic .cube file when available.

## Ground rules
- All numbers in the skills are proposed starting values. Tune them on the clip.
- No licensed audio is included or downloaded. Default audio mode is publish-attached.
- Not possible yet (flag in the change log, use the fallback): text behind subject, relight/background swap, 3D plane text, face/hand HUD.
- Open decisions: icon glyphs/emoji inside cards (none for now); emphasis-word detection stays an internal engine.
- Critique format: what works, one specific change, what stays locked.

## Tested
Instrument Serif Italic renders through ffmpeg/libass using `subtitles=captions.ass:fontsdir=assets/fonts/<family>`. libass prints "Error opening memory font 'OFL.txt'" because the license file sits in the font folder. It is harmless. Point fontsdir at one family at a time, or copy the .ttf files to a temp folder first.

## Full flow for a new video
1. awakening-script-writer: script + b-roll brief. 2. Shoot the talking part, add images to input/images/. 3. image-to-motion-broll: clips. 4. music-arc-sync: pick and align the track. 5. reel-director with awakening-reel-recipe: final edit.
