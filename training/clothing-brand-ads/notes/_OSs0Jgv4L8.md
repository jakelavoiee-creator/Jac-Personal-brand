---
url: https://www.youtube.com/watch?v=_OSs0Jgv4L8
video_id: _OSs0Jgv4L8
title: Is Advantage+ Audience RUINING Your Facebook Ad Performance?
channel: Dr. Matt Shiver
why_studied: advantage+ audience vs original
watched_by: gemini-3.6-flash
studied_at: 2026-10-27 07:30 UTC
---

Here is the complete, literal breakdown of the video to allow full replication of the experiment and key takeaways.

---

## Title & channel
* **Title:** SHOULD YOU TURN OFF ADVANTAGE+ AUDIENCES IN YOUR FACEBOOK ADS? [00:01]
* **Host / Creator:** Matt Shiver (*Matt Shiver Consulting*) [02:16, 05:14]

---

## One-line thesis
Turning off Advantage+ Audiences in favor of Broad demographic targeting makes no statistically significant difference in performance or CPA because Meta’s "post-Andromeda" AI algorithm relies on ad creative itself to handle audience targeting [01:26, 04:15, 06:44, 11:16].

---

## Method (ordered, step by step)
1. **Define the split test hypothesis:** Test whether turning off Advantage+ Audiences and reverting to strict Broad targeting improves, worsens, or maintains Meta ad performance [00:18–00:45].
2. **Build two identical campaign structures:**
   * **Campaign 1 (Advantage+):** Advantage+ Audience enabled, utilizing Meta Value Rules to constrain bid spending on non-target age brackets [00:27, 02:14].
   * **Campaign 2 (Broad):** Advantage+ Audience disabled ("original audience options"), with strict age limits (25–45) and "Use as a suggestion" turned OFF [00:31, 02:38–03:12].
3. **Control creative variables:** Insert the exact same ad creative (same copy, headline, and single image ad: `Orange Ad`) inside both campaigns to isolate targeting as the single test variable [00:46–00:58].
4. **Configure budget & running period:** Allocate $100/day daily budget per campaign ($200/day total) and run concurrently until spending ~$1,280 per campaign (~$2,500 total spend) [02:13, 02:35, 04:00].
5. **Evaluate Ads Manager metrics:** Compare primary KPIs including Cost per Result, CPM, Reach, Frequency, and Link CTR [04:00–05:10].
6. **Break down audience spend attribution:** Analyze Meta’s Audience Segments (Engaged, Existing, New) to observe how Meta distributes spend on Broad vs. Advantage+ [05:15–06:25].
7. **Perform first-click server-side attribution check:** Cross-reference Meta Pixel data with Hyros backend first-click tracking (CAPI) to evaluate actual qualified lead yield and backend bookings [08:15–09:55].

---

## Meta ads specifics
* **Account Structure:** 2 separate campaigns [00:23], each containing 1 ad set [02:08] and 1 identical ad [00:46].
* **Campaign Objective:** Sales / Website Conversions [02:14, 05:17].
* **Performance Goal:** "Maximize number of conversions" [02:14].
* **Conversion Location:** Website [02:14].
* **Conversion Event:** `Complete registration` (triggered when a lead answers "Yes" to both qualification questions) [02:15, 08:08].
* **Dataset / Pixel:** Matt Shiver's Pixel [02:16].
* **Budgets:** $100.00 / day Daily Budget per campaign [02:13, 02:35]. Spent $1,284.69 on ADV+ and $1,280.22 on Broad ($2,564.91 total) [04:01–04:05].
* **Bidding & Value Rules:**
  * **ADV+ Campaign Value Rules:** Set up "Age Range 90% decrease" rule set (`Rule 1: Decrease bid for young + old` for Age 18–24, 45–54, 55–64, 65+ by 90%) to prevent Meta from wasting budget on non-target age groups while keeping Advantage+ active [02:17, 03:25–03:52].
* **Targeting Settings:**
  * **ADV+ Ad Set:** Advantage+ Audience = ON [03:14].
  * **Broad Ad Set:** Advantage+ Audience = OFF [02:38] (clicked "Further limit the reach of your ads" / switch to original audience settings [02:46]). Locations: United States [02:41]. Age: 25–45 [02:41]. Gender: All [02:41]. Detailed Targeting: All demographics/interests/behaviors [02:41]. "Use as a suggestion" checkbox = UNCHECKED [03:01].
* **Placements:** Advantage+ Placements enabled on both ("Placements: Advantage+ on") [02:42, 03:06].
* **Attribution Model:** Standard Meta 7-day click / 1-day view attribution model [02:18, 02:35], augmented with Hyros CAPI First-Click attribution tracking [06:05, 08:18–08:25, 08:56–09:03].

---

## Creative specifics
* **Formats:** Static Image Ad (`Orange Ad`) [00:46, 00:54, 02:13].
* **Ad Copy / Visuals:** Held identical across both ad sets [00:51–00:54].
* **Volume:** 1 ad tested per campaign [02:13].
* **Creative Philosophy:** Post-Andromeda update, the creative itself does the targeting by speaking directly to the ideal customer avatar [01:26, 06:46, 11:08–11:18].

---

## Claude / AI workflow
* *None shown.* (Meta's Andromeda AI targeting algorithm is referenced conceptually [01:16–01:26], but no external LLM/Claude prompts or workflows are displayed).

---

## Offer, product, landing page & Shopify CRO
* **Offer:** Free Mini Course for online coaches wanting to sign 10–20 high-ticket clients/month [07:56, 09:29].
* **Landing Page Funnel:** Opt-in form requiring Name, Email, and 2 qualifying questions:
  1. *"Are you an online coach doing at least $5k/mo with $1,000+/mo to invest in ads?"* (Options: Yes / No) [07:57–08:03].
* **Qualification Firing Rule:** Selecting "Yes" fires the `Complete registration` / `Qualified Lead` Meta conversion event [07:48–08:10].
* **Backend Nurture:** Long-term VSL / Mini Course funnel designed to nurture leads into booking calls over 2 to 6+ months [09:30–09:44].

---

## Metrics & benchmarks quoted (with numbers)

### Combined Experiment Summary [04:03, 08:22]
* **Total Spend:** $2,564.91
* **Total Meta Qualified Results:** 143
* **Average Cost per Result:** $17.94

---

### Campaign 1: Advantage+ Audience (with Value Rules)
* **Amount Spent:** $1,284.69 [04:01, 08:22]
* **Meta Complete Registrations (Qualified Leads):** 71 [04:14, 08:28]
* **Cost per Result:** $18.09 [04:38]
* **CPM:** $49.27 [04:42]
* **Cost per 1,000 Accounts Reached:** $87.45 [04:55]
* **Reach:** 14,690 accounts [05:03]
* **Impressions:** 26,081 [05:05]
* **Frequency:** 1.78 [05:07]
* **Hook Rate:** 1.12% [05:07]
* **Unique Link CTR:** 2.08% [06:29]
* **Cost per Unique Link Click:** $4.25 [06:32]
* **Hyros Total Leads:** 147 (Cost/Lead: $8.73) [08:33]
* **Hyros New Leads (First Click):** 116 (Cost/New Lead: $11.08) [08:48]
* **Hyros Calls Booked:** 1 total (0 qualified) [09:55]
* **Audience Segment Breakdown:**
  * *Engaged Audience:* $376.46 spent | 18 results | $20.91 CPR [05:43, 06:21]
  * *Existing Customers:* $10.46 spent [05:25]
  * *New Audience:* $897.59 spent | 53 results | $16.94 CPR [05:25, 06:22]

---

### Campaign 2: Broad Campaign (Advantage+ OFF)
* **Amount Spent:** $1,280.22 [04:07, 08:22]
* **Meta Complete Registrations (Qualified Leads):** 72 [04:14, 08:28]
* **Cost per Result:** $17.78 [04:38]
* **CPM:** $51.24 [04:42]
* **Cost per 1,000 Accounts Reached:** $86.48 [04:55]
* **Reach:** 14,803 accounts [05:03]
* **Impressions:** 24,995 [05:05]
* **Frequency:** 1.69 [05:07]
* **Hook Rate:** 0.96% [05:07]
* **Unique Link CTR:** 2.22% [06:29]
* **Cost per Unique Link Click:** $3.90 [06:33]
* **Hyros Total Leads:** 159 (Cost/Lead: $8.05) [08:39]
* **Hyros New Leads (First Click):** 120 (Cost/New Lead: $10.66) [08:48]
* **Hyros Calls Booked:** 4 total (1 qualified) [09:27, 09:52]
* **Audience Segment Breakdown:**
  * *Engaged Audience:* $350.14 spent | 18 results | $19.45 CPR [05:43]
  * *Existing Customers:* $8.10 spent [05:25]
  * *New Audience:* $922.09 spent | 54 results | $17.08 CPR [05:25]

---

## Mistakes / warnings called out
1. **The False "Advantage+ Off" Trap:** Toggling age limits under custom audiences does *not* disable Advantage+ Audiences if the checkbox "Use as a suggestion" remains checked [03:00–03:12]. You must uncheck "Use as a suggestion" or switch to original audience settings [02:46, 03:02].
2. **Optimizing for Downstream Proxy Metrics:** Do not change your campaign optimization goal to a secondary/sparse event (e.g., booked calls on an upfront mini-course funnel) just because one campaign randomly produced 3 more calls [09:58–10:35]. Optimize strictly for the primary volume event (e.g., Qualified Leads / Complete Registrations) [10:07–10:15, 11:08].
3. **Assuming Broad Eliminates Retargeting:** Broad targeting still retargets heavily. In this test, Broad spent ~$350 (~27% of its budget) on previously engaged audiences, demonstrating that Meta automatically handles retargeting regardless of setup [05:43–06:00].
4. **Fear of Account Damage:** Advantage+ Audiences will not "ruin" or harm your ad account [11:00–11:04].

---

## Claims vs. evidence

| Claim Made | Evidence Shown on Screen | Verdict / Notes |
| :--- | :--- | :--- |
| Advantage+ Audiences vs. Broad targeting produce virtually identical performance. | Ads Manager showing 71 vs. 72 results ($18.09 vs $17.78 CPR) on ~$1,280 spend each [04:14]. | **Verified.** Difference is 1 lead ($0.31 CPR difference). |
| CPMs and Reach are essentially identical between Advantage+ and Broad. | CPM: $49.27 (ADV+) vs. $51.24 (Broad) [04:42]. Reach: 14,690 vs. 14,803 [05:03]. | **Verified.** Insignificant statistical variance. |
| Broad targeting still does retargeting automatically. | Audience Segment breakdown showing $376.46 (ADV+) vs. $350.14 (Broad) spent on "Engaged Audience" [05:43]. | **Verified.** ~27–29% of budget went to retargeting on both. |
| First-click backend lead volume is nearly identical. | Hyros dashboard showing 116 (ADV+) vs. 120 (Broad) new first-click leads [08:48]. | **Verified.** |

---

## Top 5 takeaways for a clothing brand media buyer

1. **Prioritize Creative Strategy Over Audience Toggles:** Whether Advantage+ Audience is ON or OFF makes almost zero difference to your CPA ($18.09 vs $17.78). For a clothing brand, your budget is better spent testing diverse creative formats (e.g., try-on haul video ads, lifestyle photo carousels, flat lays) than obsessing over targeting toggles [01:26, 06:44–06:48, 11:08–11:18].
2. **Stop Running Separate Middle-of-Funnel Retargeting Campaigns:** Meta’s Broad targeting algorithm automatically spends ~30% of its budget retargeting past site visitors and engaged social followers [05:43–06:00]. Consolidate your budget into broad prospecting rather than splitting spend into dedicated retargeting ad sets.
3. **Double-Check "Suggestion" Checkboxes When Restricting Demographics:** If you are running men’s or women’s clothing lines with specific target age brackets (e.g., 25–45), make sure the "Use as a suggestion" box is UNCHECKED when setting original audience options. Otherwise, Advantage+ will silently bypass your age and gender constraints [03:00–03:12].
4. **Use Value Rules to Guide Meta AI Without Disabling Advantage+:** If you want the benefits of Meta's Advantage+ algorithm but want to restrict spend on demographics outside your target buyers, set up a **Value Rule** (e.g., 90% bid decrease for non-target age groups) [02:17, 03:25–03:52].
5. **Optimize for Direct Purchase/Conversion Events:** Always optimize your Meta campaigns for the exact conversion action you want (e.g. Purchases or Qualified Leads). Do not optimize for top-of-funnel clicks or secondary events expecting Meta to figure out the rest [10:07–10:35, 11:08–11:12].
