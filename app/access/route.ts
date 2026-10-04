import { NextResponse } from "next/server";
import { grantAccess } from "@/lib/access";
import { siteUrl, stripe } from "@/lib/stripe";

// GET /access?session_id=cs_… — Stripe's success_url, and the customer's permanent access link.
export async function GET(req: Request) {
  const base = siteUrl(req);
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  const denied = NextResponse.redirect(`${base}/reset?access=denied`);

  if (id === "dev_preview" && process.env.NODE_ENV !== "production") {
    return grantAccess(NextResponse.redirect(`${base}/reset?welcome=1`), id);
  }

  const s = stripe();
  if (!s || !id.startsWith("cs_")) return denied;

  try {
    const session = await s.checkout.sessions.retrieve(id);
    // "no_payment_required" covers 100%-off promo codes (gifts, testimonial copies).
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return denied;
  } catch {
    return denied;
  }

  return grantAccess(NextResponse.redirect(`${base}/reset?welcome=1`), id);
}
