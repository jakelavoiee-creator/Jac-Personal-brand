# Aura ad-editing playbook (v0.1, 27 Oct 2026)

**How to read this.** This is the spec for turning Jac's founder footage into ads, with each rule mapped to the toolkit in `scripts/ad-edit/`. Rules are tagged by where they come from:
- **[DD]** Dara Denney video note `notes/R1HQW38EcRA.md`
- **[web]** written sources at the bottom, all secondary (blogs and tools), never Meta itself
- **[A]** the Meta ads playbook `../clothing-brand-ads/PLAYBOOK-DRAFT.md`
- **[mine]** my own default, to be tested

Still to come: 12 editing tutorials are queued for when the Gemini quota resets, and Jac's own example links go to the top of that queue.

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
