# THE IDENTITY RESET

**WAKE. RESET. BECOME.**

The home of Jac Lavoie's brand: [theidentityreset.com](https://theidentityreset.com) · [@jac_lavoiee](https://instagram.com/jac_lavoiee)

> You are not stuck with the identity you were given.

## Start here

| File | What it is |
|---|---|
| [`docs/BRAND.md`](docs/BRAND.md) | Master Business & Brand Document v1.0: the business spec and source of truth |
| [`CLAUDE.md`](CLAUDE.md) | Condensed operating brief: settled decisions, voice, guardrails |
| [`docs/CONTENT-SOURCES.md`](docs/CONTENT-SOURCES.md) | Every video and book, how it was verified, and the pre-launch checklist |

## The model

```
Content → Comment "RESET" → ManyChat → Follow → THE AWAKENING (free) → THE IDENTITY RESET ($25)
```

## The site

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/awakening` | **THE AWAKENING**: free, one sitting, no email. Five sections with practices and reflection questions, a five-book shelf, one video to watch tonight, then the offer. This is the link ManyChat sends. |
| `/api/checkout` | POST → Stripe Checkout ($25) |
| `/access?session_id=…` | Stripe success URL. Verifies payment and sets the access cookie. **This link is also the customer's permanent key**: it works on any device. |
| `/reset` | **THE IDENTITY RESET**: 12-month path. NOW · WHY · REFLECT · NEXT, with each month unlocking when the previous one is completed. |

**Where content lives:** `content/awakening.ts`, `content/reset.ts`, and `content/library.ts` (all videos and books). Edit copy there; the design never needs to change.

**No database.** Payment state lives in Stripe. Progress and reflections live in the customer's browser and never leave it.

## Run locally

```bash
npm install
cp .env.example .env.local   # leave Stripe empty to preview: checkout skips payment in dev
npm run dev                  # http://localhost:3000
```

## Go live (≈15 minutes)

1. **Stripe:** create an account. Optionally create a Product "THE IDENTITY RESET" with a $25 one-time Price and copy its `price_…` ID.
2. **Vercel:** import this repo. Set the environment variables:
   - `STRIPE_SECRET_KEY`: the live secret key
   - `STRIPE_PRICE_ID`: optional
   - `ACCESS_SECRET`: output of `openssl rand -hex 32`
   - `NEXT_PUBLIC_SITE_URL`: `https://theidentityreset.com`
3. **Domain:** point theidentityreset.com to Vercel.
4. **Stripe settings:** turn on *Email customers about successful payments*. If a buyer loses their access link, find their payment in Stripe Dashboard → Payments, copy the Checkout Session ID (`cs_…`), and send them `https://theidentityreset.com/access?session_id=cs_…`.
5. **ManyChat:** the "RESET" comment flow → follow gate → send `https://theidentityreset.com/awakening`.
6. Click every link in `docs/CONTENT-SOURCES.md` once.
