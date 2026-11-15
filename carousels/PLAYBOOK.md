# Jac carousel playbook (from @bolicryan's top posts)

Format: tweet card on black. Avatar + "Jac" + @jac_lavoiee, clean white text, header in the same spot on every slide. 1080x1350.
Render: `python3 reel-kit/scripts/tweet_carousel.py carousels/NNN-slug/tweet_spec.json carousels/NNN-slug/slides`

## Format A: the Method (best performer: 812 likes, 1,032 shares, 7 slides)
1. Cover: "How to Manifest [desired state] / ([Name] Method)" + one mystical image card.
2. "1. [Step]" + a REAL quote from a known thinker (check the attribution) + "You may try to fix • • •" + the reframe.
3. "No one talks about this -" + what the person who has it does NOT do + "If you feel like you're constantly • • •" + "You are still IDENTIFYING with…"
4. "2. [Step]" + a question or exercise to do NOW (drives saves).
5. "3. The final framework" + 4 numbered actions, each with a CAPS verb.
6. "4. Live as…" + "Remember -" + the identity line + "This is the Key."
7. CTA: "Save this for…" + "Follow @jac_lavoiee for…"
Caption formula: "You don't have a [X] problem. You have a [Y] problem. 🧠"

## Format B: 3 standalone tweets
Each slide is one screenshot-able thought. Openers: "This might sound crazy," / "If you ever feel…, remember this:" / "Just hope the next viral trend is…"

## Format C: numbered list ("5 signs…")
Cover with an image, one sign per slide, then "If 3 or more felt familiar…" and a follow CTA. Caption: "Which one hit you the hardest? Comment the number 👇"

## Style rules
- 1–2 CAPS words per slide for emphasis. Bullets with •. Short paragraphs.
- Point the punch at the reader's growth, not at "sleepers" or "society". No contested claims stated as fact, no medical or money promises.
- The awakened-soul thread runs through everything: light, energy, the observer, taking back time, freedom and peace.

## Brand angle: THE BLACK SHEEP (locked 2026-11-15)
Jac is the black sheep who stepped off the default script and shows a different perspective so others wake up.
Every carousel questions one "normal" thing (work, time, food, phones, school, money, success, comfort, the herd's opinion)
and hands the reader a new lens or a practice. The punch points at the script, never at people. Ask questions instead of
stating contested claims as fact. No medical, legal or money promises. The reader should finish feeling seen, not lectured.
Recurring words: black sheep, the herd, the script, default settings, wake up, the others, time / freedom / peace, energy, the observer, light.

## Daily routine: 3 carousels per day
- One of each format: A (Method, 7 slides), B (3 standalone tweets), C (numbered list, 7 slides).
- Number folders after the highest existing one: carousels/NNN-slug/tweet_spec.json + slides/. Include "caption" and "format" in the spec.
- Topics come from carousels/CALENDAR.md: take the first row not marked ✅ (A, B and C cells), then mark it ✅. Each topic serves the journey in carousels/TOPICS.md (see the patterns → understand myself → live consciously → wake others).
- Never repeat a method name or quote already used in carousels/*/tweet_spec.json.
- Covers for A and C need an image that matches what the slide says. If Jac sent pin links, download them: python3 reel-kit/scripts/pin_fetch.py PIN_URL name (saves to carousels/images/ and logs the source in SOURCES.md). Otherwise use the best match already in carousels/images/.
- QA: no slide content below y=1250 (shrink "size" on the slide or trim the text), quotes must be real and correctly attributed.
- Add each day's three to carousels/LOG.md: date, folders, captions.
