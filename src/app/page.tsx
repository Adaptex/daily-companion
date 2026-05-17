import { Suspense } from "react";

export const maxDuration = 60;

import { WorldAICard, WorldAICardSkeleton } from "@/components/cards/WorldAICard";
import { CardOffersCard } from "@/components/cards/CardOffersCard";
import { SportsCard, SportsCardSkeleton } from "@/components/cards/SportsCard";
import { SkillCard } from "@/components/cards/SkillCard";
import { WellnessCard } from "@/components/cards/WellnessCard";
import { JarvisCard } from "@/components/cards/JarvisCard";
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

      <section className="grid grid-cols-1 gap-5 items-start sm:grid-cols-2 lg:grid-cols-3">
        {/* World & AI — spans 2 cols */}
        <div className="fade-up sm:col-span-2 lg:col-span-2" style={{ animationDelay: "0ms" }}>
          <Suspense fallback={<WorldAICardSkeleton />}>
            <WorldAICard />
          </Suspense>
        </div>

        {/* Right sidebar — CardOffers + Skill stacked, spans 2 grid rows on lg */}
        <div className="fade-up flex flex-col gap-5 lg:row-span-2" style={{ animationDelay: "80ms" }}>
          <CardOffersCard />
          <SkillCard />
        </div>

        {/* Sports — spans 2 cols to match World & AI weight */}
        <div className="fade-up sm:col-span-2 lg:col-span-2" style={{ animationDelay: "160ms" }}>
          <Suspense fallback={<SportsCardSkeleton />}>
            <SportsCard />
          </Suspense>
        </div>

        {/* Wellness — full width for goal selector + tip */}
        <div className="fade-up sm:col-span-2 lg:col-span-3" style={{ animationDelay: "240ms" }}>
          <WellnessCard />
        </div>

        {/* Jarvis — spans full row */}
        <div className="fade-up sm:col-span-2 lg:col-span-3" style={{ animationDelay: "320ms" }}>
          <JarvisCard />
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
