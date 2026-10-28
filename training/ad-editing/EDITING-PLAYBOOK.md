# Aura ad-editing playbook (v0.2, 28 Oct 2026)

**How to read this.** This is the spec for turning Jac's founder footage into ads, with each rule mapped to the toolkit in `scripts/ad-edit/`. Rules are tagged by where they come from:
- **[DD]** Dara Denney video note `notes/R1HQW38EcRA.md`
- **[web]** written sources at the bottom, all secondary (blogs and tools), never Meta itself
- **[A]** the Meta ads playbook `../clothing-brand-ads/PLAYBOOK-DRAFT.md`
- **[mine]** my own default, to be tested

v0.2 adds 12 more tutorial notes (§10). Jac's own example links go to the top of the queue when he sends them.

## 1. North star for every Aura edit
- **Look:** premium and calm, never chaotic. Fast pacing, quiet style: black and white, one gold accent, no rainbow emoji spam. [mine]
- **Job:** stop the scroll in 1.5–3 s, keep people watching with movement every 2–3 s, and be fully understandable with the sound off. [web, A]

## 2. Structure (founder ad, 20–35 s)
| Zone | Time | What happens | Toolkit |
|---|---|---|---|
| Hook | 0–3 s | A bold line on screen plus the first spoken line, and **movement in the first frame**. Test 3–5 hooks against one body | `hooks` (one variant per hook) [A, web] |
| Problem / story | 3–12 s | Founder talking with jump cuts and alternating punch-ins | `cut --punch 1.12` [DD, mine] |
| Proof / product | 12–25 s | B-roll of fabric, back print and on-body shots. **Sub-0.5 s cuts** on routine actions (folding, unboxing) | *next:* `broll` [DD] |
| Offer + CTA | last 3–5 s | Price or offer on screen, "Link in bio / Shop now", and a hit SFX on the reveal | `sfx hit.wav` [A] |

## 3. Cutting rules
1. **Remove every pause longer than 0.35 s** and keep 0.08 s of air around words. Founder takes lose about 30–40% of their length (the test clip lost 38%). [mine, tested]
2. **Punch in 12% on every other cut** so jump cuts look deliberate. Use 1.2–1.3 only for one emphasis moment per ad. [mine]
3. **J-cuts into B-roll:** the next shot's audio starts before the picture, which builds intrigue. **L-cuts out of the founder:** the voice carries over the B-roll. [DD]
4. **Change the angle every 2–3 s:** wide, extreme close-up of fabric or print, high-angle selfie, overhead, low angle. [DD]
5. **Split screen (50/50) for comparisons**, such as "$40 fast-fashion hoodie vs Aura heavyweight". Only make *true* comparisons. [DD, A §10]

## 4. Captions (sound-off first)
- Always burn captions in. Most feed viewing is muted; the widely quoted 85% figure is industry-reported and unverified. [web]
- **1–3 words per line**, the active word highlighted in gold with a 112% pop, punctuation ends a line, no overlaps (tested). [mine]
- **Position at 60% of frame height** (inside the Reels safe zone, §5), Inter Bold, about 5% of frame height, black outline.
- Captions can lead the voice by 0.3–0.5 s for readability [web]. That's not applied yet; test it once real footage arrives.
- Put key words in emphasis colour: the product name, the offer, the identity word ("creative", "nine to five"). [mine]

## 5. Safe zones (Reels / Stories / TikTok, 9:16)
- Keep text and faces out of the **top 14%**, the **bottom 35%** and **6% on each side**. Use 10% sides on tall screens. Ads with a disclaimer need the **bottom 40%** clear. [web: secondary sources citing Meta's Reels ad guidance]
- The toolkit's `safezone` renders a shaded review copy (top 14%, bottom 35%, right 12% action rail). Always check Ads Manager's own preview before launch.

## 6. Sound
- **Music bed at −18 dB, ducked about 11 dB under the voice** (sidechain, 15 ms attack, 350 ms release). Measured on the test clip: an 11.0 dB duck at ratio 3. [mine, tested]
- SFX:
  - a **whoosh** on punch-in cuts, quiet at −14 dB
  - a **hit** on the hook's first frame and on the offer reveal
  - a **riser** into a reveal
  - **pops** for on-screen text, used sparingly
  [mine]
- **Final loudness −14 LUFS, −1.5 dBTP**. The test measured −14.7 LUFS. [mine, tested]
- Only use licensed music: Meta Sound Collection, TikTok Commercial Music Library, or a paid licence. **Never trending copyrighted audio in paid ads.** [A §10]

## 7. Exports
- **9:16 1080×1920** for Reels, Stories and TikTok, and **4:5 1080×1350** for Feed, both 30 fps, H.264 CRF 18, AAC 192 k.
- Some sources say Meta's Reels spec recommends 1440×2560. Test that later. [web]
- **Naming:** `<concept>_H<hook>_<ratio>.mp4`, which maps straight onto the ad naming convention `Concept-Format-Hook-Date` [A §2].

## 8. Never (editing)
- **No fake UI, fake notifications or fake "live" counters.** No fake reviews or fake press logos. No before/after claims we can't prove. [A §10, BRAND-PLAYBOOK §8]
- **No AI-generated people presented as real customers.**

## 9. Open items
- [ ] Fold in the 12 queued tutorials (pacing, sound design, captions, the Hormozi-style edit, color).
- [ ] Jac's example links go to the top of the queue, then reverse-engineer each one: cut rate, caption style, SFX density.
- [ ] Toolkit next:
  - `broll` inserts with J/L cuts
  - split screen
  - green-screen cutout over product page or texture
  - beat-synced cuts

## Written sources
**Safe zones** (all secondary sources citing Meta's Reels ad guidance; one 2026 guide claims Meta unified Stories and Reels zones in March 2026, unverified):
- [inro.social safe-zone checker](https://www.inro.social/tools/instagram-reels-safe-zone-checker)
- [adnova.ai](https://adnova.ai/blogs/meta-ad-safe-zones-guide)
- [adnabu](https://blog.adnabu.com/meta-ads/meta-safe-zones/)
- [houseofmarketers](https://houseofmarketers.com/guide-to-safe-zones-tiktok-facebook-instagram-stories-reels/)
- [billo.app 2026](https://billo.app/blog/meta-ads-safe-zones)
- [socialync](https://www.socialync.io/tools/safe-zones/facebook-reels)

**Hooks and sound-off** (industry blogs; the 85% muted figure and the 1.5–3 s hook window aren't Meta-published):
- [straightnorth](https://www.straightnorth.com/blog/meta-ads-creative-best-practices-that-convert/)
- [vidpros](https://vidpros.com/facebook-video-ads/)
- [cinerads](https://www.cinerads.com/blog/meta-ads-video-creative-best-practices)
- [segwise](https://segwise.ai/blog/anatomy-top-performing-video-ad-frame-by-frame)
- [quickframe](https://quickframe.mountain.com/meta-platform-expert/)

## 10. v0.2: what 12 more tutorials changed (28 Oct)
Sources:
- **Meta creative:** Fraser Cottrell `gP-68LmgAQ4`, Jared Robinson `EaLQwio86Os` + `ooF7rNBYAog`
- **Editing and retention:** Joseph Video Editing `R9Uu0JtvyMg`, Logan Smith `IPW-MF8Kp0I`
- **Sound design:** Herman Huang `tzfzkTAQsnE`, Tim Runia `JOm_EqBoW0M`
- **Captions and type:** Patrik Key `hjNH5JUVgEw`, Motion Nations `4vLwhXY0ZRw`, trikstr. `h5F3QM72PY0`
- **UGC:** Sydney Mohni `ADvpe7eXYp8`, Brands Meet Creators `9xXzrmGVw6k`

### Structure and pacing (overrides §2 where they conflict)
- **Length:**
  - Default **15–25 s**. Short ads that finish beat 40 s ads [9xXzrmGVw6k].
  - Founder origin stories may run to 35 s if retention holds.
- **Hook:**
  - A visual change inside the **first 0.5 s** [ooF7rNBYAog].
  - Optionally a **2-second preview of the payoff** (the finished look) before the talking head [4vLwhXY0ZRw 00:00].
  - Open a loop the viewer needs closed ("We tested 5 heavyweight tees…") [gP-68LmgAQ4 07:43].
- **Body:**
  - No talking-head shot runs longer than **~2 s** without a cut, punch-in or B-roll [ADvpe7eXYp8, IPW-MF8Kp0I].
  - **Show, don't tell:** every garment feature mentioned gets about a 1 s visual of that feature [R9Uu0JtvyMg].
  - Use the angles that already won as statics [EaLQwio86Os].
  - **Convert specs into benefits:** "heavyweight French terry" → "keeps its boxy shape wash after wash" [ADvpe7eXYp8].
- **Tension words** keep people watching: *but*, *instead*, *until* [IPW-MF8Kp0I 03:53].
- **End on payoff:** the last 3–5 s are a clean hero shot of the fit, then the CTA [IPW-MF8Kp0I].
- **J/L overlaps** of 3–10 frames on every speech cut keep momentum [R9Uu0JtvyMg].
- **Funnel fit** [gP-68LmgAQ4 10:36]:
  - Cold: founder story, street/UGC.
  - Mid: split-screen and fabric breakdown.
  - Warm: static proof and offer.

### Captions and type (refines §4)
- **One accent word per line** in gold; everything else white with a 4 px black outline and a soft 70% shadow [hjNH5JUVgEw]. *(The toolkit's current style matches. Its gold is `&H0000D7FF` ≈ #FFD700; the tutorials use #FDA600.)*
- Keep captions **above the chin and collar line** of the speaker, which is also inside the safe zone [hjNH5JUVgEw 02:05].
- **Motion:** eased in, never linear; motion blur on fast moves [h5F3QM72PY0, 4vLwhXY0ZRw].
- **Fonts:** one heavy sans for captions, plus at most one accent face. No neon or glassmorphism: it clashes with Aura's black, white and gold.
- **On-screen checklists** are a strong pattern break, e.g. "✓ Boxy fit ✓ Raw edge ✓ Heavyweight terry" [ADvpe7eXYp8].

### Sound (refines §6)
- **A 4-bin palette only** [JOm_EqBoW0M]:
  - whooshes
  - risers
  - impacts (sub booms)
  - clicks (shutter)
  The toolkit's built-in SFX already cover whoosh, riser, hit and pop.
- **Aura's sound is dark and premium:** sub-booms, mechanical swooshes. No bright dings or vlog chimes [tzfzkTAQsnE].
- **Whoosh into impact:** a whoosh on the last ~8 frames of the founder clip, landing on an impact the frame the product appears [JOm_EqBoW0M].
- **A low riser at about −16 dB** under the founder's pain point (thin blanks, bad fit) [JOm_EqBoW0M].
- **Cut to silence** for the reveal: build with a riser, then drop to silence on the clean garment shot [JOm_EqBoW0M].
- **The CTA lands on a reverb tail:** cut the beat and let about 3 s of reverb ring under "Link below" [tzfzkTAQsnE].
- **Carve space for the voice:** dip the music around 3 kHz under speech, as well as ducking it, so the voice cuts through [tzfzkTAQsnE]. ✅ Added to the toolkit (`mix`).
- **Switch the music** when the section changes (founder → try-on) to reset attention [IPW-MF8Kp0I].

### Rejected from these sources (never-do)
| Tactic | Source | Why it's out |
|---|---|---|
| Commenting from an alternate account ("the detail at 0:22 is insane") to bait re-watches | IPW-MF8Kp0I | Fake engagement: a deceptive endorsement and against platform rules |
| "Grab it before it sells out" / "limited restock" | ADvpe7eXYp8, JOm_EqBoW0M | **Aura is print-on-demand and never sells out.** Only use scarcity that is true: retired designs, real deadlines |
| Borrowed proof stats ("45,000 shipped") or "30-day money-back" | EaLQwio86Os | Only Aura's real numbers and real policy (14-day returns today) |
| Shopify revenue screenshots as social proof | JOm_EqBoW0M | Only if real and current. Never staged |
