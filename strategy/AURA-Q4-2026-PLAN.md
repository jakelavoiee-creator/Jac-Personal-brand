# Aura Miami: Q4 2026 Plan + Road to $1M in 2027

Prepared 27 Oct 2026 by Claude (advisor) for Jac. Built on 75 studied ad videos (`training/clothing-brand-ads/PLAYBOOK-DRAFT.md`), the brand-psychology track (`training/aura-brand-psychology/BRAND-PLAYBOOK.md`), and a live audit of the Shopify store through the Admin API.

---

## 0. The honest starting point
| Fact (from Shopify / Meta) | What it means |
|---|---|
| **1 order ever** ($110, 12 Oct, "capsule 01") | We're launching, not scaling. Every projection starts at zero |
| 14 products: tees and tank $55–70, hoodies $85–100, all black-led, back-print statement designs | Good, focused, AOV-friendly catalog. Hoodies carry Q4 |
| Supplier: **Tapstitch** (print-on-demand, no inventory). **Production 1–3 days**; a multi-item order ships **as one package** | No stock risk. One package per order means our bundle margins are conservative (§2 counts shipping per item) |
| Delivery (Tapstitch, 27 Oct): **80% arrive within 9 days, 95% within 14 days** of shipping, so ~10–12 days door to door typically | Workable. Say it plainly on the product page; it also sets the Christmas cutoff (§3) |
| **Duties are already paid** for US orders, but the product template says **"US customers pay duties at checkout"** | The site scares away US buyers over a cost they will never pay. **Fix the copy (P0 #2)**: it turns a fear into a selling point |
| Meta ad account: **0 pixels, 0 campaigns** | Nothing can be optimized until the pixel and Conversions API are live |
| Klaviyo app embed: enabled | Good base for the VIP list and flows |
| Primary domain: aura-miami.ca | A **.ca** domain for a brand called *Miami* aiming at America. Consider a .com |

**North star for Q4:** don't try to out-spend big brands in Black Friday week. Win with (1) a VIP list built in November, (2) bundles that raise order value, (3) creators and TikTok bringing in people who are already warm, and (4) a store that removes every reason not to buy.

---

## 1. Website and product-page audit: what's missing, ranked
*Seen through the Admin API (theme files, products, policies), plus mobile and desktop screenshots of the live site after aura-miami.ca was unblocked. Shopify's image CDN is still blocked from my session, so some below-the-fold images may not have rendered (⚠).*

**Live-site check (27 Oct, mobile):**
- ✅ **Hero is strong:** a real photo, someone on a pool float with a laptop in the AURA tee. It *is* the "too creative for 9–5" story. Keep it. (The theme file references an AI image, but the live hero shows this real photo.)
- ✅ The product page already has accordions: **Product details, Size chart, Shipping, Care guide, Complete the fit**, plus a "Recommended" row. *The size chart exists, so §1.4 is reduced to adding a model-size line and a fit note.*
- ⚠ **Product images are mockup renders**: floating garment + jeans, no person, no face, 10 per product. Fine as a consistent grid; **not enough to convert** cold traffic. Add on-body photos.
- ⚠ **"Buy it now" is Shopify's default blue button**, off-brand next to the black and white UI. Restyle it to white-on-black or remove it (Add to Cart + drawer is enough).
- ❌ **Nothing near the button builds trust**: no reviews, no pay-later option, no "free shipping over $100 · easy size exchanges" line.
- ⚠ **Large blank area below the product row on the homepage.** Probably the gallery and letter sections whose images my session couldn't load; **check on your phone**.

### P0: fix before spending $1 on ads (this week)
1. **Meta pixel + Conversions API.** Shopify → Facebook & Instagram app → Data sharing **Maximum** → connect the dataset → Events Manager "Send test traffic" → check with Pixel Helper → one real test purchase. *(Playbook §1)*
2. **Fix the duties copy (duties are already paid).** Replace "US customers pay duties at checkout" in the product-page shipping block (theme editor → product template; I can't write to your live theme) with:
   > **US duties paid. No surprise fees at delivery.** Ships in 1–3 days · Most US orders arrive in 9 days · Free shipping over $100.

   Put the same line under the Add to Cart button. Every BitBranding offer audit ranks delivery and checkout friction ahead of creative. With duties paid and 1–3 day production, our "W" (wait time) score in the Clothing Offer Equation drops from ~7–8 to ~4 out of 10 once the page *says* so.
3. **Real on-body photos.** ⚠ The product images look like rendered mockups: identical "TooCreative…png" filenames (now renamed ✅) at 765×1070 across products. (Alt text ✅ added 27 Oct to all 106 product images + 13 homepage gallery photos.) The homepage hero is an AI-generated image (`ChatGPT_Image_Aug_30…`). You *do* have real photos (`IMG_0577`, `image00007`… in the homepage gallery); move the best on-body shots to the product pages. Per product you need:
   - front on body
   - back print on body
   - a close-up of print and fabric
   - a lifestyle shot
   - a flat lay
   - **one short clip of the fabric moving**

   AI lifestyle images (Higgsfield) are allowed only if the garment and print are exact (honesty rule).
4. **Size confidence.** The size chart already exists (accordion). Add on each product page:
   - the line "Model is 6'0", 175 lb, wearing L" directly under the size buttons
   - a **fit note**: "Oversized boxy fit, so size down for a regular fit"

   Returns in apparel run 20–40%, and fit is the #1 reason.
5. **Reviews.** Install **Judge.me** (free). Ask your first buyers personally for reviews with photos. Gifted creators review with an honest "gifted" label. Zero reviews on cold traffic is a major conversion drag.

### P1: before Black Friday (by 20 Nov)
6. **"Members Only" has to be real.** Products are titled "(Members Only)", but there's no membership. Make it true: **Aura Members = the VIP list**. Members get early access, a members-only colourway and a numbered card. (Truthful scarcity; FTC-safe.)
7. **Trust and policies:**
   - Contact is a personal Hotmail. Get `hello@` on your own domain.
   - Returns: 14 days, customer pays, unworn with tags. For the holidays, **extend returns to Jan 15 and offer free size exchanges**. It removes the gift-buyer's fear of getting the size wrong.
   - Put shipping and returns lines **directly under Add to Cart**.
8. **Pay later.** Add Afterpay or Klarna (Shop Pay Installments may not be available to a Canadian store) and show "or 4 payments of $25" under the price.
9. **AOV mechanics:**
   - a "Complete the look" cross-sell on product pages (tee ↔ hoodie)
   - a cart progress bar: "$X to free shipping" (already $100), then "$150 → free Aura gift"
   - bundles (§3)
10. **Housekeeping:**
    - ~~Empty image alt text~~ ✅ 27 Oct: alt text on 106 product images + 13 gallery photos; product image files renamed to SEO names (e.g. `aura-miami-consciousness-hoodie-black-back.png`). Gallery files keep their names because the theme links them by filename.
    - ~~Social links blank~~ ✅ done by Jac (TikTok + IG).
    - ~~10+ draft themes~~ ✅ archived by Jac.
    - "Five colorways" copy must match the live variants.
11. **Klaviyo:**
    - Confirm the pop-up and the 6 core flows are live (playbook §6): Welcome ×4, browse 1h, cart 30m, checkout, post-purchase, winback.
    - Smart Sending **off** for flows.
    - Pop-up: 6s delay → one-tap quiz ("Shopping for you or a gift?") → email → SMS.

### P2: January
12. A **.com** domain (`auramiami.com` or similar) if obtainable. Move off POD for hero items to small bulk runs, which gives better margins, faster delivery and *real* numbered drops.

---

## 2. Unit economics (real costs from Jac, 27 Oct)
Supplier: **Tapstitch**. Multi-item orders ship as one package, so real bundle shipping is lower than this table assumes and bundle contributions are a floor.

Landed cost = product + US shipping, from your POD sheet. Payment fees are estimated at **2.9% + $0.30** (Shopify Payments, online). Add ~1.5% if USD orders settle in CAD. Contribution = price − landed cost − fees, **before ads**. Break-even ROAS = price ÷ contribution.

| Item (SKU) | Price | Landed cost | Fees | Contribution | Margin | Break-even ROAS |
|---|---|---|---|---|---|---|
| French Terry Raw Edge Tee (RT0005) | $55 | $26.10 | $1.90 | **$27.00** | 49% | **2.04** |
| Same tee, statement / Members ($70) | $70 | $26.10 | $2.33 | **$41.57** | 59% | **1.68** |
| French Terry Boxy Tank (RB0003) | $55 | $30.44 ($25.44 + $5 ship) | $1.90 | **$22.66** | 41% | **2.43** |
| Fleeced Boxy Hoodie (RU0118) | $85 | $39.28 | $2.77 | **$42.95** | 51% | **1.98** |
| Same hoodie, statement / Members ($100) | $100 | $39.28 | $3.20 | **$57.52** | 58% | **1.74** |

*Assumes the $70 tees and $100 hoodies use the same blanks as the $55/$85 ones. Free shipping over $100 is live, so landed cost is the worst case: under $100 the customer's shipping fee offsets part of it.*

**What the real numbers say:**
1. **Cold-ad heroes are the $100 hoodies and $70 tees** (break-even ~1.7). The extra $15 of price is almost pure margin. Lead cold ads with them.
2. **The tank is the weakest unit** (41%, break-even 2.43). It's for bundles and summer, never a solo cold-ad hero.
3. **Target ROAS = break-even + 10–20%:** ~**2.0–2.3** on single statement items, ~**2.6–2.9** on BFCM bundles (see §3).
4. **Bundles at $120 are healthy:** the Full Look (hoodie + tee, $120) leaves **$50.84** (break-even 2.36), almost double a single tee.
5. **Creator seeding cost is now exact:** a gifted hoodie costs **$39.28**, so 25 hoodies = **~$980**.
6. *Housekeeping:* your Shopify variants have **no SKUs**. Adding RT0005 / RB0003 / RU0118 makes POD matching and the Meta catalog cleaner.

## 3. Offers: Black Friday, Cyber Monday, Christmas, Boxing Day
Principles: **the core never goes on a flat sale**. Value comes from bundles, gifts and access. Every scarcity claim is true. Discounts **auto-apply** (no codes to type).

| Window | Offer | Why it works |
|---|---|---|
| **Now → 23 Nov** (evergreen) | **"The Full Look"**: any hoodie + any tee, save $20 (e.g. $85 + $55 = $140 → $120). Free shipping over $100 (already live) | Lifts AOV from ~$70 to $120 without discounting single items |
| **1–23 Nov: VIP build** | "Become an Aura Member: 48h early access to Black Friday + the Members-Only colourway." Email/SMS sign-up page | Commitment ladder + unity (BRAND-PLAYBOOK §2, §3) |
| **24–26 Nov: Members' early access** | **Buy 2 save 20% · Buy 3+ save 30%** (auto-applied, tiered; the 30% tier is **Members-only**, since warm traffic costs almost nothing to reach) + **Members-Only colourway hoodie**, available **only** to Members and **retired 1 Dec** (true: the product is unpublished on 1 Dec) | Real scarcity with a real deadline. Insiders first |
| **27–30 Nov: Black Friday → Cyber Monday (public)** | **Buy 2 save 20% · Buy 3+ save 25%** (the real-cost check below shows 30% is too thin for cold traffic). **Free Aura gift on orders over $150** (sticker pack + keychain, ~$3 cost). First 100 orders get a numbered Aura Members card (true, numbered by hand). Ends **Mon 30 Nov, 11:59pm ET**, and it *does* end | AOV push; loss aversion with a deadline we keep |
| **1–3 Dec: Christmas shipping window** | "Order by **Thu 3 Dec** for Christmas delivery (US)." Production 1–3 days + 95% delivered within 14 days = 17 days, plus a holiday-carrier buffer. **Confirm with Tapstitch whether those are calendar or business days**; if business, the cutoff moves to ~Mon 30 Nov | The honest cutoff protects reviews and chargebacks; after it, gift cards take over |
| **3–24 Dec: Gifting** | **Digital gift cards** (instant: the answer to the shipping cutoff) with **"Buy $100, get a $20 bonus card for January"**. Gift sets: "Gift the Look" (hoodie + tee) with a gift note | Captures late gifting *and* books January revenue |
| **26 Dec–3 Jan: Boxing Day / New Year** | **"Capsule 01: Final Call"**: 2 designs **retired permanently** after 3 Jan (true), at the bundle tiers. Waitlist for Capsule 02 | Cheapest CPMs of the year (−42% in Q5); real retirement scarcity; sets up the January drop |

*Margin check (real costs, incl. fees and the ~$3 gift where it applies):*

| Order | Price after offer | Contribution | Break-even ROAS |
|---|---|---|---|
| Full Look, hoodie + tee (evergreen) | $120.00 | $50.84 | 2.36 |
| Buy 2 at 20%: hoodie + tee | $112.00 | $43.07 | 2.60 |
| Buy 2 at 20%: 2 hoodies | $136.00 | $53.20 | 2.56 |
| Buy 3 at 25%: 2 hoodies + tee (public) | $168.75 | $55.90 | 3.02 |
| Buy 3 at 30%: 2 hoodies + tee (Members) | $157.50 | $44.97 | 3.50 |
| Buy 3 at 30%: 3 tees | $115.50 | $33.55 | 3.44 |

**So:** cold ads promote the **20% tier** (break-even ~2.6). The **30% tier stays a Members-only reward**, where the list costs almost nothing to reach. Never put cold spend behind 30% off.

---

## 4. Ads plan (Meta), tied to the playbook
**Structure:** one Sales campaign → **one ad set** (Advantage+ audience, US + CA, Advantage+ placements) → 6–10 varied ads named `Concept-Format-Hook-Date`. $40–60/day from pixel go-live. Separate VIP-lead campaign 1–23 Nov (to the landing page, not instant forms). Promo campaign 24–30 Nov. Evergreen stays running and untouched. *(Playbook §2, §4, §12)*

**Suggested Q4 budget:** Nov 1–23 ~$1,000 · BFCM week ~$800 · Dec ~$1,200 → **~$3,000**, adjusted weekly by the Monday rule (±20%).

### Concepts (first 3 launch as soon as the pixel is live; 3 new every Thursday)
| # | Concept | Format | Hook (first 3s) |
|---|---|---|---|
| A | **Founder: "Why Aura exists"** | Your founder footage, my edit | "I made this shirt for every creative stuck at a desk." |
| B | **POV: too creative for a 9–5** | UGC / lo-fi phone video, back-print reveal | Text: "POV: you're still answering emails but your mind's in Miami" |
| C | **The back print says it for you** | On-body back reveal + macro print close-up | Turn-around reveal, SFX hit on "TOO CREATIVE FOR NINE TO FIVE" |
| D | **Us vs mall merch** | Static comparison | "Heavyweight fleece. Boxy fit. A message you'd actually wear." |
| E | **Members early access** (Nov) | Founder + static | "Black Friday starts 3 days early, for Members only." |
| F | **Gift for the creative in your life** (Dec) | Gift-set flat lay + UGC | "If they've ever said 'I want to start my own thing', this is the gift." |

### Founder scripts (for the footage you'll send; I'll edit them)
**A1, "Why Aura" (~35s)**
> [Hook, to camera, close] "I made this hoodie for every creative who's still sitting at a desk."
> [Beat] "Two years ago I was working a nine to five, designing at night. Everyone said get serious."
> [Turn, show back print] "So I put it on the back. *Too creative for nine to five.* Not as a joke. As a reminder."
> [Product] "Heavyweight fleece, boxy fit. Made for long nights."
> [Unity + CTA] "If you know, you know. Join Aura Members and get early access before Black Friday." → *edit:* supers, back-print slam, SFX, CTA card.
*(Rewrite with your real story. The details must be true.)*

**A2, "The note" (~20s, VIP push)**
> "Black Friday at Aura starts on the 24th, but only for Members. Members get it first, plus a colourway that disappears on December 1st. Link's below. Become a Member."

**A3, "Read the back" (~15s, pure product)**
> [Back to camera] "Read it." [Turns] "If that's you, you're one of us." [CTA card]

### UGC creator brief (one page, sent with every gifted package)
- **Talking points (not a script):** what the back print means to *you*, the fit (oversized boxy), the fleece weight, where you'd wear it.
- **Shots:** a front-facing open stating the point in 0–3s; back-print reveal; putting it on while heading out (mid-action); macro of the print.
- **Deliverables:** 3 hooks × 1 body (modular), 9:16, raw files + edit, usage rights 90 days, "gifted" disclosure.

---

## 5. Creator program (runs alongside ads)
**Reality check:** with ~3-week POD delivery, gifted product sent on **28 Oct arrives ~17 Nov**. Creators must be **contacted this week**, or their content misses BFCM.

| Tier | Who | Deal | Number |
|---|---|---|---|
| **Seed** | 2k–20k followers: creatives, entrepreneurs, designers, music producers, Miami/Toronto lifestyle, streetwear | Gifted hoodie + **15% affiliate code** (Shopify Collabs, free) + "gifted" disclosure | **20–30** |
| **Paid** | Seed creators whose post performs | $150–300/video, 90-day usage rights, **Partnership ad** test 5–7 days → monthly retainer for winners | 3–5 |
| **Anchor** | One artist or creator who embodies "too creative for 9–5" | Collab capsule in 2027 (Aura for Artists) | 1 |

Pipeline: outreach (DM + email) → ship → content by ~20 Nov → best posts become Partnership ads in BFCM week → winners retained in December. **FTC:** every gifted or paid post is labelled.

---

## 6. TikTok / Reels plan: built to go viral in this niche
What the research says works for apparel organically: **niche relatability, low-fi, volume, soft CTAs.** Apparel Success: 21 clips in 1 hour, 3/day, 9:1 value-to-product. Rob Prsa: 98/2. Marshall Crews: 70/30 identity/product.

**Pillars (weekly mix):**
1. **"Too creative for a 9–5" POV skits (40%).** Desk life vs creative life; "my manager when I say I have a side project"; text-over-face, 5–10s.
2. **Creative-life relatability (25%).** "Things only creatives say", "3am idea vs 9am meeting", roll-call posts ("comment what you're building").
3. **Build in public (20%).** Founder: designing Capsule 02, the first order, packing orders, numbers: honest, raw.
4. **Product (15%).** Back-print reveals, fit checks, "which colourway?" polls, drop countdowns.

**Ritual:**
- Batch Monday: 21 clips in ~1–2 hours.
- Post 3/day TikTok + Reels.
- Soft CTA ("link's in bio if that's you").
- Pin one product post.
- Every clip that beats the account's average views goes into the Thursday ad test.

**15 starter hooks (text overlays):**
1. "POV: you're too creative for this meeting"
2. "Me at 9am vs me at 2am with an idea"
3. "Things my boss doesn't know I'm building"
4. "If you have 47 business ideas in your notes app, this is for you"
5. "Creatives are the new athletes. Change my mind"
6. "Signs you were never built for a desk"
7. "My parents asking when I'll get a real job"
8. "Day 1 of building a clothing brand from my bedroom"
9. "Read the back of my hoodie"
10. "The only dress code I follow"
11. "Rule no. 1: never be number 2"
12. "When someone calls your dream 'just a hobby'"
13. "I quit my 9–5 for this. Here's month one"
14. "What $110 of first sales feels like" (true, from your first order)
15. "Which one would you wear: Born To Be A Star or Created To Create?"

---

## 7. Projections (assumption-driven; your numbers will tighten them)
**Assumptions:**
- AOV $95 now → **$120** with bundles in BFCM.
- New-store conversion rate 1.0–1.8% (rising with photos and reviews).
- Nov CPM $18–22 → BF week $28–35.
- VIP list conversion during early access 5–8%.

| Q4 2026 (Nov–Dec) | Conservative | Base | Aggressive |
|---|---|---|---|
| Ad spend | $1,500 | $3,000 | $5,000 |
| VIP list by 24 Nov | 150 | 400 | 1,200 (creator or TikTok spike) |
| Orders | 30–45 | 80–130 | 220–350 |
| **Revenue** | **$3–5k** | **$9–15k** | **$25–40k** |
| What decides it | Fixes not done; ads alone | P0 fixes done, creators post, 3/day TikTok | One viral clip or creator hit, plus everything in "Base" |

**2027 path to $1M (≈8,300 orders at a $120 AOV)**
| Month | Target | What has to be true |
|---|---|---|
| Jan | $15k | Capsule 01 Final Call + gift-card redemption; Capsule 02 waitlist |
| Feb | $20k | Monthly drop ritual starts; 3 concepts/week; retained creators |
| Mar | $30k | Hero items move to bulk production (margin ↑, delivery ≤7 days) |
| Apr | $45k | Ads ~$12k/mo at MER ≥3; email/SMS ≥20% of revenue |
| May | $60k | Phase-2 daily scaling (50+ purchases/week); spring capsule |
| Jun | $70k | First Aura for Artists collab announced |
| Jul | $80k | Collab drop; summer tees and tanks |
| Aug | $90k | Back-to-school / "new chapter" angle |
| Sep | $100k | Ads ~$30k/mo; returning-customer rate ≥25% |
| Oct | $110k | Q4 build: VIP list ≥10k |
| Nov | $200k | BFCM on a warm list + a mature account |
| Dec | $180k | Gifting with fast US fulfillment |
| **Total** | **$1.00M** | |

**My honest read:** $1M is achievable only if four things happen by Q2: **duties-paid messaging on every page (and US fulfillment for speed later)**, **real photos and reviews**, **a monthly drop ritual with a growing list**, and **an ad account trained on hundreds of purchases**. A miss on any one of them makes $500–700k the realistic outcome. Everything in this plan is aimed at those four.

---

## 8. Editing: how I'll turn your founder footage into ads
Send the raw files (vertical, 4K/1080p, clean audio). For each one I'll deliver:
- **3 cut lengths:** 15s, 30s, 45s
- **3 hook variants:** the same body with different openings (playbook: 2 bodies × 10 hooks = 20 ads)
- **Retention edit:** silences removed, jump cuts, a punch-in zoom every 2–4s on emphasis, burned-in captions (3–4 words, bold, centre-lower, keyword highlight)
- **Back-print "slam" text, B-roll and product inserts, whoosh and impact SFX, music ducked under the voice**
- **An end card** with the offer

Versions are 9:16 (Reels/Stories/TikTok) plus a 4:5 feed cut, all inside Meta's safe zones. Editing technique study is running now (`training/ad-editing/`). Your example links go to the front of the queue.

---

## 9. Decisions I need from you (in order)
1. ~~Real costs, supplier, shipping~~ ✅ 27 Oct: Tapstitch, one package per order, 1–3 day production, 80% in 9 days / 95% in 14 days. SKUs added in Shopify (`RT0005/RB0003/RU0118-DESIGN-COLOUR-SIZE`, all 265 variants). **Still open:** calendar or business days?
2. ~~Duties~~ ✅ already paid. **Action for you:** change the duties line on the product template (P0 #2). The site stays open; the VIP list builds alongside it from 1 Nov.
3. **Q4 ad budget:** I recommend ~$3,000 Nov–Dec.
4. **Meta connector:** check whether your account has Meta's official Ads MCP; otherwise upgrade Adspirer.
5. **Creator budget:** ~20–30 gifted hoodies ($39.28 each landed, so ~$790–1,180) + ~$600–1,200 for paid posts.
6. **Approve the offer calendar (§3)** and the "Aura Members" concept.
7. **Send the founder footage** and your editing example links.
