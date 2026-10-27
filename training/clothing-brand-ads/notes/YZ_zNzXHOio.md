---
url: https://www.youtube.com/watch?v=YZ_zNzXHOio
video_id: YZ_zNzXHOio
title: Facebook Ads Retargeting Has Completely Changed
channel: Ben Heath
why_studied: retargeting contradiction
watched_by: gemini-3.8-flash
studied_at: 2026-10-27 05:58 UTC
---

## Title & channel
- **Title:** Facebook Ads Retargeting Has Completely Changed (Do This Instead)
- **Channel:** Ben Heath ([00:00])

---

## One-line thesis
Traditional separate cold and retargeting campaigns cause auction overlap and data fragmentation; modern Meta advertising requires a consolidated "Hybrid Setup" where Meta dynamically distributes spend between cold and warm audiences within a single ad set, supported by properly mapped Audience Segments and first-party customer lists ([02:29], [07:51], [10:19]).

---

## Method (ordered, step by step)

1. **Audit Current Delivery via Audience Segments Breakdown** ([00:51]–[01:09]):
   - Navigate to Ads Manager at the Ad Set level.
   - Click the **Breakdown** dropdown button -> select **Audience segments**.
   - Review how spend and purchase volume are split between *Engaged audience*, *Existing customers*, and *New audience*.

2. **Configure Account-Level Audience Segments Definitions** ([03:10]–[04:22]):
   - If audience segments appear as "Unknown," go to Meta Ads Manager left-hand menu -> click **Advertising settings** ([03:22]).
   - Under **Shortcuts**, locate **Audience segments** ([03:25]).
   - Click **Engaged audience** -> Map custom audiences representing warm prospects who have interacted but not bought (e.g., `All website visitors - 180`, Facebook Page engagers 365, Instagram account engagers 365, Lead form openers/submitters, Video viewers 365, Email list subscribers) ([03:32]–[04:04]).
   - Click **Existing customers** -> Map customer custom audiences (e.g., `Example Customer List.csv`, Shopify purchaser imports, pixel `Website Purchasers - 180 Days`) ([04:05]–[04:19]).
   - Click **Confirm** to lock in definitions for all Sales campaigns across the account ([04:20]).

3. **Upload External First-Party Customer Lists Regularly** ([05:14]–[05:56]):
   - Export full customer lists (email, name, phone, purchase data) from Shopify/CRM into a CSV format ([05:42]).
   - In Meta Ads Manager -> Audiences -> **Create Audience** -> **Custom Audience** -> **Customer list** ([05:22], [05:46]).
   - Map identifiers (Email, First Name, Phone Number, etc.) and click **Import and create** ([05:47]–[05:54]).
   - This bypasses Meta pixel cookie retention caps (e.g., 180-day website limits) and trains Meta's algorithm on all historical buyers ([05:35]–[06:09]).

4. **Ensure Baseline Tracking Infrastructure is Active** ([06:11]–[06:38]):
   - Maintain the Meta Pixel and Conversions API with all standard e-commerce events (`ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) active ([06:18]–[06:35]).

5. **Deploy the Consolidated "Hybrid Setup" as Primary Structure** ([07:51]–[09:40]):
   - Build a single consolidated Sales campaign and ad set using broad/Advantage+ audience controls ([08:46]–[09:05]).
   - Rely on Meta's algorithm to reallocate budget between cold prospecting and retargeting based on real-time propensity to convert ([09:44]–[10:28]).

6. **Deploy a Restricted "Hard Constraint" Retargeting Ad Set Only for Specific Edge Cases** ([11:35]–[13:34]):
   - Use only if offering an exclusive customer VIP discount, a specific middle-funnel ascension offer, or hyper-tailored messaging that cold audiences must not see ([11:44]–[12:07]).
   - Go to Ad Set -> Audience section -> Click **Further limit the reach of your ads** (gear icon) ([12:17]).
   - Accept the popup warning ("Limiting your audience may reduce performance... Potential outcome: Up to 7.3% lower cost per result") by clicking **Switch setup** to revert from Advantage+ Audience suggestion to original audience controls ([12:23]–[12:29]).
   - Add the specific Custom Audience (e.g., Customer List or 180-day visitors) ([12:47]–[12:54]).
   - **Crucial step:** Ensure the checkbox **"Use as a suggestion"** is left **UNCHECKED** ([12:58]–[13:08]). Leaving it checked allows Meta to expand into cold audiences.

---

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)

- **Account structure:** 
  - *Deprecated structure:* Campaign #1 Cold Audience + Campaign #2 Retargeting ([07:45]–[07:50], [10:29]).
  - *Recommended structure:* Single consolidated Campaign using the "Hybrid Setup" with one consolidated ad set containing ads serving both warm and cold audiences ([07:51]–[07:54], [09:25]–[09:40]).
  - *Hard constraint structure (exception only):* 1 dedicated ad set with strict custom audience exclusion/inclusion boundaries ([11:35]–[13:34]).
- **Campaign objective:** Advantage+ Sales Campaign / Sales Objective (`Website purchases`) ([00:29], [08:46]).
- **Budgets & bidding:**
  - In shown campaign: Campaign budget / CBO running at `$1,912.00` daily budget ([00:30]).
  - Advantage+ sales campaign optimization; highest volume / standard purchase conversion event ([00:30]).
- **Targeting controls vs. audience suggestions:**
  - *Controls (Hard Boundaries):* Locations (e.g., United States), minimum age constraints ([00:37], [08:49]–[08:54]).
  - *Suggest an audience (Advantage+ Audience):* Custom audiences, detailed targeting interests, open age (18–65+), all genders entered here act merely as algorithm starting suggestions, not hard limits ([00:36]–[00:46], [08:55]–[09:07]).
- **Hard constraint retargeting setup:**
  - Settings -> Click "Further limit the reach of your ads" -> "Switch setup" ([12:17]–[12:29]).
  - Must explicitly leave `"Use as a suggestion"` unchecked ([13:00]–[13:08]).
- **Placements:** Advantage+ Placements (automatic) across Facebook and Instagram ([00:29], [08:46]).
- **Attribution & tracking tools:**
  - Standard attribution model in Meta Ads Manager ([00:30]).
  - Hyros third-party attribution tracking software highlighted ([06:39]–[07:44]) to track true lifetime value, recurring billing, and cross-channel journeys uncaptured by Meta's native reporting ([07:03]–[07:35]).
- **Testing cadence, scaling rules, kill rules:** None shown in this video (creator notes creative testing under the new "Andromeda update" is covered in a dedicated follow-up video) ([13:54]–[14:12]).

---

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)

- **Ad volume in live set:** The example ad set shown contains **45 ads** ([00:29]).
- **Creative messaging philosophy for hybrid ad sets:**
  - Ad creatives must be crafted to speak simultaneously to both warm and cold audiences ([09:29]–[09:40]).
  - Avoid ad creative that *only* makes sense to warm audiences (e.g., "Hey, thanks for visiting our site yesterday") inside hybrid ad sets ([09:33]–[09:37]).
- **Formats, hooks, angles, copy formulas, iteration loop:** None shown in this specific video ([13:53]–[14:12]).

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs)

- None shown.

---

## Offer, product, landing page & Shopify CRO

- **Ascension funnels:** Retargeting campaigns with hard audience constraints should be reserved for ascending past customers from a low-ticket front-end item to a high-ticket product where cold audience traffic would fail ([11:53]–[12:07]).
- **Exclusive warm discounts:** Dedicated retargeting should be used when running an exclusive discount or incentive meant solely for past visitors/buyers to avoid eroding margin on cold prospecting traffic ([11:43]–[11:49]).
- **Platform integrations:** Direct integration between Shopify/CRM customer lists and Meta custom audiences via CSV imports ([04:14], [05:42]).

---

## Metrics & benchmarks quoted (with numbers)

- **Real campaign case study (Cold-configured Ad Set with Audience Segment Breakdown) ([00:51]–[02:28]):**
  - **Total spend:** `$79,395.39` ([00:54], [01:44])
  - **Total purchases:** `942` website purchases ([00:54], [02:22])
  - **Overall Cost Per Purchase (CPA):** `$84.28` ([00:54])
  - **Total impressions:** `7,878,450` ([00:54])
  - **New audience:**
    - Spend: `$47,904.52` (60.3% of spend) ([01:00], [01:48])
    - Purchases: `420` website purchases (44.6% of purchases) ([01:00], [02:24])
    - CPA: `$114.06` ([01:00], [02:15])
    - Impressions: `5,201,781` ([01:00])
  - **Engaged audience (warm non-buyers):**
    - Spend: `$20,134.55` (25.4% of spend) ([01:00], [01:44])
    - Purchases: `335` website purchases (35.6% of purchases) ([01:00], [02:24])
    - CPA: `$60.10` (47.3% cheaper CPA than cold) ([01:00], [02:12])
    - Impressions: `1,765,600` ([01:00])
  - **Existing customers:**
    - Spend: `$11,345.55` (14.3% of spend) ([01:00], [01:44])
    - Purchases: `186` website purchases (19.7% of purchases) ([01:00], [02:24])
    - CPA: `$61.00` (46.5% cheaper CPA than cold) ([01:00], [02:13])
    - Impressions: `910,753` ([01:00])
  - **Unknown:**
    - Spend: `$10.78` | Purchases: `1` | CPA: `$10.78` | Impressions: `316` ([01:00], [02:24])
  - **Aggregate Warm Performance:** ~40% of the cold campaign's budget ($31,480.10) was automatically delivered by Meta to engaged users and past customers, producing over 55% of all conversions (521 of 942 purchases) ([01:43]–[02:28]).
- **Custom audience retention time windows:**
  - Lead forms: max `90 days` ([05:27]–[05:30])
  - Website visitors: max `180 days` ([05:33])
  - Facebook/Instagram page engagers: max `365 days` ([05:31])
- **Meta A/B test benchmark popup:**
  - Switching to manual audience boundaries with hard constraints gives a warning indicating: *"Potential outcome in the current set up: Up to 7.3% lower cost per result based on our experiment"* when keeping Advantage+ audience setup ([12:23]–[12:27]).
- **Hyros attribution case study ([06:58]–[07:06]):**
  - **Spend:** `£10,885.74`
  - **Total Hyros tracked revenue:** `£96,974.62`
  - **Leads:** `1,434`
  - **Cost per lead:** `£7.59`
  - **Meta reported revenue:** `£58,536.91`
  - **Unreported Meta revenue:** `£38,437.71` (tracked via Hyros through recurring/backend billing) ([07:03]–[07:06]).

---

## Mistakes / warnings called out

1. **Running separate cold and warm campaigns blindly** ([02:29]–[02:56], [07:45]–[07:50]):
   - Meta automatically retargets within cold ad sets. If you add a warm campaign using Advantage+ suggestions, Meta expands into cold audiences anyway, resulting in two campaigns targeting the exact same people ([08:10]–[08:35]).
2. **Auction overlap** ([11:02]–[11:34]):
   - Running overlapping cold and retargeting campaigns bids against yourself in the ad auction, damages Meta's frequency management algorithms, and spikes CPMs ([11:03]–[11:30]).
3. **Data fragmentation** ([10:47]–[11:02]):
   - Splitting conversions across multiple campaigns prevents Meta from achieving the volume needed for machine learning. One campaign with 50 conversions/week optimizes significantly better than two campaigns getting 25 conversions each ([10:51]–[11:02]).
4. **Failing to configure Audience Segments** ([03:10]–[03:22]):
   - Without defining segments in Advertising Settings, reporting tables will only show "Unknown," preventing media buyers from knowing their true prospecting vs. retargeting spend ratio ([03:13]).
5. **Believing Custom Audiences & Meta Pixel are obsolete** ([04:36]–[04:45], [06:11]–[06:38]):
   - Many advertisers claim you no longer need custom audiences or pixels under Advantage+. This is dangerous advice: Meta still needs first-party data uploads (to overcome 90/180-day browser cookie limits) and pixel data to guide algorithmic targeting ([05:14]–[06:38]).
6. **Leaving "Use as a suggestion" checked when attempting hard retargeting** ([12:56]–[13:08]):
   - If this box remains checked, Meta treats the custom audience as a loose suggestion and delivers ads to cold users anyway ([13:00]–[13:05]).

---

## Claims vs. evidence

| Claim | Evidence Shown on Screen |
| :--- | :--- |
| Meta automatically spends a large portion of a "cold" campaign budget on retargeting warm audiences. | **Supported with primary data:** Live Ads Manager screen at [01:00] shows an open/broad US campaign spent $31,480.10 out of $79,395.39 (39.65%) on Engaged Audiences and Existing Customers, generating 521 of 942 purchases. |
| Warm audiences have a significantly lower CPA than cold audiences inside broad ad sets. | **Supported:** Data breakdown at [01:00] demonstrates Engaged CPA at $60.10 and Existing Customer CPA at $61.00 vs. New Audience CPA at $114.06. |
| Meta severely underreports backend/recurring e-commerce and lead revenue. | **Supported:** Hyros dashboard screen at [06:58] shows £96,974.62 total revenue vs. £58,536.91 reported by Meta (a £38,437.71 discrepancy). |
| Meta warns that hard-constraining audiences increases CPA by 7.3%. | **Supported:** Meta Ads Manager in-app modal prompt displayed at [12:24] explicitly stating *"Potential outcome in the current set up: Up to 7.3% lower cost per result based on our experiment"*. |

---

## Top 5 takeaways for a clothing brand media buyer

1. **Stop running isolated standard retargeting campaigns:** 
   - Meta naturally retargets warm site visitors and social engagers inside your broad Advantage+ Sales campaigns. Running separate retargeting campaigns for standard apparel catalogs causes auction overlap and bid inflation ([02:29], [11:03]).
2. **Adopt the Hybrid Setup with broad creatives:** 
   - Consolidate your budget into one main Sales ad set with broad targeting. Ensure your video/image creatives appeal both to first-time apparel shoppers (hook, brand introduction) and returning customers (styling, product quality) ([09:25]–[09:40]).
3. **Map Advertising Settings Audience Segments immediately:** 
   - Define your 180-day apparel site visitors, Instagram/Facebook engagers, and email subscribers under "Engaged audience," and your Shopify purchaser lists under "Existing customers." Use the *Breakdown -> Audience segments* view weekly to monitor how much budget Meta is directing toward acquiring new customers vs. converting existing brand followers ([00:55], [03:22]–[04:22]).
4. **Regularly upload Shopify customer CSV lists:** 
   - Pixel data drops off after 180 days. Export all past clothing buyers from Shopify and upload them into Meta Custom Audiences to preserve multi-year customer purchase histories, feeding high-value seed signals back into the algorithm ([05:14]–[06:09]).
5. **Use hard-constraint retargeting strictly for VIP sales:** 
   - Only build a separate retargeting ad set if offering an exclusive VIP apparel collection discount or private sale. When doing so, manually switch audience settings to hard controls and **uncheck "Use as a suggestion"** so cold audiences cannot see the offer ([11:44], [12:17]–[13:08]).
