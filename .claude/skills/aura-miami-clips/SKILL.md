---
name: aura-miami-clips
description: Hunt YouTube for known people speaking on entrepreneur mindset, encouragement, becoming an entrepreneur, the higher self, doing what you love, meditation, abundance and manifestation, then extract the strongest moments and render them as black-and-white, branded Aura Miami reels built for saves, shares and profile visits. Use for "find motivational clips", "make Aura Miami reels from speeches", "clip this interview for the page", "mindset content", "manifestation clips", "this week's clip batch", or any request to source and cut speaker clips for Aura Miami.
---

# Aura Miami Clips

## North star
A single line from someone the viewer already respects, framed in Aura's black-and-white world, so the viewer **saves it, sends it, and taps the profile**. The clip earns attention. The profile ("Too creative for nine to five. Keep dreaming." · CAPSULE 01) does the converting. **The clip never sells.**

## Brand lock (non-negotiable)
- **Palette:** black and white only. Pure white `#FFFFFF`, soft grey `#D2D2D2`, ink `#0A0A0A`. No gold, no color accents.
- **Grade:** AURA MONO (true B&W, deep blacks, +28% contrast, soft vignette). `--color` gives muted color, only for footage that dies in mono.
- **Type:** Bebas Neue for hooks · DM Sans Bold for captions · Cormorant Garamond Italic for the credit and tagline · AURA wordmark (Archivo Black, or the real logo via `--logo`).
- **Voice:** minimal, confident, no emojis, short sentences.
- **Handle / tagline:** `@aura.miamii` · "Keep dreaming."

Any style reference the user shares (see "Reference lock" below) can refine these settings, but never brings back color.

## Themes
`mindset` · `encouragement` · `becoming-an-entrepreneur` · `higher-self` · `do-what-you-love` · `meditation` · `abundance` · `manifestation`. Seed speakers are in `references/speakers.md`; `clips.py themes` lists the searches.

## Pipeline
Scripts: `S=.claude/skills/aura-miami-clips/scripts` and `Y=.claude/skills/youtube-watch/scripts`. Outputs go to `./aura-clips/`.

1. **Hunt sources.** `python3 $S/clips.py hunt --theme manifestation higher-self` (add `--query "Jim Carrey 60 Minutes interview"` for a specific speaker). It ranks original long-form sources (interviews, speeches, podcasts) and penalizes compilations. Open the top results and keep the 4–8 most promising.
2. **Scan for moments.** `python3 $S/clips.py scan URL1 URL2 ... --theme manifestation`. This reads captions only, so it takes seconds per video. It writes `aura-clips/moments.md` with ranked 15–45s windows, the text, and a ready-made render command. For a video with no captions, run `python3 $Y/yt.py watch URL` and scan its `transcript.json`.
3. **Judge every pick like an editor.** The score is only a pre-filter. Keep a moment only if it passes the bar below. For anything borderline, check it visually with `yt.py watch` or `yt.py frame` (speaker on screen? clean frame? no burned-in text?).
4. **Render.** `python3 $S/clips.py render URL --start 754.2 --end 786.0 --hook "YOU ARE NOT LATE" --credit "Denzel Washington" --preview`. It downloads only that section, transcribes the clip for exact caption timing, applies the grade and layout (16:9 sources sit framed on black; vertical sources fill the screen), burns in captions, and adds the hook, credit, watermark and a 1.6s end card. **Open the `.preview.jpg` and check it** before calling the reel done.
5. **Package.** Deliver each reel in the post format below.

## The selection bar: a moment ships only if it does all of these
1. **Stands alone.** It makes complete sense with zero context: no "as I said", no unresolved "he" or "that".
2. **Hooks in two seconds.** The first spoken line creates tension ("Most people…", "Nobody tells you…", "The day you…").
3. **One idea.** 15–45s, and it ends on the landing line rather than trailing off.
4. **Is quotable.** It contains at least one line someone would screenshot or send to a friend.
5. **Is clean.** Clear audio, no source music bed if avoidable, no one else's captions, logos or titles burned in, no CTA of their own.
6. **The speaker is recognisable** (face or voice), which is what earns the share.

Rejects: rants, politics, religion-specific preaching, anything mocking a group, sponsor reads, and clips where the best line needs a setup over 10s long.

## Hook text (on-screen title)
- **Length and format:** 3–7 words, uppercase in Bebas Neue, shown for the full clip.
- **Purpose:** state the tension, not the answer. "YOU'RE NOT BEHIND." / "THE JOB WAS NEVER SAFE." / "STOP ASKING FOR PERMISSION." / "IT ALREADY HAPPENED."
- **Accuracy:** never put words in the speaker's mouth. The hook is Aura's framing, and the quote is theirs.

## Post package (deliver per reel)
```
REEL [n]: [theme] · [speaker]
FILE: aura-clips/renders/<name>.mp4  (+ preview)
SOURCE: <url> @ mm:ss–mm:ss
WHY IT HITS: <one line: the landing line and who will send it to whom>

CAPTION:
<hook line, max 8 words, no emoji>

<1–2 lines in Aura voice that extend the idea, never summarize it>

<CTA, rotate: "Save this for the days you doubt it." / "Send this to someone building in silence." / "Follow for your daily reminder.">

Words: <Speaker Name>
#AuraMiami #KeepDreaming + 5–7 from the theme set

PINNED COMMENT: <a question that invites a story: "What are you building right now?">
STORY: repost with a poll ("Needed this / Saving it")
```

## Funnel rhythm (attention → page → customer)
- **Clips earn reach:** 2–3 per day. Optimize for saves and DM shares, not likes.
- **Profile pinning:** keep the top 3 pinned posts as one brand piece, one CAPSULE 01 piece and one best clip, so every profile visit sees the product.
- **Content mix:** every 4th post is Aura's own content (product in the same B&W world, or founder voice). Speaker clips never feature the product.
- **Retargeting:** people who save or share get retargeted by Stories (product + "Keep dreaming.").
- **Feedback loop:** feed weekly saves, shares and profile visits by theme into `aura-miami-analytics`, and double down on the winning themes and speakers.

## Rights and risk (read before posting)
Clips of known people are copyrighted footage of real people, posted by a brand. To keep the page safe:
- **Credit:** always name the speaker on screen (`--credit`) and in the caption.
- **No implied endorsement:** never put the product, a discount or "shop" language on or next to a speaker clip, and never suggest the speaker wears or backs Aura. Right-of-publicity claims come from exactly that.
- **Keep it short and transformative:** under 60s, with Aura framing (hook, grade, captions), not a re-upload.
- **Prefer safer sources:** speeches and interviews whose owners allow clipping (many podcasts run clipping programs), Creative Commons uploads, or licensed speech packs. When a claim or takedown arrives, remove the clip and don't dispute it.
- **Be honest with the user:** this lowers the risk but doesn't eliminate it. A rights holder can still claim. Say so when asked.

## Reference lock
If the user shares a reference reel from another brand, run `yt.py watch` on it and record the following in `references/style-reference.md`:
- hook placement and size
- caption size, position and words per line
- cut pacing
- music bed or none
- clip length
- end card style

Then map each spec onto `clips.py render` flags or ASS style values, keeping Aura's black-and-white palette. Lock what's approved; change one variable per iteration.
