---
url: https://www.youtube.com/watch?v=VLFpeLyWXHg
video_id: VLFpeLyWXHg
title: Why Facebook Ads Don't Scale (Fix Event Match Quality Now)
channel: Grant Cooper
why_studied: tracking quality
watched_by: gemini-3.5-flash-lite
studied_at: 2026-10-27 06:11 UTC
---

## Title & channel
* **Title / Video context:** "What is Facebook Event Match Quality & How To Increase It" (Presented by Grant Kiera, discussing data tracking for ad campaigns).
* **Channel:** Mentioned in video as "Cometly" (marketing analytics software brand).

## One-line thesis
If your Meta ads are underperforming despite great creative, copy, targeting, and landing pages, your data tracking fundamentals—specifically Meta’s **Event Match Quality** score via Conversions API—are likely broken, and failing to fix them will prevent ad campaigns from scaling.

## Method (ordered, step by step)
1. **Navigate to Events Manager [00:00]:** Open Meta Business Suite / Events Manager to inspect Data Sources and Pixel event performance.
2. **Review Event Match Quality Scores [01:28]:** Check the score out of 10 for key conversion events (e.g., Contact, MQL, Purchase, Lead, PageView) in the dashboard.
3. **Identify Data Gaps / Low Scores [02:07]:** Look for scores falling below 8.5/10 (such as PageView at 5.6/10 or Website Visit at 6.7/10).
4. **Inspect Shared Parameters [03:36]:** Click on specific events (e.g., MQL) to review Customer Information parameters (Email, IP Address, User Agent, Phone Number, External ID, City, State, ZIP, Country, Click ID).
5. **Analyze Recommendations for Coverage [12:30]:** Review Meta’s warnings ("Increase coverage", "Send more parameters") to see which missing parameters (like Facebook Login ID or Date of Birth) can boost match quality.
6. **Implement Conversions API Solution [05:13]:** Ensure server-side tracking (via CRM, payment processor, or a dedicated tracking tool like Cometly or Zapier) properly hashes and passes high-priority and medium-priority parameters to Meta.

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)
* **Account structure:** Multi-pixel/data-source setup shown for marketing operations [01:20].
* **Campaign objective:** Optimizing for bottom-funnel conversion events (MQL, Leads, Purchases) [03:38].
* **Budgets:** Mentions scaling ad campaigns into the $10s, $20s, $30s, $100s, and $1,000s/day [00:46].
* **Bidding:** Not explicitly configured on screen; focuses on data ingestion.
* **Targeting:** Relies heavily on accurate event matching to let Meta's algorithm deliver ads to users more likely to convert [03:56].
* **Placements:** Not specified.
* **Testing cadence:** Not specified.
* **Scaling rules:** Good data quality is stated as the literal building block required to scale ad spend; scaling fails without proper match quality [02:58].
* **Kill rules:** If campaigns get a couple of sales and then fall apart, it is often due to poor data matching [00:36].
* **Attribution:** Better event match quality helps attribute conversions to ads and lowers Cost Per Acquisition (CPA) [04:04].

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)
* **Formats / UGC / static / video:** A mockup diagram shows a mobile ad creative featuring a portrait photo and a headline ("Grow bookings with easy-to-use online appointments") [07:30].
* **Hooks / angles / copy formulas / volume / iteration:** The speaker emphasizes that regardless of how good your creative, copy, targeting, landing page, or offer is, ad campaigns will fail to scale without baseline technical data practices [00:20].

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)
* *None shown.*

## Offer, product, landing page & Shopify CRO
* **Offer & Landing Page:** The video illustrates a funnel workflow starting with an ad click leading to a website/landing page [07:30], followed by an opt-in/get-in-touch form (asking for Name, Email, Phone Number, and service interest) [08:10].
* **Shopify / E-commerce context:** E-commerce brands must deliver products, making purchase events data-rich [11:44], whereas lead-gen forms rarely capture full address/location data upfront without destroying conversion rates [11:27].

## Metrics & benchmarks quoted (with numbers)
* **Event Match Quality Score benchmarks:** 
  * Target range: **Above 8.5 / 10** [02:08].
  * Example accounts shown: MQL event match quality at **9.3 / 10** [03:46]; PageView event match quality at **5.6 / 10** [10:49]; Website Visit match quality at **6.7 / 10** [12:43].
* **Potential Outcome / Lift percentages:**
  * Sending *Facebook Login ID* increases event match quality by **12.00%** [12:35].
  * Sending *Date of Birth* increases event match quality by **9.00%** [12:36].

## Mistakes / warnings called out
* Assuming standard CRM conversions APIs (HubSpot, GoHighLevel, Salesforce, etc.) or payment processors automatically function properly out-of-the-box for advanced Meta matching [02:16]. Developers at these software companies often take a half-assed approach to tech implementation [02:30].
* Relying solely on the Meta Pixel without Conversions API [01:46].
* Asking leads to fill out full addresses and locations on opt-in/lead-gen forms, which drastically hurts conversion rates [11:28].

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)
* **Claims:** Higher event match quality results in better ad performance, accurate attribution, and lower cost per action [03:56].
* **Evidence shown:** Live navigation of Meta Events Manager dashboards showing actual match quality scores (9.3/10, 5.6/10, 6.7/10), parameter breakdown tables (Email, IP Address, User Agent, Browser ID, ZIP, Country, City, State, Click ID), and Meta's official Business Help Center documentation regarding event matching priorities and potential percentage lifts [03:42, 05:50, 12:24].

## Top 5 takeaways for a clothing brand media buyer
1. **Data quality dictates scale:** Even with world-class creative and copy, ad accounts cannot scale past initial testing budgets if Event Match Quality scores are poor [00:20].
2. **Aim for 8.5+ out of 10:** Monitor Event Match Quality in Meta Events Manager for critical events (PageView, Add to Cart, Initiate Checkout, Purchase); scores below 8.5 indicate broken tracking [02:08].
3. **Prioritize high-value parameters:** Ensure server-side data passing via Conversions API captures high-priority parameters like hashed Customer Email and Facebook Click ID (`fbc`/`fbclid`) [05:52].
4. **Don't trust default CRM integrations blindly:** Out-of-the-box CRM or payment gateway CAPI integrations often fail to pass complete customer profile parameters correctly; verify data coverage in Events Manager [02:16].
5. **Leverage automatic form tracking & IP parsing:** Use server-side tools or tracking software to capture browser cookies (`fbp`), user agents, and IP addresses (which can be parsed into city, state, and zip) without adding friction to customer checkout or lead forms [07:45].
