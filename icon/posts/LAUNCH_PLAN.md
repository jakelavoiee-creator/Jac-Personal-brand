# Giorgi launch: meme-hook format (until credits reset Oct 19)

## The format
**[viral meme clip that sets up a line or a challenge] → hard cut → [Giorgi answers it with his video]**

The hook is a recognizable clip of a real person, usually 2–5s, keeping its original audio and burned-in captions. It ends on a line, a dare or a look. Giorgi's first frame is the "answer". The joke is the contrast: they say X, then Giorgi does the opposite with full confidence.

Reference hook: `../hooks/lower_your_tone.mp4` (5.3s). A woman holds up a tape measure: "If this is you… you better lower your mother*** tone when you're talking to me."

## Ready-to-post cuts (in this folder)
| File | Hook | Giorgi answer | Length | Verdict |
|---|---|---|---|---|
| `giorgi_B_lower_your_tone_x_face_in_lens.mp4` | lower_your_tone (0–5.3s) | Giorgi lunges face-first into the lens, then dances | 17.0s | **Post first.** The face-in-lens beat reads as a direct reaction to her. |
| `giorgi_A_lower_your_tone_x_3am_dance.mp4` | lower_your_tone (0–5.3s) | Giorgi does the big arm-swinging dance | 18.0s | Backup, or use it on TikTok. |

Don't post both on Instagram (same hook twice). Post B on IG, and A on TikTok.

**Caption (IG):**
```
she said lower your tone. Dumpling, bro. 🥟

I made this with @higgsfield.ai genjutsu #higgsfieldpartner #higgsfield
```

## Make a new one in one command
```bash
icon/tools/hook_splice.sh HOOK.mp4 GIORGI.mp4 icon/posts/OUT.mp4 [start_s] [end_s]
# example: trim a hook to 0.4s–2.6s
icon/tools/hook_splice.sh icon/hooks/chat_is_this_real.mp4 giorgi_dance.mp4 icon/posts/giorgi_C.mp4 0.4 2.6
```
The tool auto-fits any clip to 1080×1920 at 30fps, matches the audio, and outputs an IG-ready MP4. Drop hook clips in `icon/hooks/`.

## Hook clips to source (save from TikTok/IG to `icon/hooks/`)
Pick clips that **end on a setup Giorgi can answer**. Ranked by how well they fit his dance videos:

| Type | What the hook does | Example to search for | Giorgi's answer |
|---|---|---|---|
| **Challenge / threat** | Someone tells the viewer to calm down, back off, or behave | "lower your tone" (have it), "say that again", "don't try me" | He does the most, immediately |
| **"Is this real?" reaction** | A streamer squints at the screen in disbelief | iShowSpeed "chat is this real?" | Giorgi dancing, which "is" the thing they can't believe |
| **Disgust / shock face** | 1–2s of someone staring at the camera, horrified | "shocked face reaction meme", "side eye meme" | Cut to Giorgi mid-move |
| **"You won't do it" dare** | A friend daring or betting someone | "bet you won't", "do it, you won't" | He does it |
| **Interview question** | A street interviewer asks a question | "what's your biggest flex", "describe your rizz in one move" | His dance is the answer |
| **Hype-man / announcement** | A sports commentator or news anchor builds it up | "ladies and gentlemen", "breaking news meme" | Giorgi walks in like the main event |
| **Beat-drop wait** | Someone saying "wait for it" or counting down | "wait for the drop", "3, 2, 1" | Giorgi hits the move on the drop |

**Hook rules**
- Keep the hook **≤ 30% of the total runtime** so Giorgi stays the main subject (campaign rule). Keep it 2–3s whenever the line allows.
- Cut on the **last word or the reaction beat**, never mid-sentence.
- Keep the hook's own audio. Giorgi's audio takes over at the cut, and that audio switch is part of the hook.
- **Use a different hook on every IG post.** Reuse the best one on TikTok.
- Risk: these clips belong to other creators. Instagram can down-rank reused content or remove it on a complaint. Prefer clips that are already widely used as memes, and keep them short.

## Posting order (ET)
1. **Thu Oct 9, 7pm:** `giorgi_B` (IG) + `giorgi_A` (TikTok)
2. **Sat Oct 11 and Mon Oct 13:** the next 2 Giorgi videos, each with a NEW hook clip from the table above (run the tool)
3. **Oct 14–18:** Stories plus replying to comments in character
4. **Oct 19 (credits reset):** scale whichever hook type got the most shares and saves

On every post: Reels only, highest-quality upload ON, likes and views visible, and paste the link into the Launchpoint dashboard the same day.
