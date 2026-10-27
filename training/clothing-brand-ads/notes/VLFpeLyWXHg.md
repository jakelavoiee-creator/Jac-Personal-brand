---
url: https://www.youtube.com/watch?v=VLFpeLyWXHg
video_id: VLFpeLyWXHg
title: Why Facebook Ads Don't Scale (Fix Event Match Quality Now)
channel: Grant Cooper
why_studied: tracking quality
watched_by: gemini-3.6-flash
studied_at: 2026-10-27 07:44 UTC
---

## Title & channel
* **Title:** Meta Event Match Quality Score Breakdown & How to Increase It (Conversions API / Cometly)
* **Channel:** Cometly (presented by Grant) [00:00]

---

## One-line thesis
Achieving an Event Match Quality (EMQ) score above 8.5–9.0/10 on Meta conversion events via a fully populated Conversions API (CAPI) setup is mandatory for Meta's algorithm to accurately attribute conversions, lower CPA, and allow ad spend to scale [00:48, 02:08, 04:10].

---

## Method (ordered, step by step)
1. **Audit main optimization events:** Go to Meta Events Manager (`business.facebook.com/events_manager`), select your dataset/pixel, and check the Event Match Quality score for your core conversion events (e.g., Purchase, Lead, MQL) [01:20, 10:04].
2. **Identify target EMQ benchmark:** Aim for a score of 8.5/10 to 9.3+/10 on key conversion/MQL events [02:00, 03:37].
3. **Understand parameter priorities in Meta CAPI:** [05:49]
   * **High priority:** `Email`, `Click ID` (`fbc` / Facebook Click ID) [05:52, 05:55].
   * **Medium priority:** `Facebook Login ID`, `Birthdate`, `Country`, `Phone number`, `External ID`, `Browser ID` (`fbp`) [06:00, 06:04].
   * **Low priority:** `Lead`, `First name`, `Last name`, `City`, `Zip or Postal Code` [06:07].
4. **Capture initial anonymous visitor parameters on page load:** [07:30 - 08:00]
   * Ad click: capture ad ID, UTM parameters, `fbclid` (Facebook Click ID) [07:30].
   * Landing page visit: capture IP Address, User Agent, Device Fingerprint, Browser Cookies (`fbp`) [07:45].
5. **Infer location parameters automatically:** Use IP address geolocation parsing to automatically generate `City`, `State`, `Zip Code`, and `Country` without asking the user on a form [07:51, 11:08].
6. **Capture personally identifiable information (PII) on form/checkout submit:** Capture `First Name`, `Last Name`, `Email`, and `Phone Number` [08:15, 08:26].
7. **Compile the Customer Profile:** Combine anonymous tracking identifiers (`fbclid`, `fbp`, IP, User Agent) with user PII to construct a customer profile containing up to 13–14 parameters [05:40, 08:34 - 08:50].
8. **Pass customer profile via Conversions API (CAPI) back to Meta:** Stream full server-side data back to Meta Events Manager [09:18 - 09:28].
9. **Monitor Events Manager for EMQ improvement:** Confirm the main optimization event score reaches 8.5–9.3+/10 [01:28, 09:24].

---

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)
* **Optimization Event:** Optimizing for bottom/mid-funnel events like MQL (Marketing Qualified Lead), Lead, or Purchase requires high EMQ to feed clean data back into Meta [03:37, 10:13].
* **Event Match Quality Benchmarks:**
  * **Below 8.5/10:** Indicates CAPI is broken or insufficient parameters are being passed [02:08 - 02:15, 10:18].
  * **8.5 to 9.3+/10:** Ideal range for main conversion events (MQL, Lead, Purchase) [02:00, 03:37].
  * **5.6 to 6.7/10:** Normal/acceptable for top-of-funnel events like `PageView` or `Website Visit` where user PII is not yet available [04:41, 10:41 - 10:50, 12:43].
* **Account structure, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules:** *None shown.*

---

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)
* **Data Fundamentals vs. Creative/Copy:** Grant stresses that regardless of how good your ad creative, ad copy, audience targeting, landing page, or offer is, if your technical data/matching baseline is broken, campaign performance will fail and cannot scale [00:20 - 00:40, 03:05 - 03:17, 09:35 - 09:55].
* **Formats, hooks, angles, copy formulas, volume:** *None shown.*

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)
* *None shown.*

---

## Offer, product, landing page & Shopify CRO
* **Avoid asking for excessive form fields:** Do NOT add street address, city, state, or zip code input fields to opt-in forms or email popups just to increase EMQ scores, as extra fields drastically lower landing page conversion rates [11:28 - 11:43].
* **E-Commerce / Checkout CRO advantage:** E-commerce purchase events naturally capture name, email, phone, address, city, state, zip, and country during checkout. Ensure all of these fields are hashed and passed to Meta CAPI [11:44 - 11:52].
* **Automated form tracking:** Utilize tracking mechanisms (e.g., Cometly or custom scripts) that auto-capture name, email, and phone upon form interaction [08:15].

---

## Metrics & benchmarks quoted (with numbers)
* **Event Match Quality Scores shown in account dashboard:** [01:28]
  * **Contact:** 9.3 / 10
  * **MQL:** 9.3 / 10
  * **Purchase:** 9.0 / 10
  * **Signup:** 8.8 / 10
  * **Lead:** 8.8 / 10
  * **Created Account:** 8.6 / 10
  * **Website Visit:** 6.7 / 10 [12:43]
  * **PageView:** 5.6 / 10 [10:41]
* **Potential Match Quality Score Increases (shown in Meta interface):** [12:34 - 12:38]
  * Adding **Facebook Login ID** (unhashed): +12.00% potential increase in event match quality.
  * Adding **Date of Birth** (hashed): +9.00% potential increase in event match quality.
* **Target Daily Ad Spend Scale:** $10s, $20s, $30s, $100s, to $1,000s/day [00:48 - 00:55].
* **Total customer parameters sent:** 13 to 14 parameters total [05:40].

---

## Mistakes / warnings called out
1. **Relying solely on Meta Pixel:** Running Meta ads with only browser pixel tracking (without CAPI) leads to severe data loss from iOS 14+ and privacy blockers, crippling performance [01:48 - 01:55, 04:43 - 05:03].
2. **Blindly trusting native CRM/Payment CAPI integrations:** Assuming CRM integrations (HubSpot, GoHighLevel, Salesforce) or native payment gateway CAPI toggles work properly out-of-the-box is a mistake; developers often build bare-minimum CAPI setups that fail to pass key identifiers like `fbc`, `fbp`, or parsed IP data [02:15 - 02:40, 07:00 - 07:22].
3. **Hurting CRO to fix EMQ:** Manually adding address/location fields to opt-in forms lowers form conversion rate [11:28 - 11:43].

---

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)
* **Claim:** High EMQ scores result in better ad attribution, lower cost per action (CPA), and scalable campaign performance [00:18, 04:10, 04:35].
* **Evidence shown:** 
  * Live Meta Events Manager screen showing Cometly Pixel dataset with EMQ scores between 8.6/10 and 9.3/10 across MQL, Lead, Purchase, and Contact events [01:28, 03:37].
  * Meta Business Help Center official documentation stating that higher event match quality improves attribution and lowers cost per action [04:00 - 04:28, 05:48 - 06:05]. 
  *(Note: Specific ad account performance dashboards showing CPA before/after CAPI installation were not displayed on screen).*

---

## Top 5 takeaways for a clothing brand media buyer
1. **Check Purchase & Add to Cart EMQ Scores:** Open Meta Events Manager and verify that your `Purchase` and `AddToCart` events score above 8.5/10 [01:28, 10:05].
2. **Pass Full Checkout PII Hashed via CAPI:** Since fashion ecommerce checkouts collect full customer details (Name, Email, Phone, Address, City, State, Zip, Country), ensure your CAPI setup hashes and passes every single one of these parameters to Meta [05:49 - 06:04, 11:44 - 11:52].
3. **Capture & Pass `fbc` and `fbp` Cookies:** Ensure your store setup captures the Facebook Click ID (`fbclid` -> `fbc`) and Browser Cookie (`fbp`) on the user's initial land and sends them along with the purchase event payload via CAPI [05:55, 07:45 - 07:58, 08:42].
4. **Do Not Bloat Top-of-Funnel Popups:** Do not add shipping address fields to email discount popups to boost EMQ; use IP geolocation parsing to supply city/state/country details silently [07:51, 11:08 - 11:43].
5. **Verify CAPI Parameter Delivery:** If your default Shopify or CRM CAPI integration yields an EMQ score under 8.5 for `Purchase`, switch to a specialized server-side attribution/tracking engine like Cometly or a custom CAPI script that streams all 13–14 parameters [02:08 - 02:40, 07:12 - 07:22].
