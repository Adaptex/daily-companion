import Link from "next/link";

import { AutoRefresh } from "@/components/AutoRefresh";
import { CardOffersCard } from "@/components/cards/CardOffersCard";
import { getTodayOffers } from "@/lib/offers";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Offers | Daily Companion",
  description: "Live, normalized offers with feedback-aware ranking.",
};

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countBy(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-paper-deep/40 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-[24px] leading-none text-ink">{value}</p>
    </div>
  );
}

const COLLECTIONS = [
  { icon: "✦", name: "Fresh Picks",  color: "text-emerald-600", desc: "Scraped in the last 24 hours" },
  { icon: "✈", name: "Getaways",     color: "text-sky-600",     desc: "Travel, hotels & airlines" },
  { icon: "◆", name: "Dining Gems",  color: "text-amber-600",   desc: "Restaurants & cafes" },
  { icon: "↑", name: "Quick Wins",   color: "text-violet-600",  desc: "20 % off or more" },
];

export default async function OffersPage() {
  const result = await getTodayOffers();
  const offers = result.ok ? result.offers : [];

  const bankCounts = countBy(offers.map((offer) => offer.bank)).slice(0, 8);
  const categoryCounts = countBy(offers.map((offer) => offer.category)).slice(0, 8);
  const uniqueBankCount = new Set(offers.map((offer) => offer.bank)).size;
  const uniqueCategoryCount = new Set(offers.map((offer) => offer.category)).size;
  const updatedAt = result.ok ? formatUpdatedAt(result.scrapedAt) : null;

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
      <AutoRefresh />

      {/* Dateline */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
        <span>Section C</span>
        <span className="text-accent">Live offer index</span>
        <Link href="/" className="transition hover:text-ink">
          ← Back to briefing
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.35fr)]">
        {/* Main column */}
        <div className="space-y-5">

          {/* Masthead */}
          <section className="overflow-hidden rounded-[32px] border border-rule bg-card/90 p-6 shadow-[0_24px_60px_-44px_rgba(27,24,21,0.18)] lg:p-8">
            <div className="flex flex-col gap-5 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-0.5 rounded-full bg-accent/40" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                    Live · ranked · curated
                  </span>
                </div>
                <h1 className="mt-3 font-display text-[60px] leading-[0.92] tracking-tight text-ink sm:text-[74px]">
                  Offers
                </h1>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                  A live index of active Sri Lankan bank deals — normalized categories,
                  community-voted ranking, and date-aware tabs so today means now
                  and upcoming starts tomorrow.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Feed status
                </p>
                <p className="mt-1 font-display text-[22px] leading-none text-ink">
                  {result.ok ? `${result.totalActive} active` : "Waiting"}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  {result.ok ? `Updated ${updatedAt}` : "Refreshing feed"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile label="Live offers" value={result.ok ? String(result.totalActive) : "--"} />
              <SummaryTile label="Banks" value={result.ok ? String(uniqueBankCount) : "--"} />
              <SummaryTile label="Categories" value={result.ok ? String(uniqueCategoryCount) : "--"} />
              <SummaryTile label="Freshness" value={updatedAt ?? "--"} />
            </div>
          </section>

          {/* Full offer browser — editorial hero + collections + search + filters all live here */}
          <CardOffersCard mode="page" />
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">

          {/* Collections guide */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              How offers are grouped
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">
              Collections
            </h2>
            <ul className="mt-4 space-y-3">
              {COLLECTIONS.map(({ icon, name, color, desc }) => (
                <li key={name} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-none font-display text-[16px] ${color}`}>{icon}</span>
                  <div>
                    <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${color}`}>{name}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-rule-soft bg-paper-deep/40 p-3">
              <p className="text-[11px] leading-snug text-ink-faint">
                Thumbs up on an offer promotes it to the top of its collection. Thumbs down buries it.
                Your votes persist locally.
              </p>
            </div>
          </section>

          {/* Live mix — bank + category counts */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Live mix
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">
              Banks &amp; categories
            </h2>

            <div className="mt-4 space-y-2">
              {bankCounts.map(([bank, count]) => (
                <div key={bank} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-ink">{bank}</span>
                  <span className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                    {count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categoryCounts.map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint"
                >
                  {category} · {count}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
