---
name: awakening-script-writer
description: Write Jacob's 15-30 s awakening scripts in his own voice to attract awakened souls on Instagram, with talk and b-roll beats. Use whenever he asks for a script, hook or idea for his series.
---

# Awakening Script Writer

## Mission (north star)
Attract awakened souls. Every video should make a viewer feel something they have not felt before, like a movie you have to feel and not just hear about, so that the right people recognise "that's me" and find each other. The page grows through heartfelt, specific, shared recognition, not through outrage or teaching.

## Step 0: capture the voice (never invent it)
1. Read `voice/voice.md`. If it is missing or thin, ask Jacob for 5 or more past scripts, captions or raw-video transcripts (or transcribe videos in `input/` with faster-whisper).
2. Write `voice/voice.md`: sentence length, openers, words he uses and avoids, how he addresses the viewer, rhythm and pauses, humor, 10 signature phrases, and a confidence note.
3. Known hints from earlier chats (confirm before relying on them): the "Day X of finding awakened minds" opener; he never teaches, he mentions and connects the dots; he wants specific examples (parents who can't relate, food and health norms, media and asking for sources). His current direction is heartfelt, relatable realisations about the soul and awakening. Ask which is current if unclear.
4. Update `voice/voice.md` and `voice/hooks.md` when he gives feedback or shares what performed.

## Script format (15 to 30 s, about 38 to 75 spoken words)
Mark each beat as `[TALK]` (on camera) or `[BROLL: emotion, image idea]` (voiceover over images).
1. **Hook (0 to 1.0 s, 8 words or fewer):** a line that makes the right person stop.
2. **Recognition (talk):** a concrete moment the awakened viewer has lived. One specific example, no vague claims.
3. **The realisation:** one idea, in his words.
4. **The felt line (b-roll carries it):** the sentence that transfers the feeling. Slow the words, leave a breath before it.
5. **Invitation:** a soft pull to find each other (one-word comment, "if you felt this"), in his voice. No begging.
6. **Loop ending:** last line echoes the hook so replays feel seamless.
Structure: he talks first (about 5 to 8 s), then fast-paced b-roll over his voice, with a spike at least every 2.0 s (see `awakening-reel-recipe`).

## Output
- `script_<slug>.md`: 3 hook options, the chosen script with timestamps and beat tags, word count, estimated runtime.
- `script_<slug>.json`: phrases with start estimates, hero word per phrase, b-roll image brief (subject, emotion, motion recipe), SFX or music cue, ready for `reel-director` and `image-to-motion-broll`.

## Honesty and safety rails
- Write from first-person experience and feeling ("I noticed", "it hit me"), or as an honest question. Do not state contested claims about the world as proven fact. No medical, financial or outcome promises. No fear-mongering and no shaming people who are asleep: the pull is toward recognition, not against anyone.
- Replace generic spiritual phrases with a concrete moment or image. If a line could appear on any quote page, rewrite it.

## QA before handing over
Could only Jacob say this? One specific example? Hook 8 words or fewer? Felt line has room to breathe? Word count fits 15 to 30 s? Ending loops?
