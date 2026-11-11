# The Jac Reel Signature

Every reel uses this exact system. Only the script and the b-roll change.
Status per element: **OPEN** (waiting on Jac's references or files) → **PROPOSED** (Claude's starting value) → **LOCKED** (approved, never changes without Jac saying so).

| Element | Status | Spec |
|---|---|---|
| Caption type system | PROPOSED (from Jac's "Cinematic fonts" reference) | One locked pairing, never anything else: **Inter Black** (heavy sans, tight tracking -2%) for the main words + **Instrument Serif Italic** for the hero word. Both are in `assets/fonts/`. Words blur-in one by one and land scattered, staggered, at different sizes, so every new line is its own spike. They stay out of the bottom 20% and right 12% and never cover the eyes. |
| Hero word treatment | PROPOSED | 1 hero word per phrase in Instrument Serif Italic, 1.6–2x size, soft white glow (light = soul). On the felt line it sits **behind Jac's head** (text behind subject, now possible with the cutout). |
| Intro (0–1.4 s) | PROPOSED | First frame is the face, mid-sentence. A punch-in on the hook word plus a light flare across the frame, on an impact hit. A small top line: series title. |
| A-roll → b-roll | PROPOSED | **"Soul eject":** Jac's body turns into a pure white glowing silhouette (from the ref reel's opener), the light blooms to fill the frame, and it opens into the cosmic b-roll on a whoosh_long. |
| B-roll → a-roll | PROPOSED | Reverse: the light gathers into Jac's white silhouette, which fades back to his real body, on a soft_pop. |
| B-roll → b-roll | PROPOSED | Hard cut on the beat, with whoosh_short. One gold film-burn (light leak) per video, max, on a topic change. |
| Felt line | PROPOSED | A breath of silence (0.8 s), then the strongest b-roll on the music drop, with magic_shimmer. |
| Outro / loop | PROPOSED | The last line becomes a hero card in accent red, then light pulls in to a point, then cut to frame 1. |
| Background | PROPOSED (cutout tested and working) | Jac films raw; his background is cut out and replaced with one fixed cozy, warm, dim room (same room every reel). **Twist that's only Jac's:** the room has a big window that looks out onto deep space and stars, so the soul's universe is always right behind him. Slight parallax. Feature beat (optional, 1 per reel): Jac on a cream background as a black silhouette with text wrapped around him, or a dashed outline around his cutout. |
| Grade | PROPOSED | Warm skin, deep indigo shadows, grain 8%, light bloom on highlights. B-roll gets the same grade. |
| SFX palette | **LOCKED** (Jac's files) | One sound per event, always the same file. See the SFX map below. |
| Music | Per reel | A cinematic build (Interstellar-style). The edit is cut to its beats when the track is supplied. |
| Spike rule | LOCKED | Something changes at least every 2.0 s. |

## SFX map: LOCKED set (Jac's files, `assets/sfx/jac/`)
Same file for the same event in every reel. Levels get normalized; each sound sits 6–10 dB under the voice.
| Event | File | Why it fits |
|---|---|---|
| Hook hit (frame 1) | Camera Flash.wav | Punchy, peaks at 0.30 s. Paired with a white flash on the first word. |
| Hero word pop | FOCUS.MP3 | 0.24 s, bright and tight. Lands exactly on the word. |
| Caption line appears (light) | Click.wav | Tiny, so it can repeat without getting tiring. |
| Soul eject build (body turns to light) | Jolt Build Up.wav | Rises for 1.3 s into the bloom. |
| Soul eject peak (light opens into the universe) | Whoosh.wav | Big, peaks at 0.9 s. Trimmed to about 1.2 s. |
| Return to Jac | Camera Charge.mp4 | A short charge as the light gathers back into the body. |
| B-roll → b-roll cut | Click.wav (louder) | Clean, so the music carries the build. |
| Build into the felt line | Riser.wav | Peaks at 1.7 s, then drops to near silence. That drop is the breath before the felt line. |
| Felt line | Charge.MP3 | A bright, sparkling 3 s tail under the strongest image. |
| Outro / loop | Jolt Build Up.wav → cut to frame 1 | Rises into the loop point, so the replay hits like a new start. |
| Reserve | Glitch.wav | Off-brand for the soul world. Only for a deliberate "the system" moment, at most once. |

## In-camera moves (Jac does these while filming; zero editing cost)
- **Hand over the lens:** end a take by covering the lens and start the next by pulling your hand away. This creates a blackout cut.
- **Whip pan:** snap the phone sideways at the end of a take and again at the start of the next.
Use at most one per reel, on a topic change.

## Reference breakdown (2026-11-11)
- **"How Claude edits my videos" creator:** fake cozy room behind him on every shot. Words blur in, scattered across the frame. Text behind his head. A white glowing silhouette and a cream-and-silhouette card used as transitions. Text curved around his body. A dashed cutout outline. SFX on nearly every word. **Take:** the room swap, blur-in scattered words, text behind the head and the white silhouette. **Leave:** switching fonts and the face-tracking boxes (too techy for the soul world).
- **Top 5 transitions:** film burn, mask glitch, camera flash, blackout (hand over the lens), whip pan. **Take:** film burn (recolored to gold light), blackout and whip pan as in-camera moves. **Leave:** glitch (it's digital, the opposite of the soul feel).
- **Font ref ("Cinematic fonts"):** a heavy sans with a light italic serif, which becomes the type system above.
