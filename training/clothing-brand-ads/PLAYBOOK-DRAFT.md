# Clothing Brand Meta Ads Playbook (DRAFT v1)

Synthesis of 27 studied videos (notes in `notes/<id>.md`, cited as `[id mm:ss]`).
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
2. **Unit economics known.** Break-even ROAS = price ÷ (price − COGS − shipping − fees − returns buffer). Worked example: $65 tee − $30 hard costs → $35 margin → **BE ROAS 1.86** [66GBrizQebM 03:26–04:36]. Target ~2.0+ for safety [daWXtGJmgls 18:21].
3. **The offer passes the COE audit.** Score = (Style Aspiration × Quality/Fit confidence) ÷ (Wait time + Shopping friction + Price sensitivity). Fix the biggest denominator first. Scale only when the offer is strong [XFahxHZUS_c 01:46–07:41, Ng-tbllMb8g 15:11].
   - Fulfillment >5 business days → wait-time problem. Repeat rate <20% → fit/trust problem. >50% of orders on a code → price-sensitivity problem [XFahxHZUS_c 05:51, 21:16].
4. **The store converts cold traffic.**
   - ≤3 mobile taps from PDP to paid.
   - Product grid visible on landing, with no splash pages or autoplay.
   - Social proof near the top.
   - PDP with multiple angles, size chart, reviews, customer photos, and "complete the outfit" cross-sells [XFahxHZUS_c 05:32, kMlgNR-0djA 36:00–40:02, 15Sgh3-xjRk 03:45].
   - Funnel health: **≥10% of product views → Add to Cart**, and **≤50% drop from ATC → checkout** [rBD9xJswb5k 24:18–24:50].
5. **The Instagram profile can close the sale.** Cold traffic checks the profile. Five highlights: About/Mission, Latest Drop, Customer Reviews, Shipping Proof, FAQ [rhP-S30Rmqo 03:13–05:30].

---

## 2. Account structure (consensus 2026, post-Andromeda)
**Consensus across BitBranding, Skaleit, Mark Builds Brands, Ben Heath, ADVT:**
- Objective **Sales**, optimizing for **Purchase**, **Highest volume** bidding.
- **Broad** targeting: country + age + gender only. No interest stacks, lookalikes or exclusions [daWXtGJmgls 06:53, 10eQ39SCRN4 22:48, 15Sgh3-xjRk 05:13, z4UAXut0kCA 02:30].
- Ad sets are organized by **creative concept**, never by audience [66GBrizQebM 07:16, mYtqeeW7NiU 01:36, z4UAXut0kCA 01:48].
- Consolidate: **one CBO** under $100/day; at most **two** above that (Prospecting CBO + category-segmented DPA CBO) [10eQ39SCRN4 11:08–11:15].
- Attribution: 7-day click / 1-day view.
- Turn **off** Advantage+ creative enhancements (music, touch-ups, text tweaks, catalog add-ons, animation) and **off** "Optimize website destination". Keep "Relevant comments" **on** [s1wGNE_2TX4 10:50–11:33, z4UAXut0kCA 08:24–09:25].
- Link to the **specific product page**, never the homepage, for product-led ads [s1wGNE_2TX4 10:16]. Lifestyle/brand ads can go to a collection [WpsFxcqNQrg 19:12].

**Starter structure for a new account (recommended for Jac):**
```
CBO | Sales | Broad | <date>           $50–90/day  (= $10 × number of ads, $50 floor)  [z4UAXut0kCA 04:58–05:31]
 ├─ Ad set: Concept A (e.g. Us vs Them)       3 ads, distinct ≥20% variations
 ├─ Ad set: Concept B (e.g. flat-lay offer)   3 ads
 └─ Ad set: Concept C (e.g. founder/UGC)      3 ads
Location US · Age 18–35* · All genders · Advantage+ placements*
```
\* See contradictions table: Instagram-only and 18–35 are the streetwear-specific override.

**Later additions, in order, as spend grows:**
1. **DPA CBO**, segmented by product set (Best Sellers / New Arrivals / category). Show `product.name` + `product.price` in the headline. Never one "all products" DPA [10eQ39SCRN4 13:35–16:23, WpsFxcqNQrg 06:35].
2. **AOV-split campaigns** once the catalog spans wide price points. Meta overspends on cheap low-CPA items when they share a CBO with expensive ones [WpsFxcqNQrg 02:50, 15Sgh3-xjRk 07:23].
3. **Winners/scaling campaign** using **Post IDs**, so likes and comments carry over [WpsFxcqNQrg 08:11, yvfub6Wgr3Q 17:50].
4. Small customer-retention ABO at **5–8% of budget**. Email/SMS does the rest [WpsFxcqNQrg 09:14–10:38].

---

## 3. Testing system
- **Ratio:** 80% brand-new concepts, 20% variations of winners (the pre-Andromeda ratio, flipped) [z4UAXut0kCA 00:48].
- **Variation rule:** each variant differs by **≥20%** (headline, layout, format, hook). Near-identical ads get deduplicated by Andromeda and receive $0 [mYtqeeW7NiU 09:28, 10eQ39SCRN4 20:40].
- **Concept rule:** 3–5 concepts per test CBO, 2–5 ads per concept [z4UAXut0kCA 04:06]. Keep images and videos in **separate** CBOs, because video eats the budget [z4UAXut0kCA 04:28].
- **Cadence:** launch new concept ad sets **once a week, same day (Monday)**, scheduled for midnight or 6am so the first day is full [mYtqeeW7NiU 16:05, s1wGNE_2TX4 03:59].
- **Hands off:** no edits for 72h minimum, ideally 7 days for a fresh launch [xZAJ9JBByxo 16:30, daWXtGJmgls 16:05].
- **Minor-variation tests** (hooks, text overlays, price banner, B&W vs colour): use Meta's ad-level **Creative testing** tool (2–5 versions, 7 days, comparison metric set to **cost per purchase**, not the default engagement metric) [onFwSud9C2Y 03:25–04:57].
- **Small-budget override (<$100/day):** test 10–16 ads. Manually switch off each ad at **1,000–3,000 impressions** so every ad gets a fair sample, then keep the top 2–5 [rBD9xJswb5k 07:30–11:15].
- Zero-spend ads that you believe in → relaunch them together in a "zombie" ad set [NTmWqnPIb2s 06:54].

---

## 4. Scaling and kill rules
**Daily routine:** each morning, read the **last 3 complete days** (Monday reads Fri–Sun). Never act on one day or on intraday numbers [66GBrizQebM 09:45–12:25].

| 3-day avg ROAS vs break-even | Action |
|---|---|
| ≥ BE ROAS | **+5% CBO budget** ($100/day → $432/day in 30 days) [66GBrizQebM 10:05, 14:19] |
| slightly below | hold |
| below for 3 consecutive days | check stock-outs → check fatigue → −5%, or pause the fatigued ad set and add a fresh concept [66GBrizQebM 13:52–15:23] |

**Ad-level kill rules:**
- Spent **3× target CPA** with ROAS below target → kill [WpsFxcqNQrg 12:25].
- Live 14–30 days and spent **<$10** → it lost the auction, so archive it [WpsFxcqNQrg 12:40].
- Ignore CTR and CPM as kill criteria. Purchases decide [daWXtGJmgls 18:41]. Exception: on small-budget tests, CTR (≥6% "all" is healthy) and CPM help rank the ads [rBD9xJswb5k 08:18–09:18].
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

**Copy rules (pooled):**
- Hook in the first 3 seconds: *Pattern interrupt + identity signal + curiosity gap* [dK4kMQnaM5g 09:50].
- 3-second retention: <20% is average, 30–40% good, >50% outlier [dK4kMQnaM5g 05:20].
- Use the customer's verbatim words from reviews, DMs and comments ("This hoodie made me late to work and I regret nothing") [dK4kMQnaM5g 06:07].
- Under 125 words, line breaks, no exclamation marks, no opening question, one clear CTA [dK4kMQnaM5g 02:34].
- Match copy to awareness stage: identity/problem hooks for cold traffic, a hard offer only for Most-Aware/retargeting. Scaling warm-audience creative into cold traffic makes CAC explode [Ng-tbllMb8g 01:53–05:21].
- Message match: the ad headline is mirrored on the landing page (+15–20% CVR claimed) [NTmWqnPIb2s 12:25].

**Production:**
- 2 video bodies × 10 hooks = 20 variants without 20 shoots [onFwSud9C2Y 11:18].
- Statics are cheap volume [NTmWqnPIb2s 00:06].
- AI lifestyle shoots: Claude + Higgsfield + Shopify via MCP. Outputs go to Shopify **Files** for human review, never straight onto live products [sOAYhPaLnZ4 06:29–11:49]. *(Jac already has the Higgsfield and Shopify connectors.)*
- Creative research: Meta Ads Library sorted by **highest impressions**, a burner IG account following 10–15 competitors [15Sgh3-xjRk 19:12, rhP-S30Rmqo 06:57].

---

## 6. Offer and retention levers
- Prefer bundles and gifts over flat discounts. Flat 20% off is risky (needs about +470% volume to break even). Buy 2 Get 1, Buy 3 Get 1, BOGO 50% and gift-with-purchase are safe [Ng-tbllMb8g 13:47–14:14].
- Pricing table: single (strikethrough) / 2-pack "Most popular" + free shipping / 3-pack [kMlgNR-0djA 39:58].
- Price objections → run a value-justification campaign (2 IG posts + 1 email + 1 ad + 1 PDP update) instead of discounting [XFahxHZUS_c 20:30].
- Give the fabric a proprietary name to justify a premium price (e.g. Lunaluxe™) [W-QZGhQWrP0 11:13].
- Capture pop-up at 1–3s: **email first, phone second** [kMlgNR-0djA 40:56–41:14]. Early-access-to-drop beats a discount [W-QZGhQWrP0 17:21].
- Drop ritual: Day −3 teaser → Day −1 reveal Reel → Drop-day "It's live" story [W-QZGhQWrP0 17:59].
- Post-purchase: ask buyers to tag the brand in the confirmation email, and run a 3-email second-purchase sequence within 45 days [rhP-S30Rmqo 04:37, NzcjnNbjoZY 17:01].
- Health benchmarks: MER 3–5× healthy, repeat rate ≥20% at 30 days, 4% site CVR as an aspirational target [NzcjnNbjoZY 16:05–17:34, W-QZGhQWrP0 18:35].

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
| Bid controls | Never cap [10eQ39SCRN4, xZAJ9JBByxo 17:49] | Scale winners in a Bid Cap campaign, bid = AOV ÷ target ROAS [15Sgh3-xjRk 09:35] | Off until $300+/day with proven winners |
| Interest ad set | 60/25/15 split broad / interests / retargeting [xZAJ9JBByxo 15:39] | Zero interests and zero retargeting [10eQ39SCRN4, 15Sgh3-xjRk] | Broad only. BitBranding's own newer videos dropped the interest set. |
| Creative volume | 15–60 ads per ad set [WpsFxcqNQrg 03:41, 15Sgh3-xjRk 06:35] | 10–16 with forced spend on small budgets [rBD9xJswb5k] | Size the volume to budget: $10 per ad, and use rBD9xJswb5k's method under $100/day |
| Paid ads at all? | Clipper army instead of Meta ads [kMlgNR-0djA] | Meta is the scaling channel (everyone else) | Meta as the scaling channel. Organic and clipping feed it proven creative and social proof. |
| COE scale direction | 10 = no friction [Ng-tbllMb8g 15:32] | 1 = best [XFahxHZUS_c 04:32] | Use 10 = good for every variable and invert the denominators; that keeps the 0–100 formula consistent |

---

## 9. Day-0 launch checklist for Jac
1. [ ] Share brand basics: name, URL, hero product(s), price, COGS, shipping cost, fulfillment time.
2. [ ] Business Manager: Page + IG + Ad account + Dataset cross-assigned. Payment method added.
3. [ ] Shopify FB & IG app → data sharing **Maximum** → confirm the Pixel ID matches. Fire a test purchase.
4. [ ] Calculate break-even ROAS. Run the COE audit. Fix the top friction item.
5. [ ] Install Microsoft Clarity (48h warm-up) for the weekly CRO loop.
6. [ ] Build the avatar and brand-voice skill. Produce 3 concepts × 3 ads (≥20% different).
7. [ ] Launch a $90/day CBO (or $50 with 5 ads) at midnight, Sales/Purchase, broad, enhancements off.
8. [ ] Leave it alone for 72h. Then run the 3-day rolling routine, +5% scaling, and weekly Monday concept launches.

## Open gaps (next study round)
- Pixel/CAPI verification and Event Match Quality targets (queued: lDG8OnKYdp4)
- Hooks deep-dive (queued: Dara Denney ×2, Tiana Asperjan)
- Creative testing framework from the Motion team (queued: aCkulCPAYzw)
- Drops and pre-orders (queued: hRWOsZbsCD0, yny_Z-Zec0U)
- Not yet covered: Klaviyo flows for apparel, sizing/returns reduction, new-account warm-up and spending limits, how Advantage+ Sales campaigns compare with manual CBO for a brand-new pixel, TikTok as a second channel.
