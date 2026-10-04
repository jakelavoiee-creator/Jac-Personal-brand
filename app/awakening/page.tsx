import type { Metadata } from "next";
import { CheckoutButton, Footer, Nav } from "@/components/Chrome";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Reflection } from "@/components/Reflection";
import {
  awakeningIntro,
  awakeningSections,
  awakeningTonight,
  awakeningTruth,
  resolveShelf,
} from "@/content/awakening";
import { library } from "@/content/library";
import { monthOutline } from "@/content/reset";

export const metadata: Metadata = {
  title: "THE AWAKENING · THE IDENTITY RESET",
  description: "You were never taught you only get one life. A free, one-sitting perspective shift.",
};

const phases = ["WAKE", "RESET", "BECOME"] as const;

export default function Awakening() {
  const shelf = resolveShelf();
  const tonight = library[awakeningTonight.key];

  return (
    <>
      <ReadingProgress />
      <Nav right={<a href="#reset" className="link">The full path</a>} />
      <main className="wrap">
        {/* ── Opening: BLIND ── */}
        <header className="hero">
          <p className="kicker">{awakeningIntro.kicker}</p>
          <h1 className="display d-xl">{awakeningIntro.title}</h1>
          <div className="measure" style={{ marginTop: 40 }}>
            {awakeningIntro.body.map((p, i) => (
              <p key={i} className={i === 0 ? "lede" : undefined}>{p}</p>
            ))}
          </div>
        </header>

        {/* ── 01–05 ── */}
        {awakeningSections.map((s) => (
          <section key={s.id} id={s.id} className="section chapter">
            <div className="num">{s.number}</div>
            <div className="measure">
              <p className="kicker">{s.label}</p>
              <h2 className="display d-l" style={{ marginBottom: 36 }}>{s.title}</h2>
              {s.body.map((p, i) => <p key={i}>{p}</p>)}
              {s.line && <p className="pull">{s.line}</p>}
              {s.practice && (
                <div className="practice">
                  <p className="kicker" style={{ marginBottom: 14 }}>Do this now · {s.practice.name}</p>
                  <ol>{s.practice.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
                </div>
              )}
              <p className="kicker" style={{ marginTop: 48, marginBottom: 0 }}>Ask yourself</p>
              {s.questions.map((q, i) => (
                <Reflection key={i} id={`${s.id}-${i}`} question={q} />
              ))}
            </div>
          </section>
        ))}

        {/* ── The Shelf ── */}
        <section id="shelf" className="section chapter">
          <div className="num">06</div>
          <div className="measure">
            <p className="kicker">THE SHELF</p>
            <h2 className="display d-l">Five books. In this order.</h2>
            <p style={{ marginTop: 28 }}>
              The order matters more than the list. Each one makes the next one land harder.
              Don&apos;t binge them. Read one, live with it, then move on.
            </p>
            <ol className="shelf">
              {shelf.map((b) => (
                <li key={b.title}>
                  <div>
                    <h3><a href={b.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{b.title}</a></h3>
                    <p className="by">{b.teacher}</p>
                    <p style={{ margin: 0, color: "var(--ink-2)" }}>{b.why}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="kicker" style={{ marginTop: 80 }}>Watch tonight</p>
            <a className="feature" href={tonight.url} target="_blank" rel="noreferrer">
              <p className="by muted" style={{ margin: 0, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {tonight.teacher} · {tonight.source}
              </p>
              <p className="display d-m" style={{ margin: "12px 0 16px" }}>{tonight.title}</p>
              <p style={{ color: "var(--ink-2)" }}>{awakeningTonight.why}</p>
              <span className="play">▶ Watch on YouTube</span>
            </a>
          </div>
        </section>

        {/* ── THE TRUTH → offer ── */}
        <section id="reset" className="section">
          <div className="measure">
            <p className="kicker">{awakeningTruth.label}</p>
            <h2 className="display d-l" style={{ marginBottom: 36 }}>{awakeningTruth.title}</h2>
            {awakeningTruth.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <div style={{ marginTop: 96 }}>
            <p className="kicker">THE IDENTITY RESET</p>
            <h2 className="display d-xl" style={{ maxWidth: "14ch" }}>Here&apos;s the path I wish I had when I started.</h2>
            <p className="lede measure" style={{ marginTop: 28 }}>
              Twelve months. One stage at a time. The exact videos, teachers, books, and practices,
              in the order that makes them work, with why each one matters and what to reflect on.
              Each month unlocks when you finish the one before it, so you integrate it instead of
              binging it.
            </p>

            <div className="map">
              {phases.map((ph) => (
                <div key={ph} className="col">
                  <div className="phase">{ph}</div>
                  <ol>
                    {monthOutline.filter((m) => m.phase === ph).map((m) => (
                      <li key={m.n}><span>{String(m.n).padStart(2, "0")}</span><span><b>{m.stage}</b> · {m.headline}</span></li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <ul className="includes">
              <li><b>A curated path, not a pile of links</b>More than 40 steps: hand-picked videos, meditations, and books from Dr. Joe Dispenza, David Ghiyam, Gary Brecka, Eckhart Tolle, Shi Heng Yi, Andrew Huberman, Simon Sinek, Robert Greene, and Lewis Howes.</li>
              <li><b>Context for every piece</b>Why this one, why now, and how it connects to what came before.</li>
              <li><b>A practice every month</b>One concrete thing to do daily, so the ideas turn into who you are.</li>
              <li><b>Your personal operating system</b>Always know what to do NOW, WHY it matters, what to REFLECT on, and what comes NEXT.</li>
            </ul>

            <div className="price">
              <span className="amt">$25</span>
              <span className="muted">One time. Twelve months of direction. Yours to keep.</span>
            </div>
            <CheckoutButton />
            <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
              Secure checkout by Stripe. You get instant access to Month 1.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
