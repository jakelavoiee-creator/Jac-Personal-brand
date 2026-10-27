---
url: https://www.youtube.com/watch?v=JhVTBCpo0wc
video_id: JhVTBCpo0wc
title: How to Improve Your EMQ Score on Meta (Event Match Quality)
channel: Jack Newman
why_studied: tracking quality
watched_by: gemini-3.5-flash
studied_at: 2026-10-27 07:42 UTC
---

## Title & channel
* **Title:** How To Improve Your EMQ Score On Meta (Facebook Ads)
* **Channel / Creator:** Jack Newman / UKB Marketing Ltd [00:04]

---

## One-line thesis
Increasing your Meta Event Match Quality (EMQ) score by capturing customer parameters (email, phone, names) from local storage or form inputs using Google Tag Manager or Zapier and passing them via Conversions API (CAPI) significantly improves Meta's user-matching capability and ad performance.

---

## Method (ordered, step by step)

1. **Check Current EMQ Scores in Events Manager** [02:30]
   * Open Meta Events Manager -> Datasets / Pixels.
   * Review the **Event Match Quality** column across all conversion events (PageView, Schedule, Submit Application, Lead, Add to Cart, Purchase).
2. **Inspect Event Quality Parameters** [03:20]
   * Click an event (e.g., `Schedule` or `Lead`) -> **View Details** -> **Event Quality**.
   * Review the **Shared parameters** table to check what percentage of events send parameters like Hashed Email, Phone, First Name, Surname, IP Address, User Agent, `fbp`, and `fbc`.
3. **Identify Missing High-Impact Parameters** [04:37]
   * Review Meta’s "Other parameters" recommendation box for potential score increases (e.g., External ID: +11% lift, Facebook Login ID: +8% lift, Postcode: +7% lift).
4. **Method 1 — Pull Data from Browser Local Storage via GTM** [07:00]
   * For platforms that automatically write user submission data to Local Storage (e.g., GoHighLevel, WebinarJam), inspect DevTools -> `Application` -> `Local Storage` [08:18].
   * Identify the storage key (e.g., `_ud`) storing the user JSON object.
   * Create Custom JavaScript variables in Google Tag Manager (GTM) to extract email, phone, first name, and last name [07:30].
   * In your GTM Meta CAPI tag (e.g., Adsmurai template), map these GTM variables into the **Customer Information Parameters** fields [07:27].
5. **Method 2 — Capture Input Values on Custom Web Forms via GTM Listener** [09:40]
   * For standard forms (e.g., Webflow, HTML forms) that do not save data to Local Storage, create a Custom JS listener tag in GTM that fires on form field input/submission [10:45].
   * Have the tag capture typed values (name, email) and write them into browser Local Storage [10:50].
   * Retrieve those Local Storage keys with GTM Custom JS variables and attach them to your Meta CAPI tag [11:30].
6. **Method 3 — Send Server-Side Parameters via Zapier / Make** [12:48]
   * Create a Zap: Trigger = Source platform event (e.g., Shopify "New Order" or CRM Lead creation) [13:15].
   * Action = **Facebook Conversions** -> **Send Purchase Event** (or Send Lead Event) [13:45].
   * Map customer parameters (Email, Phone Number, First Name, Last Name, City, State, Country Code, Zip Code, External ID, Client IP, Client User Agent, Click ID) from the trigger step into the Facebook Conversions module [14:15].

---

## Meta ads specifics (account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution)

* **Campaign Objective:** Optimized for conversion/action events (`Lead`, `Purchase`, `Schedule`, `Submit Application`) [00:45].
* **User-Matching / Targeting Mechanism:** EMQ acts as an automated algorithmic match engine. When high-quality hashed customer data is returned via CAPI, Meta matches the website converter back to their specific Facebook/Instagram account [01:00]. This allows Meta's system to automatically locate similar high-intent users without needing manual Lookalike audiences [01:25].
* **Account Structure, Budgets, Bidding, Placements, Scaling/Kill Rules, Attribution:** *None shown / discussed in video.*

---

## Creative specifics (formats, hooks, angles, UGC/static/video, copy formulas, volume of creatives, iteration loop)

* *None shown / discussed in video.*

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)

* **Tool Mentioned:** ChatGPT / LLMs [09:18, 11:20]
* **Workflow:** Use ChatGPT to write custom JavaScript code for GTM variables or form listener tags if you lack coding knowledge.
* **Prompt Strategy (Verbatim guidance from speaker):**
  * *"Write me a custom JavaScript variable for Google Tag Manager to pull in this information from this form... here is the platform I'm using, and here it is in local storage."* [09:20]

---

## Offer, product, landing page & Shopify CRO

* **Landing Pages Shown:**
  * UKB Marketing booking page (`/schedule-a-call`) with embedded calendar widget [06:53].
  * Thank You page (`/vsl-thank-you`) containing client testamonial video embeds [06:59].
  * Agency website footer form ("Get Insights") with `Name`, `Email Address`, and dropdown fields [10:25].
* **Local Storage Data Extraction:**
  * Demonstrated Chrome DevTools (`Inspect` -> `Application` -> `Storage` -> `Local Storage`) on `https://www.ukbmarketing.com` [08:18].
  * Key `_ud` stores JSON object: `full_address`, `company_name`, `email`, `phone`, `first_name`, `last_name` [08:35].

---

## Metrics & benchmarks quoted (with numbers)

* **Schedule Event EMQ:** 8.8 / 10 [02:50]
  * Email address (Hashed): 81.82% of total events
  * IP address: 100%
  * User agent: 100%
  * Phone number (Hashed): 81.82%
  * Browser ID (`fbp`): 100%
  * First name (Hashed): 81.82%
  * Surname (Hashed): 81.82%
  * Click ID (`fbc`): 95.45%
* **PageView Event EMQ:** 6.1 / 10 [03:01]
* **Submit Application Event EMQ:** 6.1 / 10 [03:05]
* **Lead Event EMQ:** 9.3 / 10 [03:07, 05:20]
  * Email address: 100%
  * IP address: 100%
  * User agent: 100%
  * Phone number: 100%
  * Browser ID (`fbp`): 100%
  * First name: 100%
  * Surname: 87.18%
  * Click ID (`fbc`): 90.32%
* **Reported Conversion Lift from CAPI:** +100% additional conversions reported vs Pixel alone [03:21, 05:24].
* **Potential Parameter EMQ Lift (Events Manager Estimates):**
  * External ID: +11.00% increase in EMQ score [04:37]
  * Facebook Login ID: +8.00% increase in EMQ score [04:42]
  * Postcode: +7.00% increase in EMQ score [04:44]

---

## Mistakes / warnings called out

1. **Expecting high EMQ on PageView events:** Page views do not require form submissions, so email/phone parameters are naturally absent. A PageView EMQ of ~6.1/10 is normal and expected [06:08].
2. **Deduplication failure with Zapier + Browser Pixel:** If you send CAPI events via Zapier AND browser events from the site without passing identical `event_id` values, Meta cannot deduplicate them, leading to double-reported conversions [15:15].
3. **Fixing Zapier Deduplication:** If you cannot match `event_id` between browser pixel and Zapier, turn off browser event tracking for that specific event and rely 100% on CAPI via Zapier [15:57].
4. **Browser-only tracking:** Relying only on browser pixel tracking limits customer parameter capture due to browser privacy restrictions; CAPI setup is mandatory to achieve high EMQ [05:50].

---

## Claims vs. evidence (results claimed, and what proof was actually shown on screen)

* **Claim:** Passing enriched customer parameter data via CAPI increases EMQ scores and increases reported conversions.
* **Evidence Shown:** Live screen capture of Meta Events Manager dataset ("PKH Pixel") displaying real EMQ scores (`Lead`: 9.3/10, `Schedule`: 8.8/10), breakdown percentages, and a "+100% additional conversions reported with Conversions API vs pixel alone" banner [03:21, 05:20].

---

## Top 5 takeaways for a clothing brand media buyer

1. **Audit Your Purchase & Add-to-Cart EMQ Scores:** Go to Meta Events Manager -> Datasets -> Event Quality. Ensure key e-commerce events (`Purchase`, `Add to Cart`, `Initiate Checkout`) have an EMQ score above 8.0/10.
2. **Pass Complete Checkout Parameters:** Map all customer fields from Shopify (Email, Phone, First/Last Name, City, State, Postal Code, Country, `fbp`, `fbc`) into your Meta Conversions API setup to maximize match rate.
3. **Strictly Enforce `event_id` Deduplication:** Verify that your browser pixel and server CAPI implementations send matching `event_id` values on `Purchase` events to avoid duplicate sales data in Ads Manager.
4. **Capture Pre-Purchase Leads in Local Storage:** If collecting emails via popups or pre-checkout quizzes, use GTM or custom JS to store inputs in browser Local Storage so pre-purchase events (`Lead`, `CompleteRegistration`) carry match parameters.
5. **Use AI to Generate GTM Scripts:** If your store uses custom forms or non-standard funnel tools, use ChatGPT to generate custom GTM JavaScript scripts that read input fields or local storage objects into GTM variables.
