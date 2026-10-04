import { NextResponse } from "next/server";
import { PRICE_CENTS, siteUrl, stripe } from "@/lib/stripe";

// POST /api/checkout → 303 to Stripe Checkout (hosted). Works as a plain <form> post.
export async function POST(req: Request) {
  const base = siteUrl(req);
  const s = stripe();

  if (!s) {
    if (process.env.NODE_ENV !== "production") {
      // Local preview without Stripe keys: skip payment.
      return NextResponse.redirect(`${base}/access?session_id=dev_preview`, 303);
    }
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 500 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: PRICE_CENTS,
              product_data: {
                name: "THE IDENTITY RESET",
                description: "The 12-month path from ground zero to consciously building who you become.",
              },
            },
          },
    ],
    customer_creation: "always",
    allow_promotion_codes: true,
    success_url: `${base}/access?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/awakening#reset`,
  });

  return NextResponse.redirect(session.url!, 303);
}
