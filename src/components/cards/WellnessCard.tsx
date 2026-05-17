"use client";

import { useState, useEffect } from "react";
import { WELLNESS_GOALS } from "@/data/wellness";
import { pickByDay } from "@/lib/daily";
import { Feedback } from "@/components/Feedback";

const STORAGE_KEY = "dc.wellness.goal";
const DEFAULT_GOAL = "energy";

export function WellnessCard() {
  const [goalId, setGoalId] = useState<string>(DEFAULT_GOAL);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && WELLNESS_GOALS.some((g) => g.id === saved)) {
        setGoalId(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  const selectGoal = (id: string) => {
    setGoalId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  const goal = WELLNESS_GOALS.find((g) => g.id === goalId) ?? WELLNESS_GOALS[0];
  const tip = pickByDay(goal.tips);

  return (
    <section className="group relative flex flex-col overflow-hidden rounded-2xl border border-rule bg-card/80 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      {/* Decorative watermark */}
      <span className="pointer-events-none select-none absolute right-6 top-2 font-display text-[120px] leading-none text-ink/[0.03] transition-transform duration-500 group-hover:scale-105">
        {goal.icon}
      </span>

      <div className="relative z-10 flex flex-col p-6">
        {/* Header */}
        <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-0.5 rounded-full bg-accent/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                Section F
              </span>
            </div>
            <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
              Wellness
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            {goal.label}
          </span>
        </header>

        {/* Goal selector */}
        <div className="mb-5 flex flex-wrap gap-2">
          {WELLNESS_GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGoal(g.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
                g.id === goalId
                  ? "bg-ink text-paper"
                  : "border border-rule text-ink-faint hover:border-ink/40 hover:text-ink"
              }`}
            >
              <span className={g.id === goalId ? "opacity-100" : "opacity-60"}>
                {g.icon}
              </span>
              {g.label}
            </button>
          ))}
        </div>

        {/* Main content — 2-col on large screens */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          {/* Left: advice */}
          <div className="flex flex-col gap-4">
            <p
              key={goalId}
              className="slide-why-in text-[15.5px] leading-relaxed text-ink"
            >
              {tip.advice}
            </p>

            {/* Citation */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-none w-5 bg-rule" />
              {tip.citationUrl ? (
                <a
                  href={tip.citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint transition hover:text-accent"
                >
                  {tip.citation} ↗
                </a>
              ) : (
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
                  {tip.citation}
                </span>
              )}
            </div>
          </div>

          {/* Right: action */}
          <div
            key={goalId + "-action"}
            className="slide-why-in rounded-xl border-l-[3px] border-accent bg-paper-deep/70 px-4 py-3 lg:min-w-[260px] lg:max-w-[320px]"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent">
              Do this today
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink">
              {tip.action}
            </p>
          </div>
        </div>

        <footer className="mt-5 flex items-center justify-between border-t border-rule pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            {goal.description}
          </span>
          <Feedback id={`wellness:${goal.id}:${tip.citation}`} />
        </footer>
      </div>
    </section>
  );
}
