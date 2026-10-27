---
url: https://www.youtube.com/watch?v=JhVTBCpo0wc
video_id: JhVTBCpo0wc
title: How to Improve Your EMQ Score on Meta (Event Match Quality)
channel: Jack Newman
why_studied: tracking quality
watched_by: gemini-3.5-flash-lite
studied_at: 2026-10-27 06:07 UTC
---

## Title & channel
- Title / video subject: How to improve your EMQ (Event Match Quality) score for Meta ads (Facebook pixel & Conversions API setup)
- Channel: UKB Marketing Ltd (Jack Newman)

## One-line thesis
Improving your Event Match Quality (EMQ) score by sending compliant, hashed customer information (email, phone, name, browser data) via Conversions API alongside pixel events allows Meta to match users who clicked ads to specific customer records, strengthening signals and driving lookalike-like algorithm optimization without needing lookalike audiences.

## Method (ordered, step by step)
1. **Understand EMQ Score**: Explain what Event Match Quality is (how effectively customer information parameters sent with server events match to Meta accounts for ad click attribution) [00:10].
2. **Review Ads Manager Data**: Navigate to Meta Events Manager (Datasets > Pixel) to inspect EMQ scores across different events (Pageview, Schedule, Submit Application, Lead, Add to Cart) [02:31].
3. **Analyze Event Details**: Click into specific events (e.g., "Schedule"), go to Event Quality, and check the percentage of events sending specific parameters (Email, IP address, User agent, Phone number, Browser ID (fbp), First name, Surname, Click ID (fbc)) [03:22].
4. **Identify Gaps**: Note which parameters are missing or have low percentages (e.g., events requiring manual form entry might show lower match quality due to drop-offs) [04:20].
5. **Implement Tracking Setup (Method 1: GTM + Platform Variable)**: 
   - Set up Google Tag Manager (GTM) with a server-side tag provider (e.g., Admurrai Facebook Pixel & Conversions API plugin) [07:03].
   - Add custom customer information parameters in Tag Manager by mapping existing platform variables (e.g., GoHighLevel form variables) [07:27].
6. **Implement Tracking Setup (Method 2: Local Storage / Custom JS)**:
   - Inspect website conversion/thank-you pages using browser developer tools (Application > Local Storage) [08:18].
   - Identify existing platform-generated variables stored in local storage (e.g., `_ud` containing form submission details in GoHighLevel) [08:22].
   - Write or generate custom JavaScript variables to pull user data from local storage into GTM, then pass them to the Meta conversion tag [09:05].
7. **Implement Tracking Setup (Method 3: Zapier Integration)**:
   - Use Zapier (or Make) to bridge offline or platform events (e.g., Shopify New Order) to Meta Conversions Events [12:51].
   - Map customer details (email, first name, last name, city, state, country, zip, external ID, client IP address, client user agent, click ID) from the trigger app into the Facebook Conversions action module [13:59].
8. **Monitor & Verify**: Return to Events Manager to observe EMQ score improvements over time as compliant data flows back through Conversions API [14:35].

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)
- Objectives mentioned: Lead generation campaigns, purchase conversion campaigns [00:44].
- Attribution / Data flow: Layered over Facebook Pixel; requires both Meta Pixel (browser) and Conversions API (server-side) [00:55, 05:51].
- Targeting/Optimization: High EMQ signals help Meta match individual users to ad clicks, enabling the system to find similar purchasers/leads without manually setting up lookalike audiences [01:23].
- Kill/Scaling rules: None explicitly detailed.
- Budgets: None specified.

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)
- None shown or discussed.

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)
- Mentions using ChatGPT to assist with writing custom JavaScript variables for Google Tag Manager [09:17]:
  - Prompt concept: *"Write me custom JavaScript variable for Google Tag Manager to pull in this information from this form/platform and local storage"* [09:21].

## Offer, product, landing page & Shopify CRO
- Platforms referenced for forms/funnels/storefronts: GoHighLevel (calendars, forms, contact pages, thank-you pages), Shopify (New Order triggers), ClickFunnels, WebinarJam, Perspective, WordPress/Webflow [07:00, 08:12, 12:32, 12:40].
- Local storage variables inspected in browser inspector: `_ud` (GoHighLevel user details containing full name, email, phone, address) [08:22].

## Metrics & benchmarks quoted (with numbers)
- EMQ scores shown on screen in Events Manager:
  - Pageview: 6.1 / 10 [03:02]
  - Schedule: 8.8 / 10 [03:04]
  - Submit Application: 6.1 / 10 [03:06]
  - Lead: 9.3 / 10 [03:08]
- Parameter send percentages shown for Schedule event:
  - Email (hashed): 81.82% of total events [03:31]
  - IP address: 100% of total events [03:31]
  - User agent: 100% of total events [03:31]
  - Phone number (hashed): 81.82% of total events [03:31]
  - Browser ID (fbp): 100% of total events [03:31]
  - First name (hashed): 81.82% of total events [03:31]
  - Surname (hashed): 81.82% of total events [03:31]
  - Click ID (fbc): 95.45% of total events [03:31]
- Potential outcome increases in match quality shown in recommendations:
  - External ID: +11.00% increase in event match quality [04:41]
  - Facebook Login ID: +8.00% increase in event match quality [04:41]
  - Postcode: +7.00% increase in event match quality [04:41]

## Mistakes / warnings called out
- Do not rely solely on browser-side pixel tracking or browser data; Conversions API server-side data is required to generate meaningful EMQ scores [05:51].
- Pageview events naturally have lower EMQ scores because users view pages without submitting personal data; focus your optimization efforts on high-value conversion events (leads, checkouts, purchases) [06:07].
- When using Zapier for Conversions API, ensure event IDs match between browser and server events to prevent duplication issues [15:14]. If matching cannot be guaranteed due to random string generation, turn off browser data and rely solely on Conversions API [15:56].

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)
- Claims: Sending compliant customer parameters via Conversions API improves EMQ score, enabling Meta to match ad clicks to actual conversions and find similar audiences more effectively.
- Evidence shown: Live screen walkthrough of Meta Events Manager showing active pixel datasets, EMQ scores out of 10 for specific events (Pageview, Schedule, Lead), parameter percentage breakdowns, Google Tag Manager tag configurations, and browser local storage inspection (Application > Local Storage) demonstrating stored user data variables.

## Top 5 takeaways for a clothing brand media buyer
1. **Prioritize Conversions API (CAPI) Integration**: Pixel-only tracking is insufficient for modern iOS/privacy restrictions; server-side CAPI data passing is mandatory for accurate attribution and algorithm training.
2. **Target High-Value Events for EMQ**: Don't stress over lower EMQ scores on top-of-funnel events like Pageviews; focus on optimizing match quality for Add to Cart, Initiate Checkout, and Purchase events.
3. **Capture & Pass Customer Parameters**: Ensure your checkout and lead forms pass hashed customer data parameters (email, phone, first name, last name, external ID, fbc, fbp) into your tracking setup.
4. **Leverage Local Storage & Tag Manager**: Use GTM alongside platform storage variables (or custom JS) to extract customer details from form submissions and feed them directly into Meta event payloads.
5. **Manage Deduplication Carefully**: When routing server events via Zapier or third-party tools, ensure proper event ID matching between browser and server events to avoid inflating conversion counts through duplication.
