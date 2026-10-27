# Clothing Brand Meta Ads Playbook (DRAFT v5)

v5 (11:50 UTC): +8 videos, including Meta for Business's official Advantage+ Sales guidance, the Advantage+ Sales vs Shopping changes, Andromeda/GEM mechanics, BitBranding's newest method, TikTok Shop as a UGC engine, returns economics, and an apparel retention case study. 69 videos total; 3 failed (Gemini had no access).

v4 (09:30 UTC): +15 videos, including all 11 re-watches with the full model. Small-budget structure revised (1 campaign / 1 ad set), weekly decision cadence for new accounts, tracking verification, UGC and creator partnerships, AI shoot locks, and a **Never-do list** (§10). 61 videos total.
v3 (07:30 UTC): +13 videos covering hooks, retargeting, Advantage+ Sales, the product page, drops and pre-orders, and Klaviyo (46 total at full-model quality; 11 more are being re-watched).
v2 (05:10 UTC): +6 videos on creative diversity, signal quality, and small-brand operators.
Synthesis of 46 studied videos (notes in `notes/<id>.md`, cited as `[id mm:ss]`).
Status: **draft**. It gets refined at every check-in as more videos land. The final version becomes `.claude/skills/clothing-brand-meta-ads/SKILL.md`.

**North star:** profitable, compounding Meta growth for a clothing brand. Creative does the targeting, the offer does the converting, and the numbers make every scaling decision.

---

## 0. Where Jac's account stands (2026-10-27)
| Item | Status | Implication |
|---|---|---|
| Meta ad account `1447739777174385` | Connected via Adspirer | Ready to read, quota-limited |
| Campaigns | 0 | Clean slate. No legacy fragmentation to undo |
| Pixel / dataset | **0** | **Blocker.** A Sales campaign cannot optimize for Purchase without it |
| Adspirer quota | 15 calls/mo, 2 used | Too small to operate live ads daily |
| Brand inputs (name, products, AOV, margins) | Unknown | Needed before writing a single ad |

---

## 1. Pre-flight: the 5 gates before $1 of spend
Every serious source puts these ahead of campaign settings. Ads amplify what already works; they cannot fix a leaky offer [XFahxHZUS_c 00:45, s1wGNE_2TX4 00:31, W-QZGhQWrP0 18:52].

1. **Tracking is live.** Business Manager with Page + Instagram + Ad Account + Dataset all cross-assigned. Shopify "Facebook & Instagram" app with data sharing set to **Maximum** (Pixel + Conversions API + Advanced Matching). Pixel ID in Shopify matches Business Settings [-h9OK0iuyWs 04:20–07:57].
   - In Events Manager: **Automatic Advanced Matching ON**, data freshness **Real time**, browser and server events deduplicated. Target **Event Match Quality ≥ 9/10 on Purchase**. Weak signal makes every CPM more expensive [O8Doria9dic 12:15–14:45].
   - **Verify, don't assume:**
     1. Events Manager → Settings → *Partner integration: Shopify* → **Send test traffic** until it shows Active.
     2. Click through the store with the **Meta Pixel Helper** extension: PageView → ViewContent → AddToCart → InitiateCheckout.
     3. Make one real test purchase [lDG8OnKYdp4 02:48–04:05].
   - EMQ targets: **Purchase/AddToCart ≥ 8.5–9.3**. PageView at 5.6–6.7 is normal because there's no personal data at that point [VLFpeLyWXHg 01:28, 10:41]. High-value parameters: email and click ID (`fbc`), then phone, external ID and `fbp` [VLFpeLyWXHg 05:49].
   - Browser and server events must share the same `event_id`, or purchases get double-counted [JhVTBCpo0wc 15:15].
   - **Don't add address fields to pop-ups to raise EMQ.** That trades conversion rate for a vanity score; checkout already collects the full address [VLFpeLyWXHg 11:28].
   - If the native Shopify integration leaves Purchase EMQ under 8.5, consider a server-side tracking tool. Native setups often drop `fbc`/`fbp` [VLFpeLyWXHg 02:15].
2. **Unit economics known.** Break-even ROAS = price ÷ (price − COGS − shipping − fees − returns buffer). Worked example: $65 tee − $30 hard costs → $35 margin → **BE ROAS 1.86** [66GBrizQebM 03:26–04:36]. Target ~2.0+ for safety [daWXtGJmgls 18:21].
   - Include **inbound freight** and net out shipping revenue. Jar Builds' sheet: $20 COGS + $10 inbound + $10 outbound − $5 shipping revenue + $2.40 fees = $37.40 delivered on an $80 MSRP → BE ROAS 1.88. Target is BE plus a 10–20% net margin [rnqKfnElMaM 09:25–10:37].
   - **Hard floor:** the minimum daily spend whose gross profit covers fixed costs. When performance dips, cut to the floor, never below it, and fix creative or the site [rnqKfnElMaM 14:47–15:38].
   - Judge site changes by **revenue and profit per visitor**, not conversion rate alone. Raising a price from $50 to $55 can lower CR and still win on profit [A-7pTamjBIw 01:45–06:47].
3. **The offer passes the COE audit.** Score = (Style Aspiration × Quality/Fit confidence) ÷ (Wait time + Shopping friction + Price sensitivity). Fix the biggest denominator first. Scale only when the offer is strong [XFahxHZUS_c 01:46–07:41, Ng-tbllMb8g 15:11].
   - Fulfillment >5 business days → wait-time problem. Repeat rate <20% → fit/trust problem. >50% of orders on a code → price-sensitivity problem [XFahxHZUS_c 05:51, 21:16].
4. **The store converts cold traffic.**
   - ≤3 mobile taps from PDP to paid.
   - Product grid visible on landing, with no splash pages or autoplay.
   - Social proof near the top.
   - PDP with multiple angles, size chart, reviews, customer photos, and "complete the outfit" cross-sells [XFahxHZUS_c 05:32, kMlgNR-0djA 36:00–40:02, 15Sgh3-xjRk 03:45].
   - Funnel health: **≥10% of product views → Add to Cart**, and **≤50% drop from ATC → checkout** [rBD9xJswb5k 24:18–24:50].
   - **Fashion PDP checklist** (Represent/Comfrt teardown) [gHAHjtfKJjQ 04:13–15:51]:
     - Flat lay, detail close-ups, full-fit lifestyle shots and a short in-use video loop.
     - Directly under the size selector: "Model is 187cm / 75kg wearing M". For unisex pieces, show both a male and a female model.
     - A size-guide pop-up with garment measurements and an in/cm toggle, plus review-based fit sliders (True to size / Length / Comfort).
     - The BNPL instalment (Klarna/Shop Pay) directly under the price.
     - A high-contrast Add to Cart button with stock status, and one-line answers to objections under it (free shipping, easy returns, in stock).
     - Details, FAQ and Shipping & returns in collapsible sections.
     - Customer photo reviews.
   - **The first 20 reviews:** contact the earliest customers personally and ask. Don't wait for reviews to arrive [gHAHjtfKJjQ 14:04].
   - Cart and checkout: a **slide-out drawer cart**, express pay (Shop Pay / Apple Pay / Klarna), local currency via Shopify Markets, and returns and shipping times **directly under Add to Cart**. Review highlights framed as *"At first I thought X, but actually Y"*. Raw try-on UGC near the button [A-7pTamjBIw 10:34–16:47].
   - Test one variable at a time, starting with the **offer** (price, bundles, upsells, guarantee), not button colours [A-7pTamjBIw 05:08–09:07].
5. **The Instagram profile can close the sale.** Cold traffic checks the profile. Five highlights: About/Mission, Latest Drop, Customer Reviews, Shipping Proof, FAQ [rhP-S30Rmqo 03:13–05:30].

---

## 2. Account structure (consensus 2026, post-Andromeda)
**Consensus across BitBranding, Skaleit, Mark Builds Brands, Ben Heath, ADVT:**
- Objective **Sales**, optimizing for **Purchase**, **Highest volume** bidding.
- **Broad** targeting: country + age + gender only. No interest stacks, lookalikes or exclusions [daWXtGJmgls 06:53, 10eQ39SCRN4 22:48, 15Sgh3-xjRk 05:13, z4UAXut0kCA 02:30].
- Ad sets are organized by **creative concept**, never by audience [66GBrizQebM 07:16, mYtqeeW7NiU 01:36, z4UAXut0kCA 01:48].
- Consolidate: **one CBO** under $100/day; at most **two** above that (Prospecting CBO + category-segmented DPA CBO) [10eQ39SCRN4 11:08–11:15].
- Attribution: 7-day click / 1-day view. **Not** "engaged view", which inflates results with scrollers [kfE5jYBymBI 11:39].
- No end date on ad sets; it caps delivery [jW1TLgpzrLA 02:48]. For carousels, keep "Highlight carousel card" **on** and check that 1:1 crops don't cut off the garment [jW1TLgpzrLA 03:55, 08:05].
- Turn **off** Advantage+ creative enhancements (music, touch-ups, text tweaks, catalog add-ons, animation) and **off** "Optimize website destination". Keep "Relevant comments" **on** [s1wGNE_2TX4 10:50–11:33, z4UAXut0kCA 08:24–09:25].
- Link to the **specific product page**, never the homepage, for product-led ads [s1wGNE_2TX4 10:16]. Lifestyle/brand ads can go to a collection [WpsFxcqNQrg 19:12].

**Starter structure for a new account (recommended for Jac; revised in v4):**
```
Sales | Broad | Hero product | <date>        $50–90/day   (≈ $10 × number of ads, $50 floor)
 └─ ONE ad set: Advantage+ audience, US, Advantage+ placements
     ├─ A1 Us-vs-Them static          ┐ ads named  <Concept>-<Format>-<Hook>-<date>
     ├─ A2 Us-vs-Them carousel        │ so concepts stay readable without
     ├─ B1 Flat-lay offer static      │ splitting the data
     ├─ B2 Flat-lay offer video       │
     ├─ C1 Founder story (name/title) │
     └─ C2 UGC try-on (mid-action)    ┘ 6–10 diverse ads; up to 5 text options per ad
```
Why one ad set: with ~20 purchases a week, 3 ad sets get ~7 each and none leaves learning [XLagiyzYYpE 26:15–27:06, 13s-G9Uj51A 05:35]. Advantage+ audience vs a hand-restricted audience made **no measurable difference** in a controlled $2.5k split test ($18.09 vs $17.78 CPA), and both versions retargeted ~27% automatically [_OSs0Jgv4L8 04:14–06:00].
- Split concepts into their own ad sets **after** the account reaches about 50 purchases a week (the BitBranding concept-ad-set structure in the next bullet).
- To steer age without hard limits, use **Value Rules** (e.g. −90% bid on non-target ages) rather than turning Advantage+ off [_OSs0Jgv4L8 03:25].
- Separate campaigns only for different product **categories**, locations or offers, never for colour variants [13s-G9Uj51A 18:58].
- **Advantage+ Sales is becoming the default.** About half of accounts now go straight into an Advantage+ Sales setup when you pick Sales. It requires the budget at **campaign level**; switching to ad-set budgets turns the Advantage+ label off. Unlike the old Advantage+ Shopping campaigns, it **allows several ad sets** (use them as creative-batch folders) [2bAG9xURZvQ 01:00–05:10]. The 1-ad-set starter above works as-is inside an Advantage+ Sales campaign.
- **Meta's official levers** for new-customer acquisition: Budget, Audience, Placements. Add an **existing-customer exclusion** when the goal is purely new buyers (peaks, drops) [-JHTDBW30_s 00:11–01:03]. See the retargeting row in §8.

**How Meta's delivery works** (so the creative rules make sense) [x1b4h42HTG8 01:51–05:41]: *Andromeda* retrieves candidate ads from millions; *GEM* predicts what this user will act on; *Lattice* picks the final ad. Retrieval works on what the creative shows and says. That's why diversity and creative-as-targeting matter more than any audience setting, and why a higher AOV (bundles) lets you outbid competitors in the auction.
- Test copy using the **5 primary texts / 5 headlines** inside each ad, not by duplicating ads [13s-G9Uj51A 12:41].

**Later additions, in order, as spend grows:**
1. **DPA CBO**, segmented by product set (Best Sellers / New Arrivals / category). Show `product.name` + `product.price` in the headline. Never one "all products" DPA [10eQ39SCRN4 13:35–16:23, WpsFxcqNQrg 06:35].
2. **AOV-split campaigns** once the catalog spans wide price points. Meta overspends on cheap low-CPA items when they share a CBO with expensive ones [WpsFxcqNQrg 02:50, 15Sgh3-xjRk 07:23].
3. **Winners/scaling campaign** using **Post IDs**, so likes and comments carry over [WpsFxcqNQrg 08:11, yvfub6Wgr3Q 17:50].
4. Small customer-retention ABO at **5–8% of budget**. Email/SMS does the rest [WpsFxcqNQrg 09:14–10:38].

**Retargeting is built in.** In one broad campaign Ben Heath showed, Meta spent about 40% of the budget on warm visitors and existing customers. That warm spend produced 55% of the purchases, at roughly half the cold CPA [YZ_zNzXHOio 00:51–02:28]. So:
- Map **Audience segments** under Advertising settings: *Engaged* = site visitors 180d, IG/FB engagers 365d, email list; *Existing customers* = Shopify buyer list plus pixel purchasers 180d. Then check *Breakdown → Audience segments* weekly to see the new-vs-warm split [YZ_zNzXHOio 03:10–04:22].
- Upload the Shopify customer CSV regularly. It goes past the pixel's 180-day memory [YZ_zNzXHOio 05:14].
- Write cold-ad creative that also makes sense to warm viewers. Never "thanks for visiting yesterday" in the main campaign [YZ_zNzXHOio 09:33].
- Build a separate warm-only ad set **only** for VIP/insider offers. Use "Further limit reach", and leave **"Use as a suggestion" unchecked**, or Meta expands to cold traffic anyway [YZ_zNzXHOio 11:44–13:08].

---

## 3. Testing system
- **Ratio:** 80% brand-new concepts, 20% variations of winners (the pre-Andromeda ratio, flipped) [z4UAXut0kCA 00:48]. "Volume" means net-new concepts, not 50 cuts of one UGC video. Meta gives each ad a similarity score and groups look-alikes into one asset [QoGFOGEqijw 01:44, MzjvY4O9r-Q 13:21].
- **Diversity matrix:** Personas × Angles × Formats. Example: 3 personas (quality seeker, identity buyer, occasion/gift) × 3 angles × 8 formats (iPhone try-on, hi-fi static, lo-fi static, meme, founder-led, street interview, GRWM, how-to) = 72 distinct creatives. Brand values stay fixed; only the "outfits" change [MzjvY4O9r-Q 10:03–17:47].
- **Two diversity axes:** *horizontal* (format, visual style, people pictured) and *vertical* (problem-aware → solution-aware → offer-aware creative) [O8Doria9dic 05:10–05:25].
- **Visual congruence:** the people in the ad must look like the buyer. 20-year-old models for a 40+ customer send the wrong signal [O8Doria9dic 12:35].
- **Research before scripting:** Reddit threads in the niche, review exports, and post-purchase surveys. Separate what you know from what you assume [QoGFOGEqijw 04:55–05:39].
- **Variation rule:** each variant differs by **≥20%** (headline, layout, format, hook). Near-identical ads get deduplicated by Andromeda and receive $0 [mYtqeeW7NiU 09:28, 10eQ39SCRN4 20:40].
- **Concept rule:** 3–5 concepts per test CBO, 2–5 ads per concept [z4UAXut0kCA 04:06]. Keep images and videos in **separate** CBOs, because video eats the budget [z4UAXut0kCA 04:28].
- **Cadence:** launch new concept ad sets **once a week, same day (Monday)**, scheduled for midnight or 6am so the first day is full [mYtqeeW7NiU 16:05, s1wGNE_2TX4 03:59].
- **Hands off:** no edits for 72h minimum, ideally 7 days for a fresh launch [xZAJ9JBByxo 16:30, daWXtGJmgls 16:05].
- **Minor-variation tests** (hooks, text overlays, price banner, B&W vs colour): use Meta's ad-level **Creative testing** tool (2–5 versions, 7 days, comparison metric set to **cost per purchase**, not the default engagement metric) [onFwSud9C2Y 03:25–04:57].
- **Small-budget override (<$100/day):** test 10–16 ads. Manually switch off each ad at **1,000–3,000 impressions** so every ad gets a fair sample, then keep the top 2–5 [rBD9xJswb5k 07:30–11:15].
- Zero-spend ads that you believe in → relaunch them together in a "zombie" ad set [NTmWqnPIb2s 06:54].
- **Statics validate the message, video scales it:** test each messaging pillar with cheap statics first. Only pillars that win get video, usually full-body clips of the garment being put on and worn. Chest-up talking heads don't sell wearables [aCkulCPAYzw 09:40–10:40, 33:40].
- **Breakout signal:** if Meta pushes **$2k+ into one ad in 4–5 days**, treat it as a breakout even if its in-platform ROAS looks soft, and judge it on account MER and new-customer CAC [aCkulCPAYzw 19:15–19:53]. (Scale this threshold to budget: at $100/day, read it as an ad taking >50% of spend for 4–5 days.)
- **Micro-budget signal ($10–30/day):** purchases are too few for CPA to mean anything. Rank ads on **CPM <$25, CPC <$1, cost per Add to Cart <$15** held for 3 days [YzTg8c5DnWI 11:48–12:51].

---

## 4. Scaling and kill rules
**Phase 1: new account, under ~50 purchases a week (weekly cadence).** Small accounts suffer most from "helicopter parenting": every edit resets learning [XLagiyzYYpE 01:32–04:03].
- **Monday only:** log last week, kill clear losers, and run the budget rule:
  - 3-day *and* 7-day ROAS ≥ target → **+20%**.
  - 3-day below but 7-day ≥ target → **hold** and launch new creative.
  - Both below → **−20%**, never under the hard floor [rnqKfnElMaM 11:16–15:43].
- **Thursday:** launch **3 high-conviction concepts**, each researched in organic feeds, mapped to a persona, awareness level and objection, and logged in the ad tracker [rnqKfnElMaM 01:10, 07:34, 11:50].
- Before calling A beats B, check a significance calculator for **~90% confidence** [XLagiyzYYpE 05:11].
- Don't kill a high-CPA **top-of-funnel** ad just for its own CPA if the cheap testimonial/BOF ads in the same ad set depend on it. Check the ad set total before and after [13s-G9Uj51A 18:00–18:31].

**Phase 2: 50+ purchases a week (daily cadence).** Each morning, read the **last 3 complete days** (Monday reads Fri–Sun). Never act on one day or on intraday numbers [66GBrizQebM 09:45–12:25].

| 3-day avg ROAS vs break-even | Action |
|---|---|
| ≥ BE ROAS | **+5% CBO budget** ($100/day → $432/day in 30 days) [66GBrizQebM 10:05, 14:19] |
| slightly below | hold |
| below for 3 consecutive days | check stock-outs → check fatigue → −5%, or pause the fatigued ad set and add a fresh concept [66GBrizQebM 13:52–15:23] |

**Ad-level kill rules:**
- Spent **3× target CPA** with ROAS below target → kill [WpsFxcqNQrg 12:25].
- Live 14–30 days and spent **<$10** → it lost the auction, so archive it [WpsFxcqNQrg 12:40].
- Ignore CTR and CPM as kill criteria. Purchases decide [daWXtGJmgls 18:41]. Read order: **CPA first** (against LTV), then CTR, then CPM. Hook rate is a soft metric, judged against the account's own average, not a universal benchmark [QoGFOGEqijw 07:29–08:24]. Exception: on small-budget tests, CTR (≥6% "all" is healthy) and CPM help rank the ads [rBD9xJswb5k 08:18–09:18].
- Bid caps and cost caps stay off for a new account. Bid caps are an advanced scaling tool only (see contradictions).

---

## 5. Creative system
**Creative is the targeting.** Meta reads the words, the people pictured, the setting and the style to pick the audience [daWXtGJmgls 03:19, WpsFxcqNQrg 16:06]. Sanity check: show the ad image to Claude and ask "Who will Meta target with this?" [WpsFxcqNQrg 16:29].

**Proven apparel concepts (rotate across ad sets):**
- Flat lay / "clothes on the ground": surprisingly strong [15Sgh3-xjRk 40:01, WpsFxcqNQrg 26:45]
- Us vs Them comparison against a premium incumbent [10eQ39SCRN4 08:20]
- Founder story, 45–60s [W-QZGhQWrP0 18:38]
- UGC try-on with height/weight/size callout [kMlgNR-0djA 51:10]
- Split screen: full outfit + detail close-up [WpsFxcqNQrg 18:31]
- Grid: multiple outfits, or 3 products + 1 model [mYtqeeW7NiU 17:09]
- Offer-led: Buy 2 Get 1, 4-for-$88 bundles [mYtqeeW7NiU 04:34, NzcjnNbjoZY 06:45]
- Style call-out: "How to dress [style]" [15Sgh3-xjRk 20:45]
- Proof/torture test: wash durability, stretch, "100 washes, 1 shape" [mYtqeeW7NiU 03:05]
- **Existing organic post** with high engagement (Use existing post), so the social proof travels with the ad [s1wGNE_2TX4 09:31, -h9OK0iuyWs 13:43]
- Angle lenses: **4F** (Fit, Fabric, Function, Fashion), Body-identity archetype, Moment + Motion, Cost-per-wear [mYtqeeW7NiU 03:05–04:53]

**Angle → hooks (the hierarchy):**
- An **angle** = the desire activated + the pain/benefit amplified + the motivation tied to the product. A **hook** = the first 3 seconds that opens that angle. Write at least 3 hooks per angle (POV, demonstration, problem/solution). A healthy test win rate is >30% [fvO-wSLXck4 04:55–09:15, 00:51].
- A hook has **4 layers that all fire in second zero**: on-screen text, sound, visual action, overall vibe. Stacking 2–3 hooks is allowed. Put the explosive visual just *after* the opening line [t-Xf12o4jt4 03:09–05:04, I8tXqqfjIX4 00:46].
- **Hook library for apparel** [t-Xf12o4jt4, I8tXqqfjIX4]:
  - *Investment:* "I spent $650 on jeans that shrank after 2 washes before I found these". Mine reviews for what customers tried before you.
  - *POV: you hate…:* "POV: you hate linen shirts because they wrinkle the second you sit". POV appears in 10–15% of top ads.
  - *If you…:* persona self-selection.
  - *How do I pick…:* "How do I pick the right fit for my body type". One stayed a top performer for 6 months.
  - *Why is it important that your [garment] is [organic/heavyweight]:* (Pact).
  - *Why did no one tell me…*
  - *"You're welcome"*
  - Founder intro with **name + title on screen**, which beats the same intro without them.
- Test **3–6 structurally different hooks per winning body**, never one-word tweaks [I8tXqqfjIX4 09:34].
- UGC creators should be filmed **mid-action** (throwing on the jacket on the way out), not seated at a ring light [t-Xf12o4jt4 09:25].
- Run creator and founder content as **Partnership ads** (ad-level toggle → identity) [t-Xf12o4jt4 08:43–09:13].

**UGC and creator partnerships:**
- **Briefs** [oBzZFFBwVC0 06:12–13:45]:
  - Include 2–3 reference ads, product pain points and benefits from reviews, and brand values.
  - Leave out shot-by-shot manuals and verbatim AI scripts, which sound robotic.
  - Vet creators' organic content first.
  - Contract: usage rights, 1–2 minor revision rounds, watermarked drafts until paid.
- **Shape of a UGC ad:** on-camera, front-facing open that states the point in 0–3s. Information + emotion ("this solves X, and I love it because Y"). Cut every 1–3s, 30–60s total [oBzZFFBwVC0 16:25–18:44].
- **Buy modular:** 4 hooks × 2 bodies × 2 CTAs = 16 ads from one shoot. A 20-clip "hook bank" costs about the same as one video [oBzZFFBwVC0 19:50–20:25].
- **Rates:** $80–350 per video ($200 for an experienced creator), $400–800 for raw B-roll banks [oBzZFFBwVC0 09:25–10:58]. Retained winners get $500–1,500/month for one video a week plus a performance bonus. Unproven micro-creators: ≤$100–200 for access [vCR6t4gyEW8 03:21, 11:53].
- **Pipeline:**
  1. Run UGC from the brand account.
  2. Winner → ask the creator for partnership access (gifted 30-day access, via Leadsie).
  3. Partnership ad with **Dynamic identity**, tested 5–7 days, with 3 cuts per creator asset.
  4. If it lifts → 1–3 month contract [q_PsIjZl6e4 09:28–09:59, vCR6t4gyEW8 05:44–09:37].
- Only polished studio work runs on the brand page. Creator handles carry raw, mobile-shot content [q_PsIjZl6e4 07:50].
- **Competitor research:** Ads Library ads that have been **active 6+ months** are the proven ones [XLagiyzYYpE 13:39, B7z0vcKS67k 02:14]. Use them for structure (format, pacing, hook type), never to clone the visuals or copy (§10).
- **Iteration trigger:** any ad over **5% of spend** at or above target ROAS gets 2 new variations [B7z0vcKS67k 09:29, 11:29].

**Copy rules (pooled):**
- Hook in the first 3 seconds: *Pattern interrupt + identity signal + curiosity gap* [dK4kMQnaM5g 09:50].
- 3-second retention: <20% is average, 30–40% good, >50% outlier [dK4kMQnaM5g 05:20].
- Use the customer's verbatim words from reviews, DMs and comments ("This hoodie made me late to work and I regret nothing") [dK4kMQnaM5g 06:07].
- Under 125 words, line breaks, no exclamation marks, no opening question, one clear CTA [dK4kMQnaM5g 02:34].
- Match copy to awareness stage: identity/problem hooks for cold traffic, a hard offer only for Most-Aware/retargeting. Scaling warm-audience creative into cold traffic makes CAC explode [Ng-tbllMb8g 01:53–05:21].
- Message match: the ad headline is mirrored on the landing page (+15–20% CVR claimed) [NTmWqnPIb2s 12:25].
- **Scarcity must be true.** Real limits (numbered runs, drop dates, "no restock" when it really won't restock) are strong. Invented ones ("website shutting down in 24 hours") are deceptive, risk Meta ad-policy rejections and FTC trouble, and burn trust. I won't write them [fSGnE6-yM4A 05:08 uses them; rejected].

**Production:**
- 2 video bodies × 10 hooks = 20 variants without 20 shoots [onFwSud9C2Y 11:18].
- Statics are cheap volume [NTmWqnPIb2s 00:06].
- **Photo quality bar:** flat lays with no wrinkles, shadows or hangers. The background contrasts with the garment, never the same colour. Leave space for the CTA so it isn't cropped [kfE5jYBymBI 03:54–08:44]. References for the standard: Ditch, YoungLA.
- AI lifestyle shoots: Claude + Higgsfield + Shopify via MCP. **Quality gate:** an AI image ships only if the garment, print and fit are indistinguishable from the real product. Visibly AI "slop" gets penalized and erodes trust [kfE5jYBymBI 08:26].
  - **Consistency locks** for multi-image sets [GumUlP6UiSU 04:55–10:12]:
    - a *Subject lock* (the same model description) and a *Wardrobe lock* ("wearing the garment in image 2") repeated in every prompt
    - small details (zip pull, label, boots) passed as a **separate reference image**
    - an 8-pose set: relaxed ×2, dynamic, seated, profile, hands-on-garment, cropped, editorial
  - **Honesty rule:** live product pages and ads show only garments that physically exist and match the render. Pre-sample renders are only for concept testing or clearly labelled pre-orders. Outputs go to Shopify **Files** for human review, never straight onto live products [sOAYhPaLnZ4 06:29–11:49]. *(Jac already has the Higgsfield and Shopify connectors.)*
- Creative research: Meta Ads Library sorted by **highest impressions**, a burner IG account following 10–15 competitors [15Sgh3-xjRk 19:12, rhP-S30Rmqo 06:57].

---

## 6. Offer and retention levers
- **Value-stacked first-order offer** (new customers only), instead of site-wide 30–50% sales: e.g. a $139 retail product at $69 + free shipping + a free bonus item. Built in an offer calculator so order #1 still clears about $15 profit after CAC; the profit then comes from $100–150 of repeat spend through 7-day email/SMS flows [XSLffs4nGmw 10:13–12:08]. Repeated deep sales are what pushed that client from $1.5M down to $1M a year [XSLffs4nGmw 01:27, 03:22].
- Prefer bundles and gifts over flat discounts. Flat 20% off is risky (needs about +470% volume to break even). Buy 2 Get 1, Buy 3 Get 1, BOGO 50% and gift-with-purchase are safe [Ng-tbllMb8g 13:47–14:14].
- Pricing table: single (strikethrough) / 2-pack "Most popular" + free shipping / 3-pack [kMlgNR-0djA 39:58].
- Price objections → run a value-justification campaign (2 IG posts + 1 email + 1 ad + 1 PDP update) instead of discounting [XFahxHZUS_c 20:30].
- Give the fabric a proprietary name to justify a premium price (e.g. Lunaluxe™) [W-QZGhQWrP0 11:13].
- Capture pop-up at 1–3s: **email first, phone second** [kMlgNR-0djA 40:56–41:14]. Early-access-to-drop beats a discount [W-QZGhQWrP0 17:21].
- Drop ritual: Day −3 teaser → Day −1 reveal Reel → Drop-day "It's live" story [W-QZGhQWrP0 17:59].
- Post-purchase: ask buyers to tag the brand in the confirmation email, and run a 3-email second-purchase sequence within 45 days [rhP-S30Rmqo 04:37, NzcjnNbjoZY 17:01].
- Health benchmarks: MER 3–5× healthy, repeat rate ≥20% at 30 days, 4% site CVR as an aspirational target [NzcjnNbjoZY 16:05–17:34, W-QZGhQWrP0 18:35].

**Returns and fit (profit lives after the return window)** [x9colvKlmhc, a low-authority source citing third-party stats]:
- Apparel returns commonly run **40%+**, and processing can cost up to 66% of the item price. Judge ROAS on **net sales after returns**.
- Add **fit notes** on every PDP ("runs small, size up", "oversized cut", "stretch fabric"), sizing videos, and review-based fit insight.
- Analyse returns per SKU to catch bad materials or suppliers. Watch for **bracketing** (several sizes ordered, one kept).
- **Never scale a garment until a physical sample is fit-verified.** A fit problem at scale becomes a mass-return event.
- *(Still wanted: a stronger source with real apparel return data.)*

**Retention before scale** [i5EdMV0g-2s]: Perfect White Tee lifted LTV about 60–70% through segmented Klaviyo flows, list hygiene (bots hitting the loyalty sign-up wrecked deliverability) and "reply-to-buy" SMS, and only *then* raised Meta spend. Their full-price months beat Black Friday on profit [i5EdMV0g-2s 02:30–13:58]. Verbal claims only; no dashboards shown.

**TikTok as a second channel and UGC engine** [ijeGs0XCwso, Oh4kY-GykvM]:
- TikTok Shop + affiliates = a creator army whose videos feed Meta Partnership ads. Vet creators on post rate >70% and real shoppable-video revenue. Import reviews to the TikTok listing before outreach. Move any video with a strong GMV-per-view to Meta.
- Organic recipe: batch 21 clips of 5–10 seconds in one hour, post 3 a day, 9 relatable niche/"inside joke" posts for every 1 product post. Low-fi beats polished [Oh4kY-GykvM 03:44–07:23].

**Drops** [hRWOsZbsCD0, 8tMm_XZA0HU]:
- Content mix: 70% identity/value, 30% product. Four content types: studio, lifestyle, UGC on bodies, macro product details.
- Build hype for 2–4 weeks, because people need 4–5 exposures before they buy.
- All traffic goes to the VIP SMS/email list. Subscribers convert 10–20× better than followers.
- Drop on **Friday**: reminder on Wednesday, then "live in 30 min" to the VIP list.
- First run: **50 pieces** pre-made. Get the factory's price breaks at 100/150 first so a sell-out can restock fast. Reinvest in the winner instead of jumping to a new design.

**Pre-orders** [yny_Z-Zec0U]:
- Full price, never discounted.
- Title format: `(Pre-Order 6 Weeks) Product – Colour`.
- A bold note at the top of the description: mixed orders ship in **one package** by [date].
- Size-level inventory set to the factory order quantities.
- A pre-order email flow with weekly updates.
- A ShipStation/Shopify hold on pre-order items.

**Retention stack (Klaviyo)** [pjkqcWoN0NA, ikRu6fsPfA8]:
- Six core flows: Welcome, Site abandon (3h), Browse abandon (1h), Cart/Checkout abandon (30 min), Post-purchase, Winback (people who bought exactly 90 days ago).
- Welcome is 4 emails, a day apart: discount → story → 48h expiry + proof → a **plain-text note from the founder**.
- **Smart Sending OFF** on flows.
- Abandon emails link to `{{ event.URL }}`, and checkout abandon links to `/cart`.
- Pop-up:
  - Fires at **6s**. No exit-intent on mobile. Separate mobile and desktop forms.
  - A one-tap quiz step first ("Shopping for?") that tags the profile, then email, then SMS.
  - "Claim now" beats "Continue".
  - Dollar-off when AOV is over $100, percent-off when under.
  - Benchmark: 10%+ submit rate; the best are ~28%.
  - **Rejected:** hidden or see-through close buttons and guilt-trip "No thanks, I'll pay full price" opt-outs. These are dark patterns that cost trust; use a clear close button and a neutral "No thanks".

---

## 7. Claude operating system (how I'll run this)
- **Brand Project + skill stack:** a voice skill (Voice / Customer psychology / Constraints layers) plus separate skills for ad creative, PDP copy and CS. Test each one in a clean chat against conflicting prompts [BlgL9d_8ym4 03:28–14:48].
- **Avatar first:** SA → US → FPH (Struggling Avatar → Unique Solution → Future-Paced Hero) [10eQ39SCRN4 02:10]. The psychological profile covers identity, real purchase motive, hidden fear, exact language, and the competitor they almost bought from [NzcjnNbjoZY 09:10].
- **Hook factory:** 10 hooks → rewrite "like a friend texting" → identity filter → one-job constraint → cold/retarget/past-buyer versions [dK4kMQnaM5g 09:50–10:15]. Generate identity, problem and proof variants and merge the best elements into a master ad [NzcjnNbjoZY 05:13–05:39].
- **Weekly loops:** Monday CRO report (Clarity + Shopify → Ship this week / month / quarter) [IdQF3N8Donk 10:15]. Weekly "CFO read" on 30-day numbers [NzcjnNbjoZY 14:51]. Competitor gap analysis (social / offer / content → 30-day plan) [W-QZGhQWrP0 05:29–16:55].
- **Human in the loop:** I draft; Jac approves anything that spends money or goes public.

---

## 8. Contradictions between sources (and my call)
| Topic | Position A | Position B | My call for Jac (new account) |
|---|---|---|---|
| Placements | Instagram-only for an 18–35 streetwear audience [s1wGNE_2TX4 06:20, -h9OK0iuyWs 10:50] | Advantage+ all placements [daWXtGJmgls 07:59, 10eQ39SCRN4 17:01] | Start Advantage+, then read the placement breakdown at day 7. If Facebook/Audience Network have a worse CPA, switch to IG-only. *Data decides.* |
| Age | 18–35 or 18–28 [s1wGNE_2TX4 05:19] | 18–65+, let creative target [z4UAXut0kCA 07:13] | 18–65+ broad, because creative targets. Narrow only if the audience breakdown proves waste. |
| Budget step | +5%/day on a 3-day avg [66GBrizQebM] | +20–30% every 2–3 days, double at 2× target [15Sgh3-xjRk 13:24] · ≤33%/day [-h9OK0iuyWs 10:07] | **+5%/day**: the most conservative rule, it compounds, and it protects inventory |
| Bid controls | Never cap [10eQ39SCRN4, xZAJ9JBByxo 17:49] | Scale winners in a Bid Cap campaign, bid = AOV ÷ target ROAS [15Sgh3-xjRk 09:35] · caps over 20–30 ad CBOs [O8Doria9dic 02:30] | Off until $300+/day with proven winners |
| Test and scale together? | One CBO does both [66GBrizQebM, 10eQ39SCRN4] | Separate testing campaign, or winners eat the new ads' spend [QoGFOGEqijw 03:10, Antonio Ventre/Skaleit structure 4] | One CBO at launch (not enough budget to split). Add a separate test campaign once a proven winner takes >70% of spend |
| CBO vs ABO | CBO always; ABO is "inefficient" under $300/day [daWXtGJmgls 04:52] | ABO for testing so every set gets spend [fSGnE6-yM4A 01:10, kfE5jYBymBI 09:54] | CBO, using the forced-impression method [rBD9xJswb5k] when fair tests matter |
| Bid strategy | Highest volume [most] | Test "Highest value" for higher-AOV buyers [fSGnE6-yM4A 02:40] | Highest volume first. Test Highest value once there are 50+ purchases/week |
| Retargeting | Built into broad campaigns; separate only for VIP offers [YZ_zNzXHOio] · 5–8% retention ABO [WpsFxcqNQrg] | Prospecting excludes warm audiences, plus a separate retargeting campaign at frequency 5–8/week [NTx5NxEfAqc 08:03, 18:08] · **Meta's official advice:** exclude existing customers for net-new acquisition [-JHTDBW30_s 00:27] | Hybrid by default (primary data, no self-bidding). **Exclude existing customers during drops and peaks**, when the goal is new buyers and email/SMS reaches past buyers for free. Check *Breakdown → Audience segments* weekly; if more than ~30% of spend goes to existing customers, add the exclusion |
| Funnel split | No funnel campaigns; Meta sequences on its own [10eQ39SCRN4, 13s-G9Uj51A] | Creative mix ~70–75% cold/entry, 10–15% social proof, ~5% hard CTA [XSLffs4nGmw 13:06] | Both hold: one campaign, but write the **creative mix** in roughly those proportions so Meta has an ad for every stage |
| Minimum budget | $50/day floor [z4UAXut0kCA, jW1TLgpzrLA] | $10–20/day Advantage+ test, judged on CPM/CPC/ATC [YzTg8c5DnWI] | $50 if cash allows. If not, run the $10–20 micro-test on proxy metrics, but don't scale until purchases are real |
| Advantage+ Sales vs manual | Advantage+ Sales from day 1 [YzTg8c5DnWI] | New pixel: run manual Sales first to feed the pixel, then switch [NTx5NxEfAqc 16:30] | Manual CBO first. Consider Advantage+ Sales after ~50 purchases |
| Attribution | 7d click / 1d view, *not* engaged view [kfE5jYBymBI 11:39] | Keep the default including engaged view; changing it hides data [NTx5NxEfAqc 05:10] | Optimize on 7d click / 1d view. Add a reporting column with engaged view for comparison |
| Ad destination | The product page itself [s1wGNE_2TX4, -h9OK0iuyWs] | A shoppable listicle or advertorial matched to the hook [aCkulCPAYzw 12:35] | PDP for product-led ads. Test a listicle only once a pillar is proven (fits ADVT's landing-page test, rBD9xJswb5k 15:00) |
| Ad sets at launch | One ad set per concept [66GBrizQebM, z4UAXut0kCA, mYtqeeW7NiU] | 1 campaign / 1 ad set / many ads [XLagiyzYYpE, 13s-G9Uj51A] | **1 ad set** below ~50 purchases/week (concepts tracked by ad name); split by concept above that. *(Changed in v4.)* |
| Edit cadence | Daily +5% on a 3-day average [66GBrizQebM] | No edits for 7–10 days on small budgets [XLagiyzYYpE] · weekly ±20% with a 3d/7d check [rnqKfnElMaM] | Weekly (Monday) ±20% in phase 1; daily +5% in phase 2 |
| Creative volume per week | Volume and diversity, 20–72 ads [MzjvY4O9r-Q, 13s-G9Uj51A] | 3 high-conviction concepts/week [rnqKfnElMaM] | 3 new concepts/week, each in 2–3 executions. Diversity comes from the concepts, volume from the executions |
| Organic promo ratio | 70% value / 30% product [8tMm_XZA0HU] | 98% value / 2% promo, soft CTAs [8TlUoRBmVJY] | Organic feed ~80/20 with soft CTAs; paid ads can sell directly |
| Pre-made vs pre-order | Pre-made for new brands; people expect 3–5 day shipping [hRWOsZbsCD0 00:44] | Full-price pre-orders fund inventory [yny_Z-Zec0U] | First drop pre-made (50 pcs). Restocks of proven sell-outs as full-price pre-orders |
| Interest ad set | 60/25/15 split broad / interests / retargeting [xZAJ9JBByxo 15:39] | Zero interests and zero retargeting [10eQ39SCRN4, 15Sgh3-xjRk] | Broad only. BitBranding's own newer videos dropped the interest set. |
| Creative volume | 15–60 ads per ad set [WpsFxcqNQrg 03:41, 15Sgh3-xjRk 06:35] | 10–16 with forced spend on small budgets [rBD9xJswb5k] | Size the volume to budget: $10 per ad, and use rBD9xJswb5k's method under $100/day |
| Paid ads at all? | Clipper army instead of Meta ads [kMlgNR-0djA] | Meta is the scaling channel (everyone else) | Meta as the scaling channel. Organic and clipping feed it proven creative and social proof. |
| COE scale direction | 10 = no friction [Ng-tbllMb8g 15:32] | 1 = best [XFahxHZUS_c 04:32] | Use 10 = good for every variable and invert the denominators; that keeps the 0–100 formula consistent |

---

## 10. Never-do list (tactics found in the training videos and rejected)
These came up in sources I studied. I won't use them on Jac's account, whatever a video claims:
| Tactic | Source | Why it's out |
|---|---|---|
| Fake scarcity ("website shutting down in 24h", fake countdown timers, "only 3 left") | fSGnE6-yM4A 05:08; also condemned by A-7pTamjBIw 03:19 | Deceptive. Meta ad-policy and FTC risk, and it destroys repeat-customer trust |
| Hidden or see-through pop-up close button; guilt-trip opt-outs | ikRu6fsPfA8 14:00–14:47 | Dark pattern. Accessibility and intrusive-pop-up problems, and it costs brand trust |
| **Unpacked Chrome extension that "raises your spending limit"** | G5hAorYVS5M | It injects code into Meta Billing, which is exactly how ad-account takeovers happen. Spending limits rise on their own with clean payment history and spend; otherwise ask through Meta Business Support |
| Fake persona or "editorial review" pages to disguise brand ads | q_PsIjZl6e4 08:29–08:54 | Breaks Meta's authenticity rules and the FTC endorsement guides. Use real creators via Partnership ads (both names are shown) |
| Getting around "PROTECTED" watermarks, or cloning competitor ads with your product swapped in | B7z0vcKS67k 01:25, 03:00 | Copyright and trade-dress risk. Model the structure, never the assets |
| AI avatars or voices posing as real customers giving testimonials | warned in oBzZFFBwVC0 26:12 | A fake endorsement under FTC rules. AI is fine for product visuals, never as a fake reviewer |
| Selling from AI renders of a garment that doesn't exist yet, without saying so | (inferred risk from GumUlP6UiSU) | Misrepresentation. Label it as a pre-order or concept, and match it to the real sample |
| "Identity resolution" scripts that grab emails from shoppers who never submitted a form, then email them | XSLffs4nGmw 17:37 (Retention.com) | **Not without a legal and consent review** (CAN-SPAM/CASL, state privacy laws, Klaviyo terms). Default: only email people who opted in |
| Optimizing for link clicks or landing-page views to "fix" CPM or frequency | warned in XSLffs4nGmw 14:52 | Meta then finds clickers, not buyers. Always optimize for Purchase |

## 11. Day-0 launch checklist for Jac
1. [ ] Share brand basics: name, URL, hero product(s), price, COGS, shipping cost, fulfillment time.
2. [ ] Business Manager: Page + IG + Ad account + Dataset cross-assigned. Payment method added.
3. [ ] Shopify FB & IG app → data sharing **Maximum** → confirm the Pixel ID matches. Fire a test purchase.
4. [ ] Calculate break-even ROAS. Run the COE audit. Fix the top friction item.
5. [ ] Install Microsoft Clarity (48h warm-up) for the weekly CRO loop.
5b. [ ] Klaviyo: pop-up (6s, quiz → email → SMS) plus the 6 core flows, with Smart Sending off. Upload the customer list to Meta and map Audience Segments.
5c. [ ] PDP pass on the hero product: model size line, size-guide pop-up, BNPL under price, answers to objections under the button, first 20 reviews.
6. [ ] Build the avatar and brand-voice skill. Produce 3 concepts × 3 ads (≥20% different).
7. [ ] Launch **one Sales campaign with one ad set** ($50–90/day, 6–10 diverse ads named by concept) at midnight: Purchase, Advantage+ audience, enhancements off.
8. [ ] Leave it alone for 7 days. Then run the phase-1 weekly cadence (Monday decisions ±20%, Thursday launches of 3 concepts) until ~50 purchases a week, then phase 2 (daily 3-day read, +5%).
9. [ ] From week 2: brief 2–3 UGC creators (modular 4×2×2 packs), and move winners to Partnership ads.

## 9. Source reliability notes
- Strongest evidence (live Ads Manager numbers shown): 66GBrizQebM ($150k/30d, $29.97 CPA), 10eQ39SCRN4 ($1.44M/yr Shopify), WpsFxcqNQrg ($77k → $491k), 15Sgh3-xjRk ($377k/30d at 3.34), mYtqeeW7NiU ($148k/mo).
- Claims with no account data shown, treated as hypotheses:
  - MzjvY4O9r-Q's "7.3× lower CPA": quoted as a Meta stat on a text slide; the full-model re-watch confirms no account data.
  - dK4kMQnaM5g's "AI beat humans": the dashboard doesn't split AI and human ads.
  - aCkulCPAYzw (Motion summit): no dashboards shown.
  - fvO-wSLXck4: a concept talk only.
- Strong primary data added in v3: YZ_zNzXHOio's audience-segment breakdown ($79k spend; warm CPA $60 vs cold $114).
- BitBranding is 16 of 33 sources, so the consensus leans its way. Ben Heath, Antonio Ventre/Skaleit, Fraser Cottrell and Manel Gomez are the independent cross-checks.

## Open gaps (next study round)
- ✅ Closed in v3: hooks, the Motion creative-testing framework, drops and pre-orders, Klaviyo flows and pop-ups, Advantage+ Sales vs manual, retargeting.
- ✅ Closed in v4: pixel/CAPI verification and EMQ, small-budget structure, Advantage+ audience, Claude + Ads Library, Shopify CRO, the operator cadence (Jar Builds), the organic flywheel, UGC briefs, partnership ads, and the AI shoot workflow. All 11 Lite notes were re-watched with the full model. The two Lite notes v2 had used (MzjvY4O9r-Q, kfE5jYBymBI) were confirmed: same numbers, and the 7.3× claim is still unbacked by account data.
- ❌ Spending limits: the only video found (G5hAorYVS5M) was a suspicious extension, now on the Never-do list. Still open: the legitimate new-account limit and warm-up path.
- ✅ Closed in v5: Advantage+ Sales (official plus practitioner), Andromeda/GEM mechanics, TikTok, returns (provisional), retention-before-scale.
- ❌ Gemini had no access (403): a6-l6BD3dDg and bv8AsY0xkIk (Ben Heath), xl5a--Wuask (Marshall Crews). x1b4h42HTG8 was queued as Dara Denney, but the note names Savannah Sanchez on screen; the content is consistent with the topic, but treat its attribution as uncertain.
- Still uncovered: sizing and returns reduction from a credible source, and Meta's own Advantage+ Sales documentation.
