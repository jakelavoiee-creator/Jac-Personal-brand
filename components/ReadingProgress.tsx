"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (bar.current) bar.current.style.width = `${Math.min(100, p * 100)}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="progress-rail" aria-hidden><i ref={bar} /></div>;
}
