import { Suspense } from "react";

export const maxDuration = 60;
import { WorldAICard, WorldAICardSkeleton } from "@/components/cards/WorldAICard";
import { CardOffersCard } from "@/components/cards/CardOffersCard";
import { SportsCard, SportsCardSkeleton } from "@/components/cards/SportsCard";
import { SkillCard } from "@/components/cards/SkillCard";
import { WorkoutCard } from "@/components/cards/WorkoutCard";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MastheadClock } from "@/components/MastheadClock";


function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 21) return "Good evening.";
  return "Good night.";
}

export default function Home() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const issueNo = Math.floor(
    (Date.now() - Date.parse("2026-05-01")) / (1000 * 60 * 60 * 24),
  ) + 1;

  const greetingText = greeting();
  const greetingBody = greetingText.replace(/\.$/, "");

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <AutoRefresh />

      {/* Masthead */}
      <header className="fade-up mb-8 border-b-2 border-ink pb-6">
        {/* Meta bar */}
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.28em] text-ink-faint">
          <span>Vol. I</span>
          <span className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-rule" />
            <span className="text-[8px]">◆</span>
            <span className="hidden sm:inline">Daily Companion</span>
            <span className="text-[8px]">◆</span>
            <span className="h-px w-6 bg-rule" />
          </span>
          <span className="flex items-center gap-2.5">
            <span>Issue №{issueNo}</span>
            <span className="h-3 w-px bg-rule" />
            <MastheadClock />
          </span>
        </div>

        {/* Greeting + subtitle */}
        <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              {today} — Colombo
            </p>
            <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-tight text-ink sm:text-[88px]">
              {greetingBody}<span className="text-accent">.</span>
            </h1>
          </div>
          <p className="max-w-xs font-display text-[17px] italic leading-snug text-ink-soft">
            Everything you should know before the day starts — curated, not
            scrolled.
          </p>
        </div>
      </header>

      {/* Editorial rule */}
      <div className="mb-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-rule" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-faint">
          Colombo · Morning Edition
        </span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* World & AI — spans 2 cols */}
        <div className="fade-up sm:col-span-2 lg:col-span-2" style={{ animationDelay: "0ms" }}>
          <Suspense fallback={<WorldAICardSkeleton />}>
            <WorldAICard />
          </Suspense>
        </div>

        {/* Card Offers */}
        <div className="fade-up" style={{ animationDelay: "80ms" }}>
          <CardOffersCard />
        </div>

        {/* Sports */}
        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <Suspense fallback={<SportsCardSkeleton />}>
            <SportsCard />
          </Suspense>
        </div>

        {/* Skill */}
        <div className="fade-up" style={{ animationDelay: "240ms" }}>
          <SkillCard />
        </div>

        {/* Workout */}
        <div className="fade-up" style={{ animationDelay: "320ms" }}>
          <WorkoutCard />
        </div>

        {/* Jarvis — spans full row */}
        <div className="fade-up sm:col-span-2 lg:col-span-3" style={{ animationDelay: "400ms" }}>
          <article className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-ink p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            {/* Scanning line */}
            <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

            {/* Grain on dark background */}
            <div className="paper-grain pointer-events-none absolute inset-0 opacity-25 mix-blend-screen" />

            {/* Content */}
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
                  Section G · Initializing
                </span>
              </div>
              <h2 className="mt-3 font-display text-[38px] leading-tight tracking-tight text-paper sm:text-[48px]">
                Jarvis
              </h2>
              <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-paper/50">
                Your AI companion. Press to talk. It listens, remembers, and responds — out loud.
              </p>
            </div>

            {/* Waveform */}
            <div className="relative z-10 flex flex-none items-end gap-[3px] self-center">
              {[2, 5, 8, 13, 18, 13, 8, 5, 2, 5, 8, 13, 8, 5, 2].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-accent/30 animate-pulse"
                  style={{ height: `${h * 2}px`, animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="relative z-10 flex flex-none items-center gap-3 self-start sm:self-center">
              <div className="rounded-full border border-paper/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/30">
                coming soon
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full border border-paper/10 text-paper/20 transition group-hover:border-accent/40 group-hover:text-accent/70">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3M8 22h8" />
                </svg>
              </div>
            </div>
          </article>
        </div>
      </section>

      <footer className="mt-16 flex items-center justify-between border-t border-rule pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        <span>v0.3 · morning edition</span>
        <span>composed by gemini 2.5 flash</span>
        <span>refreshes every 30m</span>
      </footer>
    </main>
  );
}
