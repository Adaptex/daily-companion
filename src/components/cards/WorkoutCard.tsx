"use client";

import { useState } from "react";
import { WORKOUTS } from "@/data/workouts";
import { pickByDay } from "@/lib/daily";
import { Feedback } from "@/components/Feedback";

const FOCUS_META: Record<string, { tint: string; icon: string }> = {
  "Full Body":  { tint: "bg-[#fde4d3] text-[#7c2d12] border-[#f9c3a8]", icon: "◈" },
  "Upper Body": { tint: "bg-[#dbe7d6] text-[#3b5b34] border-[#bed4b8]", icon: "▲" },
  Core:         { tint: "bg-[#e6dcef] text-[#4a2c5a] border-[#cfbedd]", icon: "◎" },
  "Lower Body": { tint: "bg-[#e0dccd] text-[#5a4f2c] border-[#cec6ae]", icon: "▼" },
  Cardio:       { tint: "bg-[#dce6f0] text-[#2a3c5c] border-[#b8c8dd]", icon: "♦" },
  Mobility:     { tint: "bg-[#e0f0e8] text-[#2a5c44] border-[#b8ddc8]", icon: "∞" },
};

export function WorkoutCard() {
  const workout = pickByDay(WORKOUTS);
  const meta = FOCUS_META[workout.focus] ?? {
    tint: "bg-paper-deep text-ink-soft border-rule",
    icon: "●",
  };
  const [done, setDone] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const completedCount = done.size;
  const totalCount = workout.exercises.length;
  const allDone = completedCount === totalCount;

  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-card/80 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      {/* Decorative watermark */}
      <span className="pointer-events-none select-none absolute right-3 top-1 font-display text-[96px] leading-none text-ink/[0.035] transition-transform duration-500 group-hover:scale-110">
        {meta.icon}
      </span>

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-0.5 rounded-full bg-accent/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                Section F
              </span>
            </div>
            <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
              Workout
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tint}`}>
              {workout.focus}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              30 min
            </span>
          </div>
        </header>

        <h3 className="mb-1 font-display text-[18px] leading-snug tracking-tight text-ink">
          {workout.title}
        </h3>

        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Exercise list — tap to mark done */}
        <ul className="flex flex-1 flex-col gap-1">
          {workout.exercises.map((ex, i) => {
            const isDone = done.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() => toggle(i)}
                  className={`group/ex flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition ${
                    isDone ? "opacity-50" : "hover:bg-paper-deep/50"
                  }`}
                >
                  {/* Checkbox dot */}
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border transition ${
                      isDone
                        ? "border-accent bg-accent text-white"
                        : "border-rule group-hover/ex:border-ink/30"
                    }`}
                  >
                    {isDone && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>

                  <span className={`flex-1 text-[13px] ${isDone ? "line-through text-ink-faint" : "text-ink"}`}>
                    {ex.name}
                  </span>

                  <span className="flex-none font-mono text-[11px] text-ink-faint">
                    {ex.sets > 1 ? `${ex.sets} × ` : ""}{ex.reps}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {workout.note && (
          <p className="mt-2 rounded-lg border border-rule-soft bg-paper-deep/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {workout.note}
          </p>
        )}

        {allDone && (
          <div className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Workout complete ✓
            </p>
          </div>
        )}

        <footer className="mt-4 flex items-center justify-between border-t border-rule pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            no equipment · home
          </span>
          <Feedback id={`workout:${workout.title}`} />
        </footer>
      </div>
    </section>
  );
}
