---
url: https://www.youtube.com/watch?v=pjkqcWoN0NA
video_id: pjkqcWoN0NA
title: Klaviyo Email Marketing Flows Tutorial for 2026 (FULL SETUP)
channel: Max Sturtevant
why_studied: retention flows
watched_by: gemini-3-flash-preview
studied_at: 2026-10-27 06:17 UTC
---

## Title & channel
* **Title:** Klaviyo Email Flows Tutorial (2026 Optimized) - How to Set Up Your Core Flows
* **Channel:** Max Sturdivant

## One-line thesis
Automate 90% of your email revenue by setting up six core Klaviyo flows (Welcome, Site Abandon, Browse Abandon, Cart/Checkout Abandon, Post-Purchase, and Winback) using a "Graphic-to-Text" cadence and precise behavioral triggers [02:15].

## Method (ordered, step by step)
1. **Define the Behavioral Trigger:** Identify specific actions (Active on site, View Product, Added to Cart, Checkout Started, Placed Order) to start each flow [00:51].
2. **Apply Profile Filters:** Essential to ensure users don't receive irrelevant emails. Standard filter: "Placed Order zero times since starting this flow" [04:32].
3. **Configure Time Delays:** Set specific intervals for each flow stage (e.g., 30 mins for Cart Abandon, 1 hour for Browse Abandon, 3 hours for Site Abandon) [05:19].
4. **Disable Smart Sending:** Manually turn off the "Smart Sending" (clock icon) for every email in every flow to ensure high-intent users aren't skipped [05:53].
5. **Design in Figma/Canva:** Create graphic-heavy emails, slice them into images, and upload to Klaviyo to bypass design limitations [11:00].
6. **Implement Dynamic Blocks:** Drag in product blocks for Browse and Cart abandonment that pull the exact item the user was viewing [12:12].
7. **Deploy Text-Based Emails:** Alternate polished graphics with plain text "Founder/Team" emails to cut through inbox noise [08:11].
8. **Set Live:** Review flow logic and switch status from "Draft" to "Live" [14:41].

## Meta ads specifics
**None shown.** (The video is exclusively focused on post-click retention and Klaviyo infrastructure).

## Creative specifics
* **Formats:** "Graphic-heavy" sliced images alternating with "Text-only" (HTML-free) emails [11:10].
* **Graphic-to-Text Cadence:**
    * **Email 1-3:** High-quality branded graphics designed in Figma [07:10].
    * **Email 4:** Plain text email appearing as a native Gmail/Outlook message [09:53].
* **Layout Formula (Welcome Flow):** 
    * Email 1: Welcome + Discount + Exploration [06:55].
    * Email 2: Brand Story + Benefits + Offer Reminder [07:41].
    * Email 3: Urgency (48-hour expiration) + Social Proof + Support block [08:00].
    * Email 4: Text-based note from the Founder [08:11].
* **Dynamic Content:** Use "Klaviyo Dynamic Blocks" in abandonment flows to show the specific SKU viewed or carted [11:18].
* **Linking:** Browse/Cart abandonment buttons should link to `{{ event.URL }}` to take the user directly back to the specific product page [12:56].

## Claude / AI workflow
* **Klaviyo AI:** The dashboard shows a "Create with AI" button during flow creation to generate copy/structure automatically [03:19], though the creator manually builds them for the tutorial to ensure accuracy.

## Offer, product, landing page & Shopify CRO
* **Incentives:** 
    * **Welcome Flow:** 15% off coupon code [07:05].
    * **Site/Browse Abandon:** 10% off "Dynamic" code [18:20].
    * **Winback:** Test tiered offers (10% vs $20 off) [21:13].
* **Shopify Integration:** Triggers like "Active on Site" [19:02] and "Viewed Product" require the Klaviyo-Shopify integration to be enabled.
* **CRO Tactics:** Include a "PS" section in post-purchase emails. It sees 1-2% click-through/order rates from users already in a buying state [16:41].

## Metrics & benchmarks quoted (with numbers)
* **Total Generated:** Creator claims $200,000,000 generated for clients via email in 2 years [00:32].
* **Flow Performance:** Example Welcome Flow generated **$589,188.37** in 30 days ($2.21 per recipient) [02:53].
* **Revenue Attribution:** Core flows can generate **90%** of total flow revenue [02:15].
* **Open Rates:** Dashboard shows an A/B test with a **46.3%** open rate improvement [02:53].
* **PS Click Rate:** 1-2% order rates on the "PS" section of text emails [16:41].

## Mistakes / warnings called out
* **Smart Sending:** **CRITICAL WARNING.** Do not leave Smart Sending on for flows. It skips high-intent users who just received a standard campaign email, costing brands thousands in missed revenue [05:53].
* **Long Delays:** Don't wait 3 days between Welcome emails; users forget the brand. Use 1-day delays [07:29].
* **Missing Site Abandon:** Most brands skip the "Site Abandon" flow (users who browse but don't click a product). Setting this up targets low-intent traffic before they bounce [14:13].
* **Link Errors:** Ensure abandonment links go to the product page, but Cart/Checkout abandonment should link directly to the `/cart` page to reduce friction [23:23].

## Claims vs. evidence
* **Claim:** Emails generated $200M for clients [00:32].
* **Evidence:** Screen shows a Business Performance Summary with **$5,449,392.64** total revenue and **$1,480,418.23** attributed to Klaviyo [02:53].
* **Claim:** Welcome flow is a massive printer. 
* **Evidence:** Dashboard shows 263,281 deliveries for a Welcome Flow resulting in **$589k** in revenue [02:53].

## Top 5 takeaways for a clothing brand media buyer
1. **Target the "Window Shopper":** Set up a "Site Abandonment" flow triggered by "Active on Site" with a 3-hour delay for users who haven't viewed a specific product yet [16:14].
2. **Founder Authority:** Use a plain-text email from the brand founder as the 4th touchpoint in every flow. It feels personal and has significantly higher reply/conversion rates [11:55].
3. **Aggressive Post-Click Retention:** If you are spending on Meta ads, you must disable Klaviyo "Smart Sending" for flows. High-intent ad traffic should never be "skipped" by email automation [05:53].
4. **Behavioral Timing:** Set Cart Abandonment to **30 minutes**, Browse Abandonment to **1 hour**, and Site Abandonment to **3 hours** to match the user's declining intent [21:13].
5. **Exact Winback Logic:** Instead of a generic "90 days since last purchase" trigger, create a **Segment** of people who bought *exactly* 90 days ago and haven't bought since. This allows you to send the email at a specific time (e.g., 1:00 PM) rather than at midnight when the user is asleep [29:48].
