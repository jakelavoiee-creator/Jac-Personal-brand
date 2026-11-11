# The Jac Reel Signature

Every reel uses this exact system. Only the script and the b-roll change.
Status per element: **OPEN** (waiting on Jac's references or files) → **PROPOSED** (Claude's starting value) → **LOCKED** (approved, never changes without Jac saying so).

| Element | Status | Spec |
|---|---|---|
| Caption font + aesthetic | **OPEN** (Jac sends reference videos) | One font family, one look. Proposed until then: Editorial Mix, with sentences in Inter Medium and the hero word in Instrument Serif Italic in the accent color, 2 lines max, 62–68% down the frame. |
| Hero word treatment | PROPOSED | 1 hero word per phrase, 1.4x size, soft glow (light = soul), 220 ms fade-up with caption_tick. |
| Intro (0–1.4 s) | PROPOSED | First frame is the face, mid-sentence. A punch-in on the hook word plus a light flare across the frame, on an impact hit. A small top line: series title. |
| A-roll → b-roll | PROPOSED | **"Soul eject":** a white-gold bloom swells from the face and fades into the b-roll on a whoosh_long. Used on every switch to b-roll. |
| B-roll → a-roll | PROPOSED | The light collapses back to a point and Jac's face returns, on a soft_pop. |
| B-roll → b-roll | PROPOSED | Hard cut on the beat, with whoosh_short. |
| Felt line | PROPOSED | A breath of silence (0.8 s), then the strongest b-roll on the music drop, with magic_shimmer. |
| Outro / loop | PROPOSED | The last line becomes a hero card in accent red, then light pulls in to a point, then cut to frame 1. |
| Grade | PROPOSED | Warm skin, deep indigo shadows, grain 8%, light bloom on highlights. B-roll gets the same grade. |
| SFX palette | **OPEN** (Jac sends his files) | One sound per event, always the same file: hook hit, hero pop, soul-eject whoosh, return pop, b-roll cut, riser, felt-line shimmer, outro. Drop the files in `assets/sfx/` and Claude maps them here. |
| Music | Per reel | A cinematic build (Interstellar-style). The edit is cut to its beats when the track is supplied. |
| Spike rule | LOCKED | Something changes at least every 2.0 s. |

## SFX map (fill when Jac's files arrive)
| Event | File |
|---|---|
| Hook hit | |
| Hero word pop | |
| A-roll → b-roll (soul eject) | |
| B-roll → a-roll (return) | |
| B-roll cut | |
| Build / riser | |
| Felt line | |
| Outro | |
