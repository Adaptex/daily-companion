import { Suspense } from "react";
import { WorldAICard, WorldAICardSkeleton } from "@/components/cards/WorldAICard";
import { CardOffersCard } from "@/components/cards/CardOffersCard";
import { SportsCard, SportsCardSkeleton } from "@/components/cards/SportsCard";
import { SkillCard } from "@/components/cards/SkillCard";
import { WorkoutCard } from "@/components/cards/WorkoutCard";
import { AutoRefresh } from "@/components/AutoRefresh";


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

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <AutoRefresh />

      {/* Masthead */}
      <header className="fade-up mb-12 border-b-2 border-ink pb-6">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.28em] text-ink-faint">
          <span>Vol. I</span>
          <span>Daily Companion</span>
          <span>Issue №{issueNo}</span>
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              {today} — Colombo
            </p>
            <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-tight text-ink sm:text-[88px]">
              {greeting()}
            </h1>
          </div>
          <p className="max-w-xs font-display text-[17px] italic leading-snug text-ink-soft">
            Everything you should know before the day starts — curated, not
            scrolled.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<WorldAICardSkeleton />}>
          <WorldAICard />
        </Suspense>

        <CardOffersCard />

        <Suspense fallback={<SportsCardSkeleton />}>
          <SportsCard />
        </Suspense>

        <SkillCard />
        <WorkoutCard />

        {/* Companion promo — spans full row, gives chat its own banner */}
        <article className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-card/90 via-card/70 to-accent-soft/30 p-7 backdrop-blur-sm transition hover:border-ink/30 hover:shadow-[0_20px_50px_-25px_rgba(27,24,21,0.25)] sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:col-span-3">
          <div className="flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Section G
            </span>
            <h2 className="mt-2 font-display text-[34px] leading-tight tracking-tight text-ink sm:text-[40px]">
              Companion
            </h2>
            <p className="mt-2 max-w-prose text-[14.5px] leading-relaxed text-ink-soft">
              Ask anything — about today's news, what to cook, what to learn.
            </p>
          </div>
          <div className="flex flex-none items-center gap-3 self-start sm:self-center">
            <div className="rounded-full border border-rule bg-paper px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              in preparation
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper transition group-hover:bg-accent">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
        </article>
      </section>

      <footer className="mt-16 flex items-center justify-between border-t border-rule pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        <span>v0.3 · morning edition</span>
        <span>composed by gemini 2.5 flash</span>
        <span>refreshes every 30m</span>
      </footer>
    </main>
  );
}
