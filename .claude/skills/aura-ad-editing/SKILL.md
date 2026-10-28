---
name: aura-ad-editing
description: Edit raw founder or UGC footage into finished Aura Miami ads for Meta Reels/Feed and TikTok, using the scripts/ad-edit/aedit.py pipeline (silence removal and jump cuts with punch-in zooms, word-by-word captions, music ducked under voice, SFX, -14 LUFS, multi-hook variants, 9:16 and 4:5 exports, safe-zone review). Use for "edit this footage", "cut my video into an ad", "add captions", "make hook variants", "export for Reels", "founder ad", "UGC edit", or whenever video files arrive for Aura ads.
---

# Aura ad editing

## Read first
- **Rules:** `training/ad-editing/EDITING-PLAYBOOK.md`
- **Tool docs:** `scripts/ad-edit/README.md`
- **Example build spec:** `scripts/ad-edit/examples/founder_spec.json`

## Workflow
1. **Ingest:** put raw clips in a work folder. Run `ffprobe` on each and check that audio exists.
2. **Transcript:** `python3 scripts/ad-edit/aedit.py transcribe raw.mp4 -o words.json`.
   - It uses Gemini with word timings and needs `GEMINI_API_KEY`. The quota is shared with the study runners and resets around 07:00 UTC.
   - No offline speech-to-text model is available, so you can also hand-write `words.json` in raw-take time.
3. **Spec:** copy `examples/founder_spec.json` and set:
   - `input`
   - `words`
   - `emphasis` words: product name, offer, identity words
   - `hooks`: 3–5 separate hook clips
   - `music`: licensed only
   - `ratios`: `["9:16","4:5"]`
4. **Build:** `python3 scripts/ad-edit/aedit.py build spec.json`.
   - Steps: cut → captions → mix → hook variants → reframe → safe-zone preview.
   - Finished files are named `<name>_H<n>_<ratio>.mp4`.
5. **QA every export.** Grab frames at several timestamps and look at them. Check:
   - **Captions:** no overlaps and none in the top 14% / bottom 35% / side 6% of 9:16.
   - **Loudness:** about −14 LUFS (`loudnorm print_format=summary`).
   - **Music:** ducks about 11 dB under the voice.
   - **Opening:** no dead air in the first second.
   - **Cuts:** punch-ins alternate.
6. **Deliver:** send the finals and the safe-zone review render to Jac, and name each file so it matches the ad name `Concept-Format-Hook-Date`.

## Edit rules (summary)
- **Structure (20–35s):**
  - Hook, 0–3s: movement in frame 1, plus on-screen text and a sound hit.
  - Story, 3–12s: jump cuts with 12% punch-ins.
  - Proof, 12–25s: B-roll of the back print and fabric, sub-0.5s cuts on routine actions.
  - Offer and CTA: the last 3–5s.
- **Cutting:**
  - Cut pauses longer than 0.35s and keep 0.08s of air around words.
  - Change the angle every 2–3s.
  - J-cut into B-roll; L-cut out of the founder.
- **Captions:**
  - 1–3 words per line, Inter Bold, about 5% of frame height, at 60% of frame height.
  - The active word turns gold and pops to 112%.
  - Emphasis words stay gold.
  - Burn them in always.
- **Sound:**
  - Music bed at −18 dB, sidechain-ducked.
  - A soft whoosh on cuts and a hit on the hook and the offer reveal.
  - Licensed music only: Meta Sound Collection, TikTok Commercial Music Library, or a paid licence.
- **Look:** premium and calm, black and white with one gold accent. Fast pacing in a quiet style, never chaotic.

## Known limits / next builds
- **Not built yet:** `broll` inserts with J/L cuts, split screen, green-screen cutout, and beat-synced cuts. Specs are in EDITING-PLAYBOOK §3 and §9.
- **Captions can lead the voice by 0.3–0.5s** for readability. Test this on real footage.

## Never
- Fake UI, notifications or live counters.
- Fake reviews or press logos.
- Unprovable before/after claims.
- AI people presented as real customers.
- Copyrighted trending audio in paid ads.
