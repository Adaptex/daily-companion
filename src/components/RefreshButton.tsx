"use client";

import { useTransition } from "react";
import { refreshBriefing } from "@/app/actions";

export function RefreshButton() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => start(() => refreshBriefing())}
      disabled={pending}
      className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-faint hover:text-accent transition-colors disabled:opacity-60"
      aria-label="Refresh briefing"
    >
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pending ? "spin-slow" : "transition-transform group-hover:rotate-180"}
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
      {pending ? "refreshing" : "refresh"}
    </button>
  );
}
