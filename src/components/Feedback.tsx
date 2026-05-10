"use client";

// Lightweight 👍/👎 signal hook. Stored in localStorage for now;
// will move to Supabase event log when auth lands.
// See memory/project_daily_companion_todos.md TODO #3.

import { useEffect, useState } from "react";

type Vote = "up" | "down" | null;

const STORAGE_KEY = "dc.feedback.v1";

type Store = Record<string, "up" | "down">;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function Feedback({ id, label }: { id: string; label?: string }) {
  const [vote, setVote] = useState<Vote>(null);

  useEffect(() => {
    const store = readStore();
    setVote(store[id] ?? null);
  }, [id]);

  function cast(next: "up" | "down") {
    const store = readStore();
    if (store[id] === next) {
      delete store[id];
      setVote(null);
    } else {
      store[id] = next;
      setVote(next);
    }
    writeStore(store);
  }

  return (
    <div
      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint"
      onClick={(e) => e.stopPropagation()}
    >
      {label && <span className="opacity-60">{label}</span>}
      <button
        type="button"
        aria-label="Helpful"
        onClick={(e) => {
          e.preventDefault();
          cast("up");
        }}
        className={`rounded px-1 py-0.5 transition hover:bg-paper-deep/60 ${
          vote === "up" ? "text-accent" : ""
        }`}
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        onClick={(e) => {
          e.preventDefault();
          cast("down");
        }}
        className={`rounded px-1 py-0.5 transition hover:bg-paper-deep/60 ${
          vote === "down" ? "text-accent" : ""
        }`}
      >
        ▼
      </button>
    </div>
  );
}
