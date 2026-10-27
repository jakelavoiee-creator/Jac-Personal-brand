---
url: https://www.youtube.com/watch?v=IdQF3N8Donk
video_id: IdQF3N8Donk
title: I Built an AI Agent That Improves My Shopify Conversion Rate While I Sleep
channel: BitBranding
why_studied: playlist 8/13
watched_by: gemini-3.6-flash
studied_at: 2026-10-27 02:14 UTC
---

Here is the complete, literal breakdown of the video for replicating this automated CRO growth workflow.

---

## Title & channel
* **Channel:** Bitbranding (Co-founder: Christian Piñón) [00:31]
* **Video Topic:** Automating Shopify Store CRO (Conversion Rate Optimization) Reports using Claude Cowork, Microsoft Clarity, and Scheduled Tasks.

---

## One-line thesis
Automate weekly e-commerce conversion rate optimization audits by connecting Microsoft Clarity and Shopify data to Claude Desktop (Claude Cowork) via scheduled, permission-free background tasks.

---

## Method (ordered, step by step)

1. **Install Microsoft Clarity on Shopify** [01:48 - 04:43]:
   * Log into Shopify admin panel.
   * Search for "Microsoft Clarity" in the Shopify App Store [02:13].
   * Select **Microsoft Clarity: AI Insights** (Developer: Microsoft Clarity, blue triangle icon) [02:26].
   * Click **Install** [02:30] and complete Shopify app permissions [02:37].
   * Select setup mode: **Clarity only** (skip "Clarity with Brand Agents" chat widget unless specifically needed) [03:12].
   * Click **Send confirmation email** and accept the project connection via the confirmation link [03:31 - 03:43].
   * Allow 24 to 48 hours for Clarity to collect visitor session recordings and behavioral metrics [03:52].
   * Navigate to **Settings -> IP blocking** in Clarity, enter team member names, and check **Block my current IP** to exclude internal traffic from analytics [04:24 - 04:43].

2. **Install and Configure Claude Desktop & Claude Cowork** [04:44 - 08:02]:
   * Go to `claude.ai/downloads` [05:00].
   * Download and install the **Claude Desktop** application for macOS/Windows [05:05].
   * Open Claude Desktop and toggle from "Chat" or "Code" mode to **Cowork** mode in the top-left sidebar [05:12].
   * Ensure you are signed into your Claude account [05:27].
   * Go to **Projects** -> **New project** -> **Start from scratch** [05:40].
   * Name project: `CRO Reports` [05:48].
   * Set the local project directory path on your computer (e.g., `Documents/Claude/Projects/CRO Reports`) [06:05].

3. **Enable Connectors / Integrations in Claude Cowork** [06:42 - 08:02]:
   * Click **Customize** in the Cowork left panel [07:03].
   * Under **Connectors**, click **+ / Browse Connectors** [07:23].
   * Search for and enable **Microsoft Clarity** (grant OAuth/API read permissions for session recordings, query documentation, query analytics) [07:29 - 07:37].
   * Search for and enable **Shopify** connector to allow cross-referencing conversion data with Clarity friction metrics [07:57 - 08:16].

4. **Set Up Project Instructions & Scheduled Task** [08:31 - 10:12]:
   * Set **Project Instructions** in the right-hand panel of your `CRO Reports` project [08:45].
   * Under **Scheduled**, click **+** to create a new scheduled task [09:21].
   * Configure settings:
     * **Name:** `Weekly cro report` [09:24, 10:14].
     * **Permissions / Execution Rule:** Select **Act without asking** (allows execution without human approval prompts) [09:36].
     * **Model:** Default model / `Sonnet 4.6` (uses fewer credits than Opus 4.7) [09:54].
     * **Frequency:** Weekly -> Select day: **Monday**, Time: **08:00 AM** (or off-peak hours) [10:07].

5. **Run Test Execution & Review Deliverables** [10:58 - 13:21]:
   * Click **Run now** [10:58] to execute the initial audit.
   * Review outputs created automatically in the local project directory:
     * `CRO Report [date].docx` (Full formatted Word document with executive summary, tables, and prioritized fix list) [11:25].
     * `CRO summary [date].txt` (One-page plain-text summary for fast mobile review) [11:22, 13:00].

---

## Meta ads specifics
* **None shown.** *(This video focuses strictly on e-commerce CRO automation; no Meta Ads Manager campaign builds or ad account configurations were discussed).*

---

## Creative specifics
* **None shown.** *(No ad creative testing, hooks, or video ad copy formulas discussed).*

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs)

### 1. Connectors / Tools Enabled
* **Microsoft Clarity Desktop Connector:** Pulls rage clicks, dead clicks, excessive scrolling, quick backs, scroll depth, and session recording data [07:31].
* **Shopify Connector:** Pulls CVR (conversion rate), device breakdown (mobile vs. desktop), traffic sources, and landing page CVR [07:57, 08:16].

### 2. Project Instructions (Verbatim) [08:45 - 09:08]:
```text
You are a senior Shopify CRO consultant working for Bitbranding, a clothing brand agency. The audience for this report is the store owner. Write at a level that assumes Shopify familiarity but no CRO expertise. Be direct - no fluff, no hedging.
```

### 3. Scheduled Task Prompt (Verbatim) [10:15 - 10:46]:
```text
Every Monday at 8am, complete the following workflow:
1. Read the latest Microsoft Clarity data. Identify the top 5 friction points based on rage clicks, dead clicks, excessive scrolling, and quick backs.
2. Cross-reference with conversion rate by device, source, and landing page from the Shopify data.
3. Prioritize the findings into a fix list with three tiers: Ship This Week, Ship This Month, Ship Next Quarter.
4. For each fix, include the specific issue, the suspected revenue impact, the implementation difficulty, and the exact code or page change needed.
5. Save the report as a formatted Word document in the Outputs folder named 'CRO Report [date].docx'. Also save a one-page executive summary as a text file for quick mobile reading.

The audience for this report is the store owner. Write at a level that assumes Shopify familiarity but no CRO expertise. Be direct - no fluff, no hedging.
```

### 4. Scheduled Task Parameters [09:34 - 10:09]
* **Name:** `Weekly cro report`
* **Action Mode:** `Act without asking` (Executes automatically in background)
* **Model:** Default Model (`Sonnet 4.6`)
* **Frequency:** Weekly, Monday @ 08:00 AM

---

## Offer, product, landing page & Shopify CRO

### Key Metrics Monitored in Audit [10:25, 11:25 - 12:55]:
* **Rage Clicks:** Visitors repeatedly clicking unresponsive elements.
* **Dead Clicks:** Clicks on non-clickable elements.
* **Excessive Scrolling:** Users struggling to find information.
* **Quick Backs:** Users hitting back button immediately after landing.
* **Device CVR Divergence:** Comparing Desktop CVR vs. Mobile CVR against traffic share.
* **Landing Page Bounce Rate / Conversion by Traffic Source.**

### Prioritization Framework for Store Fixes [10:37, 11:31]:
* **Tier 1: Ship This Week** (High effort/impact ratio, urgent friction bugs).
* **Tier 2: Ship This Month** (Medium priority UX fixes, cross-sell/up-sell additions).
* **Tier 3: Ship Next Quarter** (Structural redesigns, bespoke landing pages).

---

## Metrics & benchmarks quoted (with numbers)
* **Agency Experience:** Worked with over **800 clothing brand owners** [00:34].
* **Setup Time:** **20 to 30 minutes** one-time setup [01:38].
* **Data Warmup Period:** **48 hours** minimum required after installing Microsoft Clarity to gather baseline data [03:52].
* **Traffic Threshold Benchmark:** Stores receiving **10,000+ visitors per month** [12:16] derive maximum value from weekly automated audits.
* **Sample Clarity Metrics Shown on Screen [03:44]:**
  * Total Sessions: **394**
  * Pages per Session: **1.46**
  * Scroll Depth: **26.53%**
  * Active Time Spent: **1.1 min**
  * Rage clicks: **0.25%**
  * Dead clicks: **2.54%**
  * Excessive scrolling: **0%**
  * Quick backs: **4.06%**

---

## Mistakes / warnings called out
1. **Not blocking internal IP addresses:** Failing to set up IP blocking in Microsoft Clarity leads to tracking your own team's sessions, skewing friction metrics and session recordings [04:22 - 04:43].
2. **Web vs. Desktop App Confusion:** Claude Cowork Scheduled Tasks and local folder write access are **only available in the Claude Desktop application**, not the web browser version (`claude.ai`) [04:54 - 05:07].
3. **Running Tasks During Peak Usage Hours:** Scheduled tasks set between 9:00 AM - 11:00 AM and 1:00 PM - 4:00 PM local time run during peak system load, consuming session usage limits faster [10:15, 14:29]. *Recommendation:* Schedule task for off-peak hours (e.g., Thursday afternoon or early morning) if credit limits are a concern [14:38].

---

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)

* **Claimed:** Claude Cowork can automatically query Microsoft Clarity and Shopify APIs, cross-reference conversion data, and output a complete formatted CRO document without user interaction [00:15 - 00:28].
  * **Proof Shown:** Demonstrates live screen record of Claude Cowork project window showing generated files (`CRO Report 2024-05-13.docx` and `CRO summary 2024-05-13.txt`) and renders a formatted preview of the "CRO REPORT" document containing tables, device breakdown charts, and prioritized fix items [11:18 - 13:20].

---

## Top 5 takeaways for a clothing brand media buyer

1. **Stop Burning Ad Spend on Unconverted Traffic:** Media buyers often scale traffic into landing pages with hidden friction (broken buttons, slow mobile load, non-clickable images). Automated weekly CRO reports surface these leaks before ad budget is wasted.
2. **Automate Analytics Without Manual Overhead:** By using Claude Desktop Cowork mode with Microsoft Clarity & Shopify connectors, media buyers can automate deep quantitative/qualitative audits without spending hours watching session recordings or writing prompts every week.
3. **Combine Behavior + Conversion Data:** Raw heatmaps don't tell the full story. Cross-referencing Clarity friction signals (rage clicks, quick backs) with Shopify CVR by traffic source (Meta Ads vs Organic) pinpoints exactly which ad landing pages are dropping conversions.
4. **Always Exclude Internal IP Traffic:** Always filter internal team and agency IP addresses inside Clarity settings (`Settings -> IP Blocking -> Block my current IP`) to ensure AI models analyze real customer behavior.
5. **Actionable Categorization:** Structure CRO recommendations into simple operational tiers (*Ship This Week, Ship This Month, Ship Next Quarter*) so developers and brand owners can execute high-ROI fixes immediately.
