"use client";

// Lightweight 👍/👎 signal hook. Stored in localStorage for now;
// will move to Supabase event log when auth lands.
// See memory/project_daily_companion_todos.md TODO #3.

import { useEffect, useState } from "react";
import {
  readFeedbackStore,
  subscribeFeedbackStore,
  writeFeedbackStore,
  type FeedbackVote,
} from "@/lib/feedback-store";

type Vote = FeedbackVote | null;

export function Feedback({ id, label }: { id: string; label?: string }) {
  const [vote, setVote] = useState<Vote>(() => readFeedbackStore()[id] ?? null);

  useEffect(() => {
    const syncVote = () => setVote(readFeedbackStore()[id] ?? null);
    return subscribeFeedbackStore(syncVote);
  }, [id]);

  function cast(next: "up" | "down") {
    const store = readFeedbackStore();
    if (store[id] === next) {
      delete store[id];
    } else {
      store[id] = next;
    }
    writeFeedbackStore(store);
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
