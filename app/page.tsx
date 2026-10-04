import Link from "next/link";
import { Footer, Nav } from "@/components/Chrome";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="hero">
          <p className="kicker">THE IDENTITY RESET</p>
          <h1 className="display d-xl">You are not stuck with the identity you were given.</h1>
          <p className="lede measure" style={{ marginTop: 32 }}>
            Most of who you think you are was installed by family, school, the feed, and fear.
            This is a path to see it, question it, and consciously choose who you become.
          </p>
          <div className="btn-row" style={{ marginTop: 40 }}>
            <Link href="/awakening" className="btn">Start THE AWAKENING</Link>
            <span className="muted">Free · about 20 minutes · no email needed</span>
          </div>
        </section>

        <section className="section">
          <div className="measure stack">
            <p className="kicker">Why this exists</p>
            <h2 className="display d-l">I&apos;m not at the finish line. I&apos;m in the process.</h2>
            <p className="lede">
              Six years of books, podcasts, teachers, and experiments, compressed into a path you can
              actually walk. Not a guru. Not a course platform. A perspective, and the order I wish
              I&apos;d found things in.
            </p>
            <p>
              <Link href="/awakening" className="btn ghost">Begin</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
