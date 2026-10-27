---
url: https://www.youtube.com/watch?v=0Z6Rgo6iiUA
video_id: 0Z6Rgo6iiUA
title: Claude + Facebook Ads (FULL COURSE)
channel: Sam Piliero
why_studied: how to operate Meta with Claude
watched_by: gemini-3.5-flash
studied_at: 2026-10-27 13:50 UTC
---

Here is the complete extraction and analysis of the video course **"Claude / Facebook Full Course"** by Sam Piliero.

---

## Title & channel
* **Title:** Claude / Facebook Full Course (The Definitive Course for Claude and Facebook Ads)
* **Presenter:** Sam Piliero
* **Agency / Community:** The Moonlighters / The Facebook Ads Blueprint (`skool.com/facebook`)

---

## One-line thesis
Connecting Claude directly to Meta Ads Manager via Model Context Protocol (MCP) enables automated reporting, 24/7 anomaly and winner detection, and context-aware creative briefing workflows, provided human media buyers maintain oversight to prevent account bloat and inefficient ad spend.

---

## Method (ordered, step by step)

1. **Setup [01:03], [04:18]**
   * Open Claude (Desktop/Web).
   * Navigate to `Customize` $\rightarrow$ `Connectors` $\rightarrow$ `Add custom connector`.
   * Add connector name (e.g., `Facebook Ads MCP`) and URL: `https://mcp.facebookads.com/ads` [04:28].
   * Click **Connect / Reconnect** and authenticate via Meta Business Manager [04:43].
   * Set security permissions: Set all write/modification actions to **Needs approval**; set read/insights actions to **Always allow** [05:08]–[05:40].

2. **Verify connection & select ad account [06:08], [06:41]**
   * Prompt Claude to list accessible ad accounts and identify those with MCP enabled [06:41].
   * Select a specific Meta Ad Account ID for all subsequent prompts [07:26].

3. **Basic capabilities & ad hoc queries [01:11], [07:41]**
   * Run initial query for yesterday’s metrics (Spend, ROAS, Purchases) [07:56].
   * Query multi-day breakdowns in table format [08:33].
   * Generate lightweight interactive HTML dashboards via Claude Artifacts [08:56].

4. **Multi-week trend reporting [01:25], [10:57]**
   * Pull long-term historical data (e.g., 20 weeks) aggregated by week [11:22].
   * Request multi-metric tables (Spend, ROAS, Revenue, Purchases, CPA, CTR, CPC, CPM, CVR, Frequency) [11:46].
   * Ask Claude to perform pattern analysis to highlight macro trends (CPM inflation, frequency drift, promo vs. non-promo performance) [12:08].

5. **Month-to-Date (MTD) rolling tracker & goal grading [14:50]**
   * Build a rolling MTD report tracking performance against defined business targets (e.g., 1.0x ROAS non-promo floor, 4.0x ROAS promo floor, 2.0x blended MTD goal) [15:24].
   * Save the tracker as a **Claude Live Artifact** for static view or dynamic re-fetching [16:31].

6. **Scheduled daily digest reporting [01:36], [14:03], [19:50]**
   * In Claude Desktop / Cowork, schedule the MTD report to execute automatically every day at a set time (e.g., 9:00 AM ET) [19:58].
   * Route the daily update output to Claude Cowork, Slack DMs, or Email [20:00].

7. **Automated anomaly detection (alerts) [01:47], [21:12]**
   * Build an automated alert system checking performance 4 times per day (6:00 AM, 11:00 AM, 3:00 PM, 7:00 PM) [23:03].
   * Set statistical thresholds (e.g., $>2$ standard deviations from 3-day, 7-day, or 14-day trailing baselines) for core metrics (Spend, ROAS, CPA) and secondary metrics (CPM spikes) [21:40]–[22:08].
   * Deliver real-time warning notifications directly to Slack [22:12], [23:08].

8. **Automated winner detection [01:49], [24:04], [25:17]**
   * Define rules for "winning ads" (e.g., drives $>5\%$ of total campaign spend AND exceeds target ROAS/CPA across 3-day, 7-day, and 14-day lookbacks, excluding 5x promo spike outliers) [25:28]–[25:54].
   * Automatically generate daily Slack alerts listing top persistent winning Ad IDs, spend shares, and performance metrics [27:06].
   * Convert the winner list into a persistent, sortable Live Artifact dashboard with direct deep links to Meta Ads Manager [28:30], [29:18].

9. **Connecting business context & brand guidelines [02:16], [30:35]**
   * Create a reusable **Claude Skill** containing Brand Guidelines, messaging pillars, compliance rules, and customer avatar profiles [31:10], [33:35].
   * Feed raw research data (forum/Reddit scrapings, customer reviews, product USPs) into Claude to build direct-response avatar clusters [32:00]–[32:55].

10. **Creative recommendation & iteration flywheel [02:55], [35:12], [37:28]**
    * Use Claude to evaluate winning ads and potential ads (high spend but slightly below ROAS target, or hitting ROAS target with low spend) [37:05]–[37:25].
    * Prompt Claude to reference the Brand Guidelines skill and generate 2–4 distinct creative briefs/angles per winning ad [38:02], [43:23].

11. **Multi-tool creative execution workflows [03:07], [37:28]**
    * Connect external image/video generation MCPs (e.g., Superscale, Higgsfield, Arcads, Gemini, Nano Banana Pro) to Claude [41:46]–[42:15].
    * Instruct Claude to auto-generate vertical (9:16 / 4:5) static image ad variations based on top-performing image ad previews [42:26].
    * Create an ad-scripting Skill; extract transcripts from top video ads via Meta MCP, and auto-generate new video ad scripts and UGC shot lists [45:11]–[45:45].

12. **Future expansion & risk management [03:25], [39:58], [50:20]**
    * Expand workflows to incorporate unit economics, COGS, shipping thresholds, and Shopify inventory levels [49:10], [50:00].
    * Apply human media buyer filtering prior to launching AI-generated ads to prevent account bloat [50:35]–[51:28].

---

## Meta ads specifics

* **Account Structure:** Multi-campaign structure separating Prospecting and Retention/Retargeting campaigns [27:26]–[27:44].
* **Objectives:** Conversions / Website Purchases [08:21], [11:46].
* **ROAS Targets:**
  * Non-promo baseline target: **1.0x ROAS** [15:26], [25:38].
  * Promo period target: **4.0x ROAS floor** [15:32].
  * Blended Month-to-Date "King Goal": **2.0x ROAS** [15:37].
* **Winner Thresholds:** An ad driving $>5\%$ of total campaign spend while achieving $\ge 1.0\text{x}$ ROAS (or meeting tCPA) sustained over 3, 7, and 14 days [25:28]–[25:42].
* **Potential Ad Thresholds:** An ad receiving $>5\%$ of campaign spend but slightly missing ROAS/CPA targets, OR an ad hitting ROAS/CPA targets but receiving $<5\%$ of budget [37:12]–[37:24].
* **Outlier Exclusions:** Promo days with revenue spikes $\ge 5\text{x}$ over baseline are filtered out of anomaly and winner calculations to avoid skewed data [25:48]–[25:54].
* **Testing Cadence:** 14-day flight windows for testing new creative iterations generated from winning concepts [40:08].
* **Safety & Security Permissions:** Read-only capabilities (`ads_get_ad_entities`, insights) set to "Always allow"; budget edits, campaign creation, and ad setting changes kept strictly on "Needs approval" [05:27]–[05:40].

---

## Creative specifics

* **Ad Formats:** Vertical 9:16 stories/reels format, 4:5 feed portrait images, picture-in-picture talking head videos, UGC creator videos [00:24], [24:08], [35:58], [42:46].
* **Copy & Briefing Formulas:**
  * Structured UGC briefs detailing Hooks (3 variations), Important Callouts (must-capture value props), and Additional Shot Lists (product close-ups, b-roll) [44:22]–[44:51].
  * Angle types: Problem-Solution, Mechanism Explainer, Lapsed Optimizer, Comparison/Us vs. Them [32:30]–[33:05].
* **Iteration Flywheel Loop [39:07]–[40:21], [43:17]–[44:03]:**
  $$\text{Winning Ad} \longrightarrow \text{Auto-Brief (2–4 concepts)} \longrightarrow \text{AI Generation Tool} \longrightarrow \text{New Iterations (V1, V2, V3)} \longrightarrow \text{14-Day Test} \longrightarrow \text{Performance Evaluation}$$
* **Creative Volume:** Generate moderately big conceptual variations rather than minor tweaks to combat ad fatigue [38:38]–[38:48].

---

## Claude / AI workflow

### Connectors & Integrations
* **Custom MCP Connector:** `https://mcp.facebookads.com/ads` (Name: `Facebook Ads MCP`) [04:31].
* **External AI Generation Connectors:** `https://mcp.superscale.ai` (Superscale MCP) [41:50], Higgsfield MCP [42:58], Arcads [41:00], Gemini Omni Flash [40:43], Nano Banana Pro [42:41].

### Prompts Quoted Verbatim

* **1. Account Connection Verification [06:41]:**
  > "Using the Facebook ads mcp that I just connected through the connectors, please list out all of the ad accounts that I have access to and specifically call out the ad accounts that have access to the MCP connection."

* **2. Account Selection [07:26]:**
  > "Let's use the account [ACCOUNT_ID]"

* **3. Ad-Hoc Metric Query [07:56]:**
  > "What was yesterdays ROAS and spend"

* **4. Simple Multi-Metric Plot [08:33]:**
  > "Please plot the last 30 days of spend, ROAS, purchases, impressions, and frequency in a very simple table."

* **5. Interactive Dashboard Generation [08:56]:**
  > "Use this data to actually build something that I can visualize and understand more easily. make it slightly interactive, but overall keep it pretty light and simple."

* **6. 20-Week Multi-Metric & Trend Analysis [11:22]:**
  > "This is great. Now I want you to do this broken out by week for data over the last twenty weeks. After you do this, I want you to include some sort of section that actually analyzes the patterns of this data. Also, feel free to include more than just spend ROAS purchases, impressions and frequency. Let's go pretty advanced and detailed here."

* **7. Rolling Month-to-Date Tracker Setup [14:50]:**
  > "Excellent. Now I just want to keep things a little bit more simple. Build a daily report just like we did at first. Keep the tons of metrics that you've added in there. I really like those. But just do it for this rolling month. For example, if you're pulling this report in May, I want to see this for May to date. If you're pulling it for June, I want to see it from June 1st to the current date. This is a monthly tracker."

* **8. Account Goal Context Injection [15:24]:**
  > "So let me provide you with some context on my goals. My return on ad spend target is a one x during nonpromo periods, and it's around a four x during promo periods. All in blended as long as the full month is tracking to a two return on ad spend, we're doing good. Let's consider this the king goal of my account, and let's include this in the reporting."

* **9. Save Artifact Instruction [16:31]:**
  > "Can you save this as an artifact"

* **10. Cowork Live Artifact Prompt [18:52]:**
  > "Build this exact HTML live artifact that I've attached below. Do this only for the account [ACCOUNT_ID]"

* **11. Scheduling Daily Report [19:51]:**
  > "This is all great. Can you please schedule this to be updated and sent to me every single day at nine AM?"

* **12. Automated Anomaly Detector Setup [21:35]:**
  > "Using the Facebook Ads MCP connector, I want you to build an anomaly detector. This should account for any significant change over two standard deviations across the brand that we are looking at. The purpose of the anomaly detector is to detect both good and bad anomalies in my ad account. I would ideally like this to be run four times per day, and specifically, we're looking at core metrics like spend, ROAS, CPA, but we also care about secondary metrics, like spikes and CPMs."

* **13. Automated Winner Detector Setup [25:17]:**
  > "I want you to now build a second anomaly detector, except this time we're going to be building it for winning ads. So I specifically want you to look at the winning ads in my ad account, which we'll define by any ad that drives more than five percent of the total campaign spend and is above my target return on ad spend. For this example, let's say my target return on ad spend is one. As long as the ad is driving over a one x, I also want you to rule out any sale periods, which you've previously looked at before. So we could just ignore days completely that have massive spikes in revenue, and I'm talking like five x over baseline. The purpose of this anomaly detector is to specifically pull out the winning ads in the ad account. So I want a winning ads report that pulls out the ad ID and any other contextual information you can tell me about the ad. Of course, I want the baseline stats for this ad, but I'd also like for you to pull these winning ads based on three days of data, seven days of data, and fourteen days of data. I'm not looking for a single-day spike. I'm looking for chunks of data analysis so I can make informed decisions."

* **14. Troubleshooting Blank Artifacts [29:04]:**
  > "Okay, it looks like something has went wrong here. I've got no information here. This is completely different than the slack report that you sent to me. So I'd like you to take screenshots of your own artifact that you built here and try to figure out what went wrong, troubleshoot it, and create a new one."

* **15. Brand Guidelines Skill Creation [33:35]:**
  > "Write a skill that you could easily reference. This is going to contain my brand guidelines and my avatars for my brand."

* **16. Creative Iteration Generation Prompt [38:02]:**
  > "For any of these top ads that are image ads, I want you to take the image preview and build a variety of dynamic iterations of the same ad. Feel free to change any component that you want that you think will be most important. Don't forget to reference our brand guidelines skill that we built together earlier. Every time you create these new images, I want you to review them before you send them off to me to make sure they follow the brand guidelines, avatars, and feel free in a few of these variations to be unique and creative. We're not looking for tiny little tweaks or iterations, we're looking for moderately big changes based on an original ad that we already know drives a lot of spend."

* **17. External MCP Image Generation Trigger [42:26]:**
  > "Okay, this is fine. Now, since you can't generate images on your own, please use the MCP to build these images for me. You can go back in the chat, take one of these prompts, and just build one image ad for me. I want to use Nano Banana Pro and build two variations per iteration that's necessary. Do this all in vertical formats."

* **18. Video Scripting Skill Creation [45:11]:**
  > "Build a skill that can easily referenced for scripting video ads. Here is the video briefing template that we like to use with the creators that we work with..."

* **19. Transcript Extraction & Auto-Scripting Prompt [45:30]:**
  > "Using the Facebook ads mcp and the account [ACCOUNT_ID], please find my top performing video ad, extract the transcript, and then using the skill that you've just made, write a new script and brief."

---

## Offer, product, landing page & CRO

* **Featured Brand Example:** Grüns (greens gummy supplement) [32:12]–[33:00].
* **CRO Findings from Analysis [13:15]–[13:25]:**
  * Conversion rate (CVR) drops below $1.0\%$ ($0.5\%-0.9\%$, ~1 in 150 clicks converts) during standard non-promo weeks.
  * CVR surges to $2.2\%-3.4\%$ during promo periods.
  * **Diagnosis:** The offer funnel is leaking at the landing page stage on normal days because standard landing page offers are not compelling enough to convert cold traffic without promo discounts.
  * **Recommendation:** Fix everyday landing page conversion rate (the "biggest untapped lever") rather than blaming ad creatives [13:25].

---

## Metrics & benchmarks quoted (with numbers)

* **Portfolio Scale:** The Moonlighters agency manages $>100$ e-commerce brands [00:05]; example Business Manager has **236 ad accounts**, of which **216 are MCP-enabled** (91.5%) [07:05]–[07:15].
* **MCP Account Rollout:** Meta MCP is currently active on ~10–20% of general ad accounts [06:10].
* **Yesterday Summary (Single Account Example) [08:21]:**
  * Spend: **$960.05**
  * ROAS: **2.07x**
  * Purchases: **13**
  * Impressions: **84,437**
* **30-Day Dashboard Summary [09:13]:**
  * Total Spend: **$58,732**
  * Blended ROAS: **3.24x**
  * Purchases: **1,573**
  * Impressions: **5,115,000**
  * Avg. Frequency: **2.41**
* **20-Week Historical Aggregates [11:46]:**
  * Total Spend: **$218,510**
  * Blended ROAS: **2.20x**
  * Total Revenue: **$480,177**
  * Purchases: **4,312**
  * Avg. CPA: **$51**
  * Avg. CPM: **$11.39**
  * Avg. CVR: **1.32%**
* **Month-to-Date (May 1–May 28) Summary [16:21]:**
  * MTD Spend: **$55,519**
  * MTD Revenue: **$186,801**
  * Purchases: **1,534**
  * Avg. CPA: **$36**
  * Promo Days: **5**
  * Avg. CPM: **$11.39**
  * MTD Blended ROAS: **3.36x** (vs 2.0x target).
* **CPM Inflation Trend:** Rose from **$5.50–$6.50** in Jan/Feb to **$10.00–$11.39** in May (**75% increase** over 20 weeks) [13:05].
* **Frequency Trend:** Drifted from **2.08** in Jan to **2.3–2.6** in May (peaking at **2.78**) [13:12].

---

## Mistakes / warnings called out

1. **Do NOT let AI bloat your ad account [50:34]:**
   * *Mistake:* Uploading dozens or hundreds of AI-generated ad variations into Meta Ads Manager simultaneously.
   * *Consequence:* Ad account bloat splits budget into tiny micro-allocations, generating low-volume, weak-performing ads while starving good ads of sufficient spend. This creates a "death loop" for ad accounts [50:42]–[50:51].
2. **Never remove human judgment [50:52], [51:28]:**
   * AI tools should enhance and automate reporting, analysis, and briefing workflows, **not** autonomously publish unreviewed ads or make unvetted spend decisions.
3. **Beware of context-blind AI analysis [12:15]–[12:50]:**
   * AI running standard ad performance analysis will misinterpret low-ROAS non-promo weeks as "structurally unprofitable." In reality, the business may thrive at a 0.8x incremental new-customer ROAS because profits are realized on backend LTV. Without supplying margin/LTV context, Claude’s strategic advice can be incorrect.
4. **Tool Permissions Risk [05:27]:**
   * Never leave campaign management / budget edit tools on "Always allow." Keep all account-editing tools on "Needs approval" to require explicit human confirmation.

---

## Claims vs. evidence

| Claim Made in Video | Evidence Shown on Screen |
| :--- | :--- |
| **Agency track record:** The Moonlighters turns 7-figure DTC brands into 8-figure brands with +41% ROAS and +55% profit in 90 days [00:15]. | Webpage banner showing agency client logos (Kleinfeld, NaturesPlus, FEIT, ORA, Titan, Colorscience) [00:04], [00:15]. |
| **Direct Meta API Integration:** Claude connects directly to Meta Ads Manager via MCP [04:40]. | Screen recording showing `https://mcp.facebookads.com/ads` authentication modal and connection confirmation [04:43]–[05:01]. |
| **Live Account Data Extraction:** Claude pulls live account data for 200+ ad accounts [07:02]. | Terminal/chat window displaying pagination through 236 ad accounts and verifying 216 MCP-enabled accounts [07:05]. |
| **Interactive HTML Dashboards:** Claude generates interactive, filterable dashboards [09:13]. | Rendered UI component showing toggle buttons for Spend, ROAS, Purchases, Impressions, Frequency, and a dynamic line chart [09:16]–[09:36]. |
| **Real-Time Slack Alerts:** Automated 4x/day anomaly detector sends Slack notifications [23:08]. | Slack desktop app displaying formatted alerts with $Z$-scores, 3-day/7-day/14-day baseline comparisons, and warning flags [23:08], [27:06]. |
| **AI Creative Generation:** Claude triggers external MCPs to render ad images on demand [43:09]. | Chat window showing Higgsfield/Superscale MCP progress bars and final 9:16 vertical image outputs rendered directly inside Claude Cowork [43:09]. |

---

## Top 5 takeaways for a clothing brand media buyer

1. **Hook Claude directly to Meta via MCP:** Connect `https://mcp.facebookads.com/ads` in Claude Desktop to bypass manual CSV exports and run instant ad-hoc queries, historical trend analyses, and custom metric breakdowns in natural language.
2. **Build statistical Slack alerts to protect budgets:** Set up automated 4x/daily anomaly tasks in Claude Cowork flagging metrics that drift $>2$ standard deviations from trailing 3-day/7-day/14-day averages. This alerts you to sudden CPM spikes or CPA blowouts immediately.
3. **Automate a "Winning Ad Flywheel" instead of guessing:** Program Claude to identify winning ads (ads taking $>5\%$ of campaign spend while hitting target CPA/ROAS). Have Claude convert those winners into 2–4 conceptual briefs, pass those briefs to image/video MCP tools (Superscale, Arcads, Nano Banana), and test the new variations on a 14-day flight.
4. **Inject brand guidelines & customer avatars as Claude Skills:** Store your brand voice, prohibited terms, design rules, and direct-response customer avatar profiles as reusable Claude Skills. This ensures all AI-generated briefs, image prompts, and UGC video scripts align with your brand standards.
5. **Enforce a human approval filter to prevent account bloat:** Keep all Meta MCP write actions (budget changes, ad creation) on "Needs approval." Never allow AI to automatically upload mass creative variations directly into campaigns, as unvetted AI ad bloat dilutes campaign budget and degrades ad delivery algorithm efficiency.
