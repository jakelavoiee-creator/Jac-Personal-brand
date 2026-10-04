"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResolvedMonth } from "@/content/reset";
import { Reflection } from "./Reflection";

// Personal operating system for the reset: NOW · WHY · REFLECT · NEXT,
// then the 12-month path. Month N+1 unlocks when month N is marked complete.
// Progress lives in this browser (localStorage).

type Progress = { items: string[]; months: number[] };
const KEY = "tir:progress";
const KIND: Record<string, string> = { video: "Watch", meditation: "Meditate", book: "Read" };

function load(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "");
    return { items: p.items ?? [], months: p.months ?? [] };
  } catch {
    return { items: [], months: [] };
  }
}

export function Journey({ months }: { months: ResolvedMonth[] }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<Progress>({ items: [], months: [] });
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    setProgress(load());
    setReady(true);
  }, []);

  const save = (p: Progress) => {
    setProgress(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  };

  const doneItems = useMemo(() => new Set(progress.items), [progress.items]);
  const doneMonths = useMemo(() => new Set(progress.months), [progress.months]);
  const unlocked = (n: number) => n === 1 || doneMonths.has(n - 1);
  const current = months.find((m) => unlocked(m.n) && !doneMonths.has(m.n)) ?? months[months.length - 1];
  const allDone = doneMonths.size === months.length;

  useEffect(() => {
    if (ready && open === null) setOpen(current.n);
  }, [ready, open, current.n]);

  const toggleItem = (id: string) =>
    save({
      ...progress,
      items: doneItems.has(id) ? progress.items.filter((x) => x !== id) : [...progress.items, id],
    });

  const completeMonth = (n: number) => {
    save({ ...progress, months: [...new Set([...progress.months, n])] });
    const next = months.find((m) => m.n === n + 1);
    setOpen(next ? next.n : n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!ready) return <div style={{ minHeight: "60vh" }} />;

  const nowItem = current.items.find((it) => !doneItems.has(it.id));
  const pct = Math.round((doneMonths.size / months.length) * 100);

  return (
    <>
      <header style={{ padding: "48px 0 56px" }}>
        <p className="kicker">
          {allDone ? "Path complete · start again whenever you're ready" : `Month ${current.n} of 12 · ${current.phase}`}
        </p>
        <h1 className="display d-xl">{current.stage}</h1>
        <p className="lede" style={{ marginTop: 16 }}>{current.headline}</p>
        <div className="bar" aria-label={`${pct}% complete`}><i style={{ width: `${pct}%` }} /></div>
      </header>

      <section className="os" aria-label="Your next step">
        <div>
          <div className="tag">NOW</div>
          {nowItem ? (
            <>
              <div className="now-title">{nowItem.title}</div>
              <p className="muted" style={{ fontSize: 14 }}>{KIND[nowItem.kind]} · {nowItem.teacher}</p>
              <a className="btn" style={{ padding: "14px 20px", fontSize: 12 }} href={nowItem.url} target="_blank" rel="noreferrer">
                {KIND[nowItem.kind]} →
              </a>
            </>
          ) : allDone ? (
            <div className="now-title">Write your Identity Letter.</div>
          ) : (
            <>
              <div className="now-title">Practice + reflect.</div>
              <p className="muted" style={{ fontSize: 14 }}>Everything&apos;s watched. When the practice feels lived in, complete the month.</p>
            </>
          )}
        </div>
        <div>
          <div className="tag">WHY</div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", margin: 0 }}>{nowItem?.why ?? current.why}</p>
        </div>
        <div>
          <div className="tag">REFLECT</div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{current.reflect[0]}</p>
        </div>
        <div>
          <div className="tag">NEXT</div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", margin: 0 }}>{current.next}</p>
        </div>
      </section>

      <section style={{ marginTop: 96 }}>
        <p className="kicker">The path</p>
        {months.map((m) => {
          const isLocked = !unlocked(m.n);
          const isDone = doneMonths.has(m.n);
          const isOpen = open === m.n && !isLocked;
          const allChecked = m.items.every((it) => doneItems.has(it.id));
          const cls = ["month", isLocked && "locked", isDone && "done", m.n === current.n && !allDone && "current"]
            .filter(Boolean).join(" ");

          return (
            <div key={m.n} className={cls}>
              <button
                type="button"
                aria-expanded={isOpen}
                disabled={isLocked}
                onClick={() => setOpen(isOpen ? -1 : m.n)}
              >
                <span className="mn">{String(m.n).padStart(2, "0")}</span>
                <span>
                  <span className="ms">{m.stage}</span>
                  <span className="mh" style={{ display: "block" }}>{isLocked ? `Unlocks after month ${m.n - 1}` : m.headline}</span>
                </span>
                <span className="state">{isDone ? "Complete" : isLocked ? "Locked" : "Open"}</span>
              </button>

              {isOpen && (
                <div className="month-body">
                  <p className="kicker" style={{ marginBottom: 8 }}>Why this month</p>
                  <p className="measure">{m.why}</p>

                  <p className="kicker" style={{ marginTop: 40, marginBottom: 0 }}>Consume</p>
                  {m.items.map((it) => {
                    const done = doneItems.has(it.id);
                    return (
                      <div key={it.id} className={`item${done ? " done" : ""}`}>
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleItem(it.id)}
                          aria-label={`Mark "${it.title}" as done`}
                        />
                        <div>
                          <div className="meta">{KIND[it.kind]} · {it.teacher} · {it.source}</div>
                          <a className="t" href={it.url} target="_blank" rel="noreferrer">{it.title}</a>
                          <p>{it.why}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="practice">
                    <p className="kicker" style={{ marginBottom: 10 }}>Practice · {m.practice.name}</p>
                    <p style={{ margin: 0, color: "var(--ink-2)" }}>{m.practice.how}</p>
                  </div>

                  <p className="kicker" style={{ marginTop: 40, marginBottom: 0 }}>Reflect</p>
                  <div className="measure">
                    {m.reflect.map((q, i) => <Reflection key={i} id={`m${m.n}-${i}`} question={q} />)}
                  </div>

                  <div style={{ marginTop: 48 }}>
                    {isDone ? (
                      <p className="muted">Completed. {m.next}</p>
                    ) : (
                      <>
                        <button className="btn" type="button" disabled={!allChecked} onClick={() => completeMonth(m.n)}>
                          {m.n === months.length ? "Complete the path" : `Complete month ${m.n} · unlock month ${m.n + 1}`}
                        </button>
                        {!allChecked && (
                          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                            Check off everything above first. Most people spend about four weeks here. Don&apos;t rush the integration.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
