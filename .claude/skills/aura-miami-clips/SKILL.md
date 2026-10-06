---
name: aura-miami-clips
description: Search YouTube for known people speaking on entrepreneur mindset, encouragement, becoming an entrepreneur, the higher self, doing what you love, meditation, abundance and manifestation, find the strongest moments, and extract them as clean vertical clips with the speaker clearly framed and captions only. Use for "find motivational clips", "extract clips from speeches", "clip this interview", "mindset / manifestation clips", "this week's clip batch", or any request to source and cut speaker clips for Aura Miami.
---

# Aura Miami Clips

## North star
Find the moment where someone the viewer already respects says the line they need to hear. Hand it over **clean**: the speaker clearly framed, captions only, nothing else added. Aura's team does the posting and packaging.

## Output lock (what every clip is, and isn't)
- **Is:** the original footage, cut to the moment and cropped to 9:16 1080×1920. The crop **follows the speaker's face** shot by shot, and the clip carries **burned-in captions only**: white DM Sans Bold, black outline, 3 words at a time, lower third.
- **Isn't:** no color grade, hook title, credit text, watermark, logo, end card, music, zoom or transition.
- `--frame original` keeps the source framing instead of cropping. `--no-captions` gives the raw cut.
- The branded `render` command exists, but only use it when the user explicitly asks for a branded version.

## Themes
`mindset` · `encouragement` · `becoming-an-entrepreneur` · `higher-self` · `do-what-you-love` · `meditation` · `abundance` · `manifestation`. Speakers and their best-known sources are in `references/speakers.md`; `clips.py themes` lists the seed searches.

## Pipeline
`S=.claude/skills/aura-miami-clips/scripts` · `Y=.claude/skills/youtube-watch/scripts` · outputs go to `./aura-clips/`.

0. **Check setup (once per session).** `python3 $Y/yt.py doctor` tests a real 1-second YouTube download and prints the exact fix if anything is missing. If YouTube downloads fail, still do steps 1–3 (search and finding moments work without downloads), then ask the user to upload the source video and run `extract` on the uploaded file path.
1. **Search.** `python3 $S/clips.py hunt --theme do-what-you-love` (add `--query "Jim Carrey commencement speech full"` for a specific speaker). Favor the original full-length upload (an official channel or a full speech or interview) over compilations and re-edits.
2. **Find the moment.** Use either:
   - `python3 $S/clips.py scan URL1 URL2 --theme do-what-you-love`, which ranks 15–45s windows from captions in seconds per video and writes `aura-clips/moments.md`; or
   - `python3 $Y/yt.py ask URL "Find the strongest 20–40s standalone moment about <theme>. Exact mm:ss start/end + verbatim transcript."`, where Gemini watches the whole video (needs `GEMINI_API_KEY`).

   Treat timestamps from either as approximate. Confirm the exact in and out points against the transcript (`yt.py watch` on the region, or the clip's `--preview`).
3. **Judge it** against the selection bar below. A moment ships only if it passes every point.
4. **Extract.** `python3 $S/clips.py extract URL --start 11:17 --end 12:01 --preview`. It downloads only that section, transcribes the clip for exact caption timing (Whisper → Gemini → YouTube captions), tracks the speaker's face per shot, crops to 9:16 and burns in captions.
5. **Check before calling it done.** Open `<name>.preview.jpg` and confirm:
   - the face is centered in every frame
   - the captions read clearly and don't cover the mouth
   - the first and last words aren't cut off

   If a word is clipped, widen the start or end by 0.3–0.5s and re-extract.
6. **Hand over.** For each clip, give the file, the source URL with mm:ss range, the speaker, the verbatim quote, and one line on why it will be saved or shared.

## Selection bar
1. **Stands alone.** It makes complete sense with zero context.
2. **Hooks in two seconds.** The first spoken line creates tension.
3. **One idea.** 15–45s, and it ends on the landing line rather than trailing off.
4. **Is quotable.** It has a line someone would screenshot or send to a friend.
5. **Is clean.** The source has clear audio and no one else's captions, titles, logos or music burned in (otherwise find a cleaner upload of the same moment).
6. **Shows the speaker.** The speaker's face is on screen for most of the clip, which is what the crop and the share both need.

Rejects: sponsor reads, the speaker's own calls to action, politics, mocking any group, and moments that need a setup over 10s long.

## Requirements
- `ffmpeg` with libass
- `pip install "yt-dlp[default]" "opencv-python-headless<5"` (OpenCV 5 removed the face detector this uses; without OpenCV the crop falls back to center)
- Optional: `faster-whisper`
- Optional: `GEMINI_API_KEY`, for `yt.py ask` and caption fallback

YouTube blocks most cloud servers ("Sign in to confirm you're not a bot"). In a browser (cloud) session, set the environment variable `YT_COOKIES` on one line: `b64:<base64 of cookies.txt>` (the YouTube Cookie Converter page produces this), a `\t`/`\n`-escaped cookies.txt, or a `Cookie:` header value. yt.py passes it to yt-dlp automatically. If downloads still fail, ask the user to upload the video file (a full video is fine) and run `extract` on the uploaded path.

## Rights and risk
These are other people's footage and likenesses, posted by a brand:
- Credit the speaker in every post caption.
- Never pair a speaker clip with the product or "shop" language, since that implies endorsement.
- Keep clips under 60s.
- Prefer sources that allow clipping.
- Remove anything that gets a claim.

This lowers the risk but doesn't eliminate it. Say so when asked.
