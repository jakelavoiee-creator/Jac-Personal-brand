"use client";

import { useEffect, useState } from "react";

// Answers live only in this browser (localStorage). Nothing is sent anywhere.
export function Reflection({ id, question }: { id: string; question: string }) {
  const key = `tir:reflect:${id}`;
  const [value, setValue] = useState("");

  useEffect(() => {
    try { setValue(localStorage.getItem(key) ?? ""); } catch {}
  }, [key]);

  return (
    <div className="q">
      <label htmlFor={key}>{question}</label>
      <textarea
        id={key}
        value={value}
        placeholder="Write it down. Only you can see this."
        onChange={(e) => {
          setValue(e.target.value);
          try { localStorage.setItem(key, e.target.value); } catch {}
        }}
      />
    </div>
  );
}
