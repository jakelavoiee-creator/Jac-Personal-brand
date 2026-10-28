---
name: clothing-brand-meta-ads
description: Plan, launch, read and scale Meta (Facebook + Instagram) ads for a clothing brand, Aura Miami first. Covers the pre-flight gates (pixel/CAPI/EMQ, unit economics, offer audit, store conversion), the one-campaign structure, creative testing, hooks, UGC/partnership ads, weekly and daily scaling rules, kill rules and the never-do list. Use for "set up my campaign", "launch ads", "how are the ads doing", "should I scale", "kill this ad?", "write ad hooks", "Black Friday ads", "creative test", "ROAS", "CPA", or anything about running paid social for Aura Miami.
---

# Clothing-brand Meta ads (Aura Miami)

**Source of truth:** `training/clothing-brand-ads/PLAYBOOK-DRAFT.md`. It holds 75 cited video notes plus contradictions, so cite it when a rule is challenged. Aura's live decisions are in `strategy/AURA-Q4-2026-PLAN.md`; **they override the playbook.**

## Aura's locked decisions (Jac, 27 Oct 2026)
- **ONE conversion campaign for all of Q4:** Sales objective → Purchase, Highest volume, **one ad set** (Advantage+ audience, US + CA, Advantage+ placements), 6–10 diverse ads named `Concept-Format-Hook-Date`, $40–60/day.
- **No separate lead or promo campaigns.** The email list comes from the Klaviyo **site pop-up**. Black Friday ads go into the same ad set from 26 Nov and are paused on 1 Dec, so learning is never reset.
- **"Members" / VIP is parked until 2027.** No ad, email or page may claim membership perks.
- **Offer:** Black Friday is Buy 2 save 20%, Buy 3+ save 25%, ending Mon 30 Nov 11:59pm ET, with email subscribers 24h early. The core never goes on a flat sale. Christmas cutoff **Wed 9 Dec**.
- **Unit economics** (Tapstitch landed costs incl. shipping + fees):

  | Product | Price | Break-even ROAS |
  |---|---|---|
  | Tee | $55 | 2.04 |
  | Tee | $70 | 1.68 |
  | Tank | $55 | 2.43 |
  | Hoodie | $85 | 1.98 |
  | Hoodie | $100 | 1.74 |
  | Buy-2 bundle | 20% off | ~2.6 |
  | Buy-3 bundle | 25% off | ~3.0 |

  **Lead cold ads with the $100 hoodies and $70 tees.**

## Gates: no spend until all pass
1. **Tracking:** Shopify FB&IG app with data sharing on **Maximum** (Pixel + CAPI). Then Events Manager → Send test traffic, check with Pixel Helper, and make one real purchase. Purchase **EMQ ≥ 8.5–9**.
2. **Unit economics known** (above) and a **hard floor** daily spend.
3. **Offer audit:** Style × Confidence ÷ (Wait + Friction + Price). Fix the biggest denominator first.
4. **Store converts:**
   - ≤3 taps from product page to paid
   - real on-body photos
   - size guide and "model wears M"
   - shipping, returns and duties lines under Add to Cart
   - ≥10% of product views → Add to Cart
5. **The IG profile can close the sale** (highlights: About, Drop, Reviews, Shipping, FAQ).

## Running it
- **Broad targeting:** country, age, gender only. **The creative is the targeting.**
- **Turn off:** Advantage+ creative enhancements and "Optimize website destination". Link to the product page, not the homepage.
- **Attribution:** 7-day click / 1-day view.
- **Hands off for 7 days** after launch.
- **Phase 1 (under ~50 purchases a week):**
  - **Monday:** if 3-day *and* 7-day ROAS ≥ target → +20%. If only 7-day passes → hold and add creative. If both fail → −20%, never below the floor.
  - **Thursday:** launch 3 new concepts.
- **Phase 2 (50+ a week):** read the last 3 full days every morning. ≥ break-even → +5%. Below for 3 days → check stock, then fatigue, then −5% or refresh.
- **Kill an ad when:**
  - it has spent 3× target CPA with ROAS below target
  - or it has been live 14–30 days and spent <$10 (archive it)
- **Purchases decide.** CTR and CPM are diagnostics only, except in micro-budget tests: CPM <$25, CPC <$1, cost per Add to Cart <$15.
- **Testing:** 80% new concepts, 20% variations. Each variant must be **≥20% different** (Andromeda deduplicates look-alikes). Validate a message with statics first, then scale it with video.
- **Fatigue:** add new ads beside the tired one that change the benefit, use case, point of view or person. Refresh, don't pause.

## Creative
- **Concepts:**
  - founder story (name + title on screen)
  - back-print reveal
  - UGC try-on mid-action with a size callout
  - flat lay
  - us vs mall merch
  - split screen
  - an organic post with proof
  - bundle offer
- **Hook = 4 layers in second zero:** text, sound, visual, vibe. Write 3+ hooks per angle, structurally different.
- **Copy:** under 125 words, the customer's own words, one CTA, no opening question, message match on the landing page.
- **Creators:** modular buys (4 hooks × 2 bodies × 2 CTAs). Run winners as **Partnership ads** with dynamic identity.
- **AI visuals:** allowed for product imagery, but only if garment, print, colour and fit match the real product. **Jack and Ava are brand models, never customers.** Apply Meta's AI disclosure where asked.

## Never
- Fake scarcity, countdowns or stock claims.
- Fake "was" prices.
- Invented reviews or social proof.
- AI personas as customers or testimonials.
- Fake persona or "editorial" pages.
- Cloning competitor assets.
- Hidden pop-up close buttons or guilt-trip opt-outs.
- Optimizing for clicks instead of Purchase.
- Spending-limit browser extensions.
- Scraping emails without consent.

**Persuasion yes, deception no.**

## Tools
- **Meta account:** through Adspirer (`meta_ads_read` / `meta_ads_write`) or Meta's official Ads MCP. **Every write needs Jac's explicit approval**; reads are fine.
- **Store data:** Shopify GraphQL.
- **Adspirer free tier is about 15 calls/month,** so batch reads.
