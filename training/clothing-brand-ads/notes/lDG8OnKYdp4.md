---
url: https://www.youtube.com/watch?v=lDG8OnKYdp4
video_id: lDG8OnKYdp4
title: How To Setup Facebook Pixel For Shopify & Conversion API Integration
channel: Sasha Polischuk
why_studied: tracking setup
watched_by: gemini-3.6-flash
studied_at: 2026-10-27 07:18 UTC
---

Here is the structured breakdown of the video tutorial:

## Title & channel
* **Channel:** Nurdin Philip
* **Video Title:** How to Install Facebook Pixel & Conversions API on Shopify (Step-by-Step Tutorial)

## One-line thesis
Connecting a Meta Pixel and Conversions API to Shopify requires installing Meta’s official Facebook & Instagram sales channel, setting Data Sharing to "Maximum," and validating event tracking via Events Manager test traffic and Meta Pixel Helper [00:08 - 04:05].

---

## Method (ordered, step by step)

1. **Create/Identify Dataset (Pixel) in Meta Business Manager [00:25 - 00:46]:**
   * Navigate to `business.facebook.com/settings` [00:33].
   * On the left menu, expand **Data Sources** and click **Data sets** [00:36].
   * Click **Add** to create a new dataset/pixel if not already created [00:40].

2. **Install Facebook & Instagram Sales Channel in Shopify [00:48 - 01:02]:**
   * Go to the Shopify Admin Dashboard [00:48].
   * Click on **Apps** in the sidebar, search for `Facebook`, and select the official **Facebook & Instagram** app [00:54].
   * Click **Install** -> confirm **Install app** [00:58 - 01:01].

3. **Connect Facebook Account & Business Assets [01:02 - 01:40]:**
   * Click **Get started** under "Connect your Shopify store to Facebook and Instagram" [01:04].
   * Click **Connect account** and authorize log-in to your personal Facebook profile [01:12].
   * Under **Business assets**, scroll to find and select the correct Business Manager and Facebook Page associated with your store [01:16 - 01:38]. Click **Connect** [01:40].

4. **Enable Maximum Data Sharing & Connect Pixel [01:41 - 02:07]:**
   * Under **Data sharing**, select **Maximum** [01:43]. *(This enables Meta Pixel, Advanced Matching, and Conversions API simultaneously)* [01:48]. Click **Save** [01:52].
   * Under **Connect a pixel to track customer behavior**, select your designated dataset/pixel (e.g., "Shopify Demo Pixel") and click **Connect** [01:54 - 02:01].
   * Accept the **Terms and conditions** checkbox and click **Submit for review** [02:02 - 02:06]. Wait for channel setup to finish [02:07 - 02:13].

5. **Verify Partner Integration in Meta Events Manager [02:34 - 03:20]:**
   * Return to Meta Business Settings -> **Data sets** -> select the pixel -> click **Open in Events Manager** [02:42].
   * Navigate to **Settings** -> scroll down to **Set up using a partner integration** / **Choose a Partner** [02:48 - 02:51].
   * Select **Shopify** [02:53].
   * Check "I've completed the setup on Shopify" and click **Next** [02:56].
   * In **Verify your pixel is working correctly**, paste your store URL (`https://sp-basic-shop.myshopify.com`) and click **Send test traffic** [03:00 - 03:06].
   * Browse around the test site/products to generate live events [03:07 - 03:14].
   * Verify status changes to **Active** green text in Events Manager -> click **Next** -> click **Finish** [03:15 - 03:20].

6. **Validate Event Firing with Meta Pixel Helper [03:21 - 04:05]:**
   * Install the **Meta Pixel Helper** Chrome extension [03:29].
   * Visit your store homepage -> verify `PageView` event fires [03:36].
   * Click a product page -> verify `PageView` and `ViewContent` fire [03:41].
   * Click **Add to Cart** -> verify `AddToCart` fires [03:45].
   * Click **Checkout** -> verify `InitiateCheckout` fires [03:58].

---

## Meta ads specifics
*none shown*

---

## Creative specifics
*none shown*

---

## Claude / AI workflow
*none shown*

---

## Offer, product, landing page & Shopify CRO
* **App Used:** Official Meta "Facebook & Instagram" app in the Shopify App Store [00:58].
* **Data Preference Level:** Maximum (uses server-side Conversions API + browser-side Pixel + Advanced Matching) [01:44].
* **Demo Store URL:** `https://sp-basic-shop.myshopify.com` [03:04].
* **Products / Pages Tested:** "Reusable Zip Bag" product page, Cart page, Checkout page [03:12, 03:39, 03:53].

---

## Metrics & benchmarks quoted (with numbers)
*none shown*

---

## Mistakes / warnings called out
* **Wrong Business Manager Selection:** If you manage multiple Business Managers, ensure you select the correct Business Manager in Shopify during asset setup [01:25]. Selecting the wrong Business Manager will make your target pixel invisible/unavailable in the connection dropdown [01:30].
* **Leaving Setup Incomplete:** Do not stop right after clicking "Submit for review" in Shopify; you must complete the partner integration verification step inside Meta Events Manager to confirm event flow [02:15].

---

## Claims vs. evidence

| Claim | Evidence Shown on Screen |
| :--- | :--- |
| Shopify Meta Pixel setup is "by far the easiest" compared to other platforms [00:15]. | The complete setup, connection, and test verification was demonstrated in under 4 minutes live on screen [00:25 - 04:05]. |
| Setting Data Sharing to "Maximum" enables Conversions API automatically without third-party apps [01:45]. | Shopify setting panel displays: "Maximum... Data is shared using the Meta Pixel, advanced matching and Conversions API" [01:44]. |

---

## Top 5 takeaways for a clothing brand media buyer

1. **Use "Maximum" Data Sharing:** Always select Maximum during Shopify setup to enable browser Pixel, Conversions API (CAPI), and Advanced Matching in one step without paying for third-party tracking apps [01:43].
2. **Double-Check Business Manager Ownership:** Ensure the Facebook profile you log into owns the specific Business Manager holding your store's Pixel [01:25].
3. **Always Run Server-Side Verification:** Complete the Shopify Partner Integration inside Events Manager using "Send test traffic" to confirm server-side CAPI connectivity [03:06].
4. **Audit Full E-Commerce Funnel:** Use Meta Pixel Helper extension to manually click through Homepage (`PageView`) -> Product (`ViewContent`) -> Cart (`AddToCart`) -> Checkout (`InitiateCheckout`) before running paid traffic [03:30 - 04:00].
5. **Manage Integrations via Shopify Settings:** If you ever need to change pixels or re-authenticate Business Manager accounts, manage it directly inside Shopify Admin under **Facebook & Instagram > Settings > Share data** [02:19 - 02:32].
