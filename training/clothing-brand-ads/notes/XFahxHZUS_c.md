---
url: https://www.youtube.com/watch?v=XFahxHZUS_c
video_id: XFahxHZUS_c
title: I Used Claude to Find Why My Clothing Brand Ads Were Failing
channel: BitBranding
why_studied: playlist 4/13
watched_by: gemini-3.7-flash
studied_at: 2026-10-27 02:02 UTC
---

Here is the complete extraction and operational breakdown from the video:

---

## Title & channel
* **Channel:** BitBranding (Hosted by Aaron Pearson, Co-Founder at BitBranding [01:07])
* **Video Subject:** Diagnosing and fixing clothing brand marketing bottlenecks using the proprietary "Clothing Offer Equation" framework inside a custom Claude AI Skill.

---

## One-line thesis
9 out of 10 times, underperforming Meta ads for clothing brands are not an ad creative problem but an offer/friction problem, which can be diagnosed into a single score using the formula $\frac{S \times QF}{W + SF + PS}$ to surface the exact bottleneck and build a 30-day corrective action plan [00:08 - 01:46].

---

## Method (ordered, step by step)

1. **Break the Marketing hamster wheel [00:30 - 00:58]:** Stop constantly swapping ad creatives, targeting, captions, platforms, and influencers when sales spike for a week and then flatten out.
2. **Calculate the Clothing Offer Equation (COE) [01:46 - 04:30]:**
   $$\text{COE Score} = \frac{S \times QF}{W + SF + PS}$$
   * **Numerator (Brand Desirability / Pull):** 
     * $S$ = Style Aspirations [01:56]
     * $QF$ = Quality & Fit Confidence [02:13]
   * **Denominator (Friction / Resistance):**
     * $W$ = Waiting Time (Fulfillment & shipping speed) [02:40]
     * $SF$ = Shopping Friction (Site navigation, checkout, speed) [02:49]
     * $PS$ = Price Sensitivity (Discount reliance, perceived value) [03:52]
3. **Score each variable on a 1–10 scale [04:32 - 06:04]:**
   * $1$ = Best possible / minimal friction / maximum pull.
   * $10$ = Worst case / extreme friction / zero connection.
4. **Interpret the overall score [07:27 - 07:41, 15:26]:**
   * **7–10 (Strong):** High desirability, low friction; ready to scale ad spend aggressively [07:27].
   * **4–6 (Potential):** Upside exists, but specific friction bottlenecks require targeted remediation before scaling [07:33].
   * **1–3 (Needs Work):** Major friction blocking conversion; spending on ads burns cash [07:36].
5. **Set up Claude Desktop & Cowork [09:00 - 09:25]:** Install the Claude Desktop application and select the **Cowork** workspace mode for structured, repeatable execution.
6. **Package the Framework into a Claude Skill (`SKILL.md`) [09:44 - 10:48]:** Feed the framework parameters, rubric, and prompt sequence to Claude to generate a permanent `.skill` / `SKILL.md` file.
7. **Execute the COE Audit [12:30 - 13:13]:** Trigger the audit by prompting Claude, then input operational data from Shopify Analytics, email platforms, reviews, and social channels.
8. **Review the Diagnostic HTML Artifact [15:04 - 16:46]:** Identify the highest-scoring denominator variable (the biggest bottleneck).
9. **Implement the 30-Day Prioritized Action Plan [16:17 - 17:25, 19:57 - 20:07]:**
   * *Do First:* High-impact, quick wins.
   * *Implement Next:* High-impact, medium effort.
   * *Long-Term Wins:* Sustained strategic effort.
10. **Build Remediation Assets (e.g., Value Justification Campaign) [20:25 - 20:58]:** Generate targeted ad scripts, organic posts, emails, and PDP copy designed to eliminate the diagnosed bottleneck.

---

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)
* **Specific settings shown/discussed:** None shown.
* **Performance Media Buyer Context:** The video explicitly states that trying to solve brand performance by tweaking Meta ad targeting, ad formats, placements, bidding, or swapping influencers is a false solution when the offer itself is broken [00:30 - 00:58]. The creator emphasizes that Meta ad spend will simply compound losses if the COE score is below 4 [07:36], and ad spend should only be scaled aggressively once the COE score is in the 7–10 range [07:27].

---

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)
* **The "Fake Fix" Cycle [00:30 - 00:46]:** Constantly cycling through new creatives, new caption styles, and new ad formats to fix conversion drops is a failure pattern; no ad creative can fix slow shipping, checkout friction, or pricing doubts [00:48 - 00:54].
* **Signals of Strong Style Aspiration ($S$) Creatives [04:44 - 04:56]:** High-performing creative relies on unprompted user-generated content (UGC) where customers tag the brand organically to project an identity they aspire to be.
* **Product Detail Page (PDP) & Ad Visuals ($QF$) [02:18 - 02:26, 18:56 - 19:07]:** Creatives must show garments matching real life—highlighting stitching, fabric weight, craftsmanship, texture close-ups (e.g., heavyweight materials on high-end tees), and sizing accuracy.
* **Value-Justification 5-Part Campaign Structure [20:30 - 20:48]:** When Meta ads struggle due to price sensitivity, deploy a campaign focused on quality, longevity, and brand identity rather than running sales or discount codes:
  * 2 Instagram Posts [20:38]
  * 1 Email Broadcast [20:39]
  * 1 Paid Ad [20:39]
  * 1 Product Detail Page (PDP) Update [20:39]

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)

### Tools Used
* **Claude Desktop App** (Sonnet 4.6 model used on screen) [09:00 - 09:12]
* **Claude "Cowork" Workspace** mode [09:11]
* **Claude Skills / Custom Plugins** (`clothing-offer-equation`) [09:46 - 09:50]
* **WhisperFlow:** Voice-to-text dictation tool used to record and insert spoken prompts into Claude [10:04 - 10:31].

### Verbatim Prompts

#### 1. Skill Creation Prompt [10:32 - 10:48]:
> *"I want to build a skill based off of the clothing offer equation. I'm going to give you this full framework. I'm going to give you the formula, the variable definitions, the scoring system and audit prompt sequence. Build me a skill.md file I can upload to Claude."*

#### 2. Audit Initialization Prompt [12:32 - 12:38]:
> *"Run a clothing offer equation audit or COE audit on my clothing brand, and I'll give you the data."*

#### 3. Test Brand Example Prompt [12:53 - 13:13]:
> *"For this example I want you to pull in a random brand. It could be a large brand, could be a real known brand, and I want you to score this for us just because I'm doing a YouTube video. And so I just want to use this as an example. So go out there and grab a brand as an example to fill out the information that we can use and review."*

#### 4. Diagnostic Question Sequence Prompt [17:28 - 17:42]:
> *"I want to show the people on YouTube what this would look like if they were filling it out for themselves, because I know we have a prompt sequence or question sequence, so show me what that looks like, as if we were starting fresh so that I can share what this would look like for them starting out."*

#### 5. Bottleneck Remediation Campaign Prompt [20:30 - 20:48]:
> *"My clothing brand has a price sensitivity issue. Without using discounts, write me a 5 part value justification campaign: 2 Instagram posts, 1 email, 1 ad, and 1 product page update that makes the price feel like an obvious choice based off of quality, longevity, and brand identity."*

### System Inputs & Skill Architecture (`SKILL.md`) [21:11 - 21:18]
* **Phase 1: Diagnostic Framing:** Establishes context and brand background.
* **Phase 2: Interactive Scoring:** Evaluates all 5 variables in exact order: $S \rightarrow QF \rightarrow W \rightarrow SF \rightarrow PS$.
* **Data Signals Extracted:**
  * Shopify fulfillment times ($>5$ business days $\rightarrow$ Score 6+).
  * Post-purchase email unsubscribe rates.
  * Repeat customer rate ($<20\%$ indicates trust/sizing friction).
  * Mobile click depth from product page to checkout.
  * Active coupon codes circulating on aggregator sites.
* **Output Format:** Generates a clean, interactive, print-ready HTML artifact complete with visual score cards, diagnostic analysis, and a 3-tier prioritized action plan [15:04 - 16:46].

---

## Offer, product, landing page & Shopify CRO

### Hero Section & Navigation CRO [03:00 - 03:49]
* **Desktop vs. Mobile Reality:** 40% of traffic can still come from desktop, even though mobile dominates [03:13].
* **Avoid Vague Hero Sections:** A live brand audit example featured a generic mountain image with unexplained jargon, zero product clarity, and a non-clickable banner with a plain "Shop Now" button [03:14 - 03:44]. The customer could not tell if they sold climbing gear, outdoor equipment, or lifestyle apparel [03:40].
* **Mobile Click Friction:** A store should require **under 3 clicks** from product page discovery to completed checkout on mobile [05:32 - 05:40]. 4 clicks is mediocre; anything higher spikes cart abandonment ($SF$ score: 10) [05:41 - 05:50].

### Shipping & Fulfillment ($W$) [02:44 - 02:47, 05:11 - 05:30]
* A delivery window of 2–3 days with real-time tracking rates as a $1$ (optimal) [05:14 - 05:24].
* Delivery windows exceeding 6 weeks or radio silence after order confirmation rate as a $10$ (killing brand trust and repurchases) [02:44, 05:25 - 05:30].

### Discount Devaluation Trap ($PS$) [03:57 - 04:02, 05:51 - 06:25]
* If $>50\%$ of orders use a discount code, the brand has conditioned its customers to never purchase at full retail value ($PS$ score: 10) [05:51 - 06:04].
* The fix: Cut off site-wide discount codes from public aggregator sites and limit promo codes exclusively to closed loyalty or VIP tiers [16:34 - 16:38].

---

## Metrics & benchmarks quoted (with numbers)

* **300+** clothing brands audited by BitBranding over the past 12 months [00:04, 01:10].
* **$150,000,000+** in combined revenue generated across those client brands [01:13].
* **9 out of 10 times**, ad performance drops are caused by offer bottlenecks, not ad creatives [00:09, 13:38].
* **30 minutes:** Time required to set up the Claude skill and execute a full diagnostic audit [00:27, 14:51].
* **40%:** Portion of clothing store traffic that often still arrives on desktop [03:13].
* **< 3 clicks:** Target mobile friction threshold from product page to purchase completion [05:32].
* **< 20% repeat customer rate:** Warning signal indicating fit/quality issues or fulfillment friction [21:17].
* **> 5 business days fulfillment:** Threshold that pushes the Waiting Time ($W$) score into 6+ territory [21:16].
* **> 50% discount utilization:** Benchmark marking severe price sensitivity [05:51].
* **Chubbies Brand Audit Example [15:04 - 16:52]:**
  * Estimated Revenue: **$118M** [15:58]
  * Active discount codes found circulating on aggregators: **615+** [15:37, 16:05]
  * Clearance discounting depth: **Up to 65% off** [15:38, 16:06]
  * Average discount rate: **15–20% off** [16:06]
  * Customers purchasing on promotion: **Hitting 40% routinely** [16:06]
  * Normalized COE Score: **4.9 out of 10** ("Potential") [15:05, 16:51]
  * Bottleneck diagnosed: **Price Sensitivity (Score: 9/10)** [15:32]

---

## Mistakes / warnings called out

1. **Treating an Offer Flaw like an Ad Problem [00:45 - 00:58]:** Paying Meta to drive traffic to an offer burdened with slow shipping, sizing hesitation, or checkout friction is "paying to send people to a leaky bucket."
2. **Re-shooting Creatives When the Style ($S$) Score is Low [14:02 - 14:30]:** When customers do not identify with the brand aesthetic, shooting new lookbooks or testing new ad formats will not work. A low $S$ score stems from vague positioning and lack of customer avatar definition, not ad production quality [14:12 - 14:26].
3. **Discount Addiction [06:01 - 06:25]:** Relying on constant sales to boost short-term ad ROAS trains shoppers never to buy at full price, eroding margins and making customer acquisition unsustainably expensive.
4. **Vague, Artistic Websites [03:14 - 03:45]:** Using obscure hero image graphics and insider jargon that leaves first-time ad traffic confused about what is being sold.

---

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)

* **Claim:** BitBranding helped 300+ clothing brands generate over $150M in revenue over 12 months [01:09 - 01:15].
  * *Evidence Shown:* Screen overlays show three cropped Shopify dashboard sales cards ($239,032.56, $236,217.26, $224,442.98) [01:13 - 01:15].
* **Claim:** Claude can ingest the offer equation, build a `.skill` file, and execute live audits [09:40 - 12:40].
  * *Evidence Shown:* Aaron live-demonstrates the desktop Claude Cowork interface, prompts it via WhisperFlow, inspects the created `clothing-offer-equation` skill, and runs an audit that renders a formatted HTML diagnostic report [10:20 - 12:40, 15:04 - 16:46].
* **Claim:** Chubbies DTC has 615+ active codes and 40% promotional sales eroding margins [15:37 - 16:06].
  * *Evidence Shown:* The Claude audit report synthesizes public web scrapings and external DTC research data on Chubbies inside the generated HTML report [15:30 - 16:16].

---

## Top 5 takeaways for a clothing brand media buyer

1. **Audit the Offer Before Redesigning Meta Ads:** If an ad campaign with strong CTR sees conversion rates plummet, calculate the COE score ($\frac{S \times QF}{W + SF + PS}$) before blaming ad fatigue or Meta's algorithm [00:45 - 01:54].
2. **Never Scale Spend on an Offer Scored Below 4:** An offer scoring under 4 has severe structural friction (checkout issues, excessive delivery times, or price resistance). Extra ad budget will be wasted [07:36 - 07:41].
3. **Keep the Conversion Path Under 3 Clicks:** Ensure your mobile landing page allows prospective buyers to select a size and reach payment in fewer than 3 clicks to prevent shopping friction ($SF$) from killing conversion rates [05:32].
4. **Fix Brand Positioning When Identity Fails:** If an audience isn't connecting with your ad hooks, stop tweaking ad visual styles. Rebuild your Customer Avatar document to identify the specific lifestyle persona your audience wants to project [14:02 - 14:38].
5. **Counter Price Resistance with Value Campaigns, Not Discounts:** When ad ROAS falls due to price sensitivity ($PS$), running discount codes causes long-term margin damage. Instead, launch a value-justification sequence highlighting fabric GSM, craftsmanship, durability, and brand prestige [20:25 - 20:48].
