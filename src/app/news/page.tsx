import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getWorldAIBriefing, type Bullet } from "@/lib/briefing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "News | Daily Companion",
  description: "Today's curated world, AI, tech, and business briefing.",
};

const CATEGORY_META: Record<
  Bullet["category"],
  { label: string; icon: string; color: string; tint: string; border: string }
> = {
  world: {
    label: "World",
    icon: "◉",
    color: "text-sky-700",
    tint: "bg-sky-500/5",
    border: "border-sky-400/20",
  },
  ai: {
    label: "AI",
    icon: "◆",
    color: "text-violet-700",
    tint: "bg-violet-500/5",
    border: "border-violet-400/20",
  },
  tech: {
    label: "Tech",
    icon: "▲",
    color: "text-emerald-700",
    tint: "bg-emerald-500/5",
    border: "border-emerald-400/20",
  },
  business: {
    label: "Business",
    icon: "●",
    color: "text-amber-700",
    tint: "bg-amber-500/5",
    border: "border-amber-400/20",
  },
};

const CATEGORY_DESCS: Record<Bullet["category"], string> = {
  world: "Geopolitics, elections, disasters, international relations",
  ai: "Model releases, AI products, regulation, research",
  tech: "Software, hardware, platforms, companies",
  business: "Markets, earnings, economy, mergers",
};

function countBy<T>(arr: T[], key: (item: T) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of arr) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-paper-deep/40 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-[24px] leading-none text-ink">{value}</p>
    </div>
  );
}

function LeadStory({ bullet }: { bullet: Bullet }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-rule bg-card/90 shadow-[0_20px_50px_-40px_rgba(27,24,21,0.2)]">
      <div className="p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-3 w-0.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Lead Story
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            · {bullet.source}
          </span>
        </div>

        <a
          href={bullet.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <h2 className="font-display text-[38px] leading-[1.02] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[46px]">
            {bullet.headline}
          </h2>
        </a>

        <div className="mt-5 rounded-xl border border-rule-soft bg-paper-deep/40 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
            Why it matters
          </p>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{bullet.why}</p>
        </div>

        <a
          href={bullet.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent hover:underline"
        >
          Read full story →
        </a>
      </div>
    </section>
  );
}

function StoryRow({ bullet }: { bullet: Bullet }) {
  const meta = CATEGORY_META[bullet.category];
  return (
    <a
      href={bullet.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-rule hover:bg-paper-deep/40"
    >
      <div className={`mt-0.5 flex-none rounded-md border px-2 py-0.5 ${meta.tint} ${meta.border}`}>
        <span className={`font-mono text-[8px] uppercase tracking-[0.2em] ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
          {bullet.source}
        </p>
        <p className="mt-1 font-display text-[16px] leading-tight text-ink transition-colors group-hover:text-accent">
          {bullet.headline}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-soft">{bullet.why}</p>
      </div>
    </a>
  );
}

function CategorySection({
  category,
  stories,
}: {
  category: Bullet["category"];
  stories: Bullet[];
}) {
  if (!stories.length) return null;
  const meta = CATEGORY_META[category];

  return (
    <section className="overflow-hidden rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.15)] lg:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`font-display text-[18px] ${meta.color}`}>{meta.icon}</span>
          <h2 className="font-display text-[22px] leading-tight text-ink">{meta.label}</h2>
        </div>
        <span className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </span>
      </div>
      <div className="space-y-0.5">
        {stories.map((b) => (
          <StoryRow key={b.link} bullet={b} />
        ))}
      </div>
    </section>
  );
}

export default async function NewsPage() {
  const result = await getWorldAIBriefing();
  const allBullets = result.lead ? [result.lead, ...result.rest] : result.rest;

  const storiesByCategory: Record<Bullet["category"], Bullet[]> = {
    world: allBullets.filter((b) => b.category === "world"),
    ai: allBullets.filter((b) => b.category === "ai"),
    tech: allBullets.filter((b) => b.category === "tech"),
    business: allBullets.filter((b) => b.category === "business"),
  };

  const sourceCounts = countBy(allBullets, (b) => b.source).slice(0, 8);
  const updatedAt = formatUpdatedAt(result.generatedAt);
  const sourceCount = new Set(allBullets.map((b) => b.source)).size;

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
      <AutoRefresh />

      {/* Dateline */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
        <span>Section A</span>
        <span className="text-accent">Live briefing</span>
        <Link href="/" className="transition hover:text-ink">
          ← Back to briefing
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.35fr)]">
        {/* Main column */}
        <div className="space-y-5">

          {/* Masthead */}
          <section className="overflow-hidden rounded-[32px] border border-rule bg-card/90 p-6 shadow-[0_24px_60px_-44px_rgba(27,24,21,0.18)] lg:p-8">
            <div className="flex flex-col gap-5 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-0.5 rounded-full bg-accent/40" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                    Live · curated · Gemini-ranked
                  </span>
                </div>
                <h1 className="mt-3 font-display text-[60px] leading-[0.92] tracking-tight text-ink sm:text-[74px]">
                  News
                </h1>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                  Twenty stories across World, AI, Tech, and Business — selected from seven live
                  feeds, ranked for relevance to a software engineer in Colombo.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Feed status
                </p>
                <p className="mt-1 font-display text-[22px] leading-none text-ink">
                  {allBullets.length} stories
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  Updated {updatedAt}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile label="Stories today" value={String(allBullets.length)} />
              <SummaryTile label="Live sources" value={String(sourceCount)} />
              <SummaryTile label="Categories" value="4" />
              <SummaryTile label="Updated" value={updatedAt} />
            </div>
          </section>

          {/* Lead story */}
          {result.lead && <LeadStory bullet={result.lead} />}

          {/* Stories by category */}
          {(["world", "ai", "tech", "business"] as const).map((cat) => (
            <CategorySection key={cat} category={cat} stories={storiesByCategory[cat]} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">

          {/* Source breakdown */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Where it comes from
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">Sources</h2>
            <div className="mt-4 space-y-2">
              {sourceCounts.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-ink">{source}</span>
                  <span className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Category guide */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              How stories are grouped
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">Categories</h2>
            <ul className="mt-4 space-y-3">
              {(["world", "ai", "tech", "business"] as const).map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <li key={cat} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex-none font-display text-[16px] ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div>
                      <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${meta.color}`}>
                        {meta.label}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
                        {CATEGORY_DESCS[cat]}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 rounded-xl border border-rule-soft bg-paper-deep/40 p-3">
              <p className="text-[11px] leading-snug text-ink-faint">
                Categories are assigned by content, not source. A BBC article about AI regulation
                lands in AI, not World.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
