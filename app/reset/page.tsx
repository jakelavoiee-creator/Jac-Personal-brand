import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton, Footer, Nav } from "@/components/Chrome";
import { Journey } from "@/components/Journey";
import { currentAccess } from "@/lib/access";
import { resolveMonths } from "@/content/reset";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "My Reset · THE IDENTITY RESET", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; access?: string }>;
}) {
  const params = await searchParams;
  const sessionId = await currentAccess();

  if (!sessionId) {
    return (
      <>
        <Nav right={<Link href="/awakening" className="link">The Awakening</Link>} />
        <main className="wrap">
          <section className="hero measure">
            <p className="kicker">THE IDENTITY RESET</p>
            <h1 className="display d-l">
              {params.access === "denied" ? "That access link didn't work." : "This is where the path lives."}
            </h1>
            <p className="lede" style={{ margin: "28px 0 40px" }}>
              {params.access === "denied"
                ? "If you've paid, open the access link from your purchase on this device. If it still won't open, DM “ACCESS” to @jac_lavoiee and we'll sort it."
                : "Twelve months, one stage at a time. If you've already joined, open your access link on this device. If not, start with THE AWAKENING. It's free."}
            </p>
            <div className="btn-row">
              <CheckoutButton />
              <Link href="/awakening" className="btn ghost">Start free</Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const accessLink = `${origin}/access?session_id=${sessionId}`;

  return (
    <>
      <Nav right={<Link href="/awakening" className="link">The Awakening</Link>} />
      <main className="wrap">
        {params.welcome && (
          <div className="notice">
            <p className="kicker" style={{ marginBottom: 8 }}>You&apos;re in. Welcome to the reset.</p>
            <p style={{ marginBottom: 8 }}>
              <b>Bookmark this link.</b> It&apos;s your key. Open it on any device to get back in:
            </p>
            <code>{accessLink}</code>
          </div>
        )}
        <Journey months={resolveMonths()} />
      </main>
      <Footer />
    </>
  );
}
