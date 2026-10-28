# Morning report: 28 Oct 2026

Jac, here's where Aura stands, what I learned and changed, and the short list only you can do.

## 1. The five things to do today
1. **Meta pixel + Conversions API.** Shopify → Facebook & Instagram app → data sharing **Maximum** → Events Manager "Send test traffic" → one real test purchase. **No ad money goes out before this.**
2. **Klaviyo pop-up.** Sign-up forms → the spec in the Q4 plan (P1 #11): "Get Black Friday first: 24h early access + 10% off your first order", shown after 8 s or 40% scroll. About 15 minutes. Send me a screenshot to review.
3. **Shopify Geolocation app.** Apps → "Geolocation" (by Shopify) → install. I can't install apps for you.
4. **Fix two lines of copy:**
   - The announcement bar's hard-coded "Free shipping over 100$ USD" → *"Free shipping over $100 USD · £80 · €95 · $140 CAD"*.
   - The product-page Shipping text → *"Made in 3 days. Delivered within 10 days of shipping."* (it still says business days).
5. **Photos.** Keep shooting with the Higgsfield prompt. Send each finished set and I'll check it, rename it, write the alt text and upload it.

## 2. What changed in the store (all checked on the live site)
| Change | Detail |
|---|---|
| SKUs | All 265 variants now carry a SKU in `RT0005/RB0003/RU0118-DESIGN-COLOUR-SIZE` format |
| Image alt text | 106 product images + 13 homepage gallery photos described (SEO + accessibility) |
| Image file names | 106 product images renamed (`aura-miami-<design>-<garment>-<colour>-<view>.png`). Gallery files kept their names because the theme links them by filename. I tested a rename, saw it break, and reverted it |
| Shipping per market | US $10 / free from $100 (was $70) · CA $15 CAD / free from $140 CAD · UK £8 / free from £80 · EU €10 / free from €95 · AU/NZ/India $15 CAD / free from $140 CAD |
| Markets | Already right: local currency and rounding in every market ($100 → $141 CAD / £77 / €91.95) |
| You did | Removed the duties line, filled in the social links, archived the draft themes |

## 3. Decisions locked (27 Oct)
- **Ads:** one conversion campaign for all of Q4; Black Friday ads go into the same ad set.
- **Email list:** built by the site pop-up. The website stays open.
- **"Members":** parked until 2027. The print name stays; no membership claims.
- **Black Friday:** Buy 2 save 20% · Buy 3+ save 25%, with subscribers 24h early on 26 Nov. It ends **Mon 30 Nov 11:59pm ET**.
- **Christmas cutoff:** **Wed 9 Dec**; gift cards after that.
- **Shipping promise:** 3 days to make, up to 10 days in transit; US duties paid.

## 4. What I learned (training week)
- **Meta ads:** 75 video notes → `PLAYBOOK-DRAFT.md` v7.
  - Tracking gates come first.
  - One ad set until about 50 purchases a week.
  - Broad targeting, with the creative doing the targeting.
  - Weekly ±20% budget rule, then daily +5%.
  - At least 20% difference between creatives.
  - Hooks have 4 layers.
  - Partnership ads for creators.
  - A never-do list of dark patterns I rejected.
- **Brand psychology:** Cialdini ×2 + cited web sources → `BRAND-PLAYBOOK.md`.
  - The 7 principles, used only truthfully.
  - Holiday psychology: loss aversion, competitive arousal, fairness.
  - Pricing rule: the core never goes on sale.
  - The drop model.
  - Extension rules (4-question fit test, Aura for Artists as a collab line first).
- **Ad editing:** 1 video note + written sources → `EDITING-PLAYBOOK.md` v0.1, plus a **working edit pipeline** (`scripts/ad-edit/aedit.py`).
  - What it does: cuts, punch-ins, word-by-word captions, ducked music, SFX, −14 LUFS, hook variants, 9:16 + 4:5.
  - Tested on a synthetic clip: 38% dead air removed; 4 ads in about 1 minute.
- **Product photography:** `TEE-SHOOT-BIBLE.md` (garment, print and cast locks; shot list; QA).
  - First result: the black Nine To Five back hero on Jack.
  - The print was letter-perfect.
  - The colour was fixed with a real Tapstitch photo as reference.
- **Unit economics:**

  | Product | Price | Break-even ROAS |
  |---|---|---|
  | Tee | $55 | 2.04 |
  | Tee | $70 | 1.68 |
  | Tank | $55 | 2.43 |
  | Hoodie | $85 | 1.98 |
  | Hoodie | $100 | 1.74 |

  **Lead cold ads with the $100 hoodies and $70 tees.**

## 5. Still waiting on you
- **Founder footage** and the example ads you want me to match. Your links go to the top of my study queue.
- **Q4 ad budget** (I recommend about $3,000 Nov–Dec) and **creator budget** (about 25 gifted hoodies ≈ $980).
- **Meta connection:** check whether your account has Meta's official Ads MCP; otherwise upgrade Adspirer (the free tier is about 15 calls a month).

## 6. Where everything lives (private links)
| Document | Link |
|---|---|
| Q4 plan | https://claude.ai/artifact/LB5b6SRa6KzsRKxTWhSiDj |
| Meta ads playbook | https://claude.ai/artifact/Y6JtvzmV9dKGW8DimSdoUG |
| Brand playbook | https://claude.ai/artifact/6kUhg9NTPekSa1veiy4t8w |
| Brand research notes | https://claude.ai/artifact/6f5QKqb2uuH9SNwbjkiU7p |
| Editing playbook | https://claude.ai/artifact/VHXJJgkAS7eXzP2B4vz2WR |
| Edit toolkit | https://claude.ai/artifact/JWwecC43NwxDg2qrvJ8fN6 |
| Tee shoot bible | https://claude.ai/artifact/HUXcbGDWpKkaKw388aYL7H |
| Training notes library | https://claude.ai/artifact/E1iE7kaaoV8KogjbBsWdxj |

New skills in the repo: `clothing-brand-meta-ads`, `aura-miami-brand-strategy`, `aura-ad-editing`.

## 7. Next on my side
- Restart the brand-psychology and editing studies when the Gemini quota resets (about 07:00 UTC): 34 brand videos and 13 editing tutorials are queued. After those, the remaining Meta ads videos.
- Toolkit: B-roll inserts with J/L cuts, then split screen.
- QA and upload your photo sets as they arrive.
