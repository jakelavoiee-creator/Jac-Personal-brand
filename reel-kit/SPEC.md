# Background spec (condensed)

Full version: the "AI Editor V2: Feature Spec for Fab" doc (export it to Markdown and replace this file if you want every detail).

## Product
AI editor for Instagram and TikTok creators. Raw footage in, ready-to-post reel out. AI edits, humans can edit every layer. Taste-level output: cinematic type, sound design, color, intros and outros. Say-It-Do-It: every effect matches a spoken word.

## Principles from the references
- Say-It-Do-It: effect lands within 50 ms of its word.
- Safe zone: nothing in the bottom 20% or right 12%.
- Hero/support type hierarchy, one hero per line.
- Emphasis Swap: B&W b-roll under a hero caption, color b-roll when the b-roll leads.
- Key-point text screens (white, black, brand color) as reset beats.
- Transition governor: script transitions only, at most 1 overlay per 8 s.
- Default sound per element type; hard cut on the hit.
- Two audio modes: publish-attached (default) and personal.
- Loudness about -17 LUFS.
- Layer order for text behind subject: background < text < subject matte.

## Hardest builds (need Fab's engine)
Relight and background restyle, plane tracking on handheld footage, text behind subject matting, 3D bake.
