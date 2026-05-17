import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getSportsBriefing, type SportBullet } from "@/lib/sports/briefing";
import { type StripState } from "@/lib/sports/strip";
import { PREFERENCES } from "@/config/preferences";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sports | Daily Companion",
  description: "Live cricket, F1, and football — curated for your teams.",
};

type SportKey = "cricket" | "f1" | "football" | "general";

const SPORT_META: Record<SportKey, { label: string; icon: string; color: string; tint: string; border: string }> = {
  cricket: {
    label: "Cricket",
    icon: "◎",
    color: "text-emerald-700",
    tint: "bg-emerald-500/5",
    border: "border-emerald-400/20",
  },
  f1: {
    label: "Formula 1",
    icon: "◈",
    color: "text-red-700",
    tint: "bg-red-500/5",
    border: "border-red-400/20",
  },
  football: {
    label: "Football",
    icon: "◉",
    color: "text-sky-700",
    tint: "bg-sky-500/5",
    border: "border-sky-400/20",
  },
  general: {
    label: "Sport",
    icon: "◆",
    color: "text-amber-700",
    tint: "bg-amber-500/5",
    border: "border-amber-400/20",
  },
};

const STRIP_SPORT_COLORS: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  cricket: {
    bg: "bg-emerald-500/8",
    border: "border-emerald-400/30",
    label: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  f1: {
    bg: "bg-red-500/8",
    border: "border-red-400/30",
    label: "text-red-700",
    dot: "bg-red-500",
  },
  football: {
    bg: "bg-sky-500/8",
    border: "border-sky-400/30",
    label: "text-sky-700",
    dot: "bg-sky-500",
  },
};

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

function StripPanel({ strip }: { strip: StripState }) {
  if (!strip) {
    return (
      <div className="rounded-2xl border border-rule bg-paper-deep/40 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-faint">
          Status · No live action in the next 24 hours
        </p>
      </div>
    );
  }

  const colors = STRIP_SPORT_COLORS[strip.sport] ?? STRIP_SPORT_COLORS.football;

  return (
    <div className={`rounded-2xl border p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2">
        {strip.kind === "live" && (
          <span className={`h-2 w-2 rounded-full ${colors.dot} animate-pulse`} />
        )}
        <span className={`font-mono text-[9px] uppercase tracking-[0.22em] ${colors.label}`}>
          {strip.label}
        </span>
      </div>
      <p className="mt-1.5 font-display text-[22px] leading-tight text-ink">{strip.title}</p>
      {strip.sub && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          {strip.sub}
        </p>
      )}
    </div>
  );
}

function LeadStory({ bullet }: { bullet: SportBullet }) {
  const meta = SPORT_META[bullet.sport] ?? SPORT_META.general;
  return (
    <section className="overflow-hidden rounded-[28px] border border-rule bg-card/90 shadow-[0_20px_50px_-40px_rgba(27,24,21,0.2)]">
      <div className="p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="h-3 w-0.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Lead Story
          </span>
          <span className={`rounded-md border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${meta.tint} ${meta.border} ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          {bullet.forYou && (
            <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white">
              For You
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            · {bullet.source}
          </span>
        </div>

        <a href={bullet.link} target="_blank" rel="noopener noreferrer" className="group block">
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

function BulletRow({ bullet }: { bullet: SportBullet }) {
  const meta = SPORT_META[bullet.sport] ?? SPORT_META.general;
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
        <div className="flex items-center gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
            {bullet.source}
          </p>
          {bullet.forYou && (
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-accent">
              For You
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-[16px] leading-tight text-ink transition-colors group-hover:text-accent">
          {bullet.headline}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-soft">{bullet.why}</p>
      </div>
    </a>
  );
}

function RawStoryRow({
  item,
}: {
  item: { title: string; link: string; source: string; snippet: string };
}) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-all hover:border-rule hover:bg-paper-deep/40"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
          {item.source}
        </p>
        <p className="mt-0.5 font-display text-[15px] leading-tight text-ink transition-colors group-hover:text-accent">
          {item.title}
        </p>
        {item.snippet && (
          <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-ink-soft">
            {item.snippet}
          </p>
        )}
      </div>
    </a>
  );
}

function SportSection({
  sport,
  items,
}: {
  sport: SportKey;
  items: Array<{ title: string; link: string; source: string; snippet: string }>;
}) {
  if (!items.length) return null;
  const meta = SPORT_META[sport];
  const shown = items.slice(0, 8);

  return (
    <section className="overflow-hidden rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.15)] lg:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`font-display text-[18px] ${meta.color}`}>{meta.icon}</span>
          <h2 className="font-display text-[22px] leading-tight text-ink">{meta.label}</h2>
        </div>
        <span className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
          {shown.length} {shown.length === 1 ? "story" : "stories"}
        </span>
      </div>
      <div className="space-y-0.5">
        {shown.map((item) => (
          <RawStoryRow key={item.link} item={item} />
        ))}
      </div>
    </section>
  );
}

export default async function SportsPage() {
  const result = await getSportsBriefing();
  const allBullets = result.lead ? [result.lead, ...result.rest] : result.rest;
  const secondaryBullets = result.rest;

  const updatedAt = formatUpdatedAt(result.generatedAt);
  const sportCount = Object.keys(result.rawBySport).length;
  const totalRaw = Object.values(result.rawBySport).reduce((n, items) => n + items.length, 0);

  const prefs = PREFERENCES.sports;
  const followed = [
    ...prefs.cricket.teams.slice(0, 2).map((t) => ({ sport: "Cricket", name: t })),
    ...prefs.f1.drivers.slice(0, 1).map((d) => ({ sport: "F1", name: d })),
    ...prefs.f1.constructors.slice(0, 1).map((c) => ({ sport: "F1", name: c })),
    ...prefs.football.clubs.map((c) => ({ sport: "Football", name: c })),
  ];

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
      <AutoRefresh />

      {/* Dateline */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
        <span>Section D</span>
        <span className="text-accent">Live sports</span>
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
                    Live · your teams · Gemini-curated
                  </span>
                </div>
                <h1 className="mt-3 font-display text-[60px] leading-[0.92] tracking-tight text-ink sm:text-[74px]">
                  Sports
                </h1>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                  Cricket, F1, and football — pulled from live feeds, ranked around your teams
                  and flagged when Sri Lanka, CSK, Arsenal, or Verstappen are in the news.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Feed status
                </p>
                <p className="mt-1 font-display text-[22px] leading-none text-ink">
                  {totalRaw} items
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  Updated {updatedAt}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile label="Curated picks" value={String(allBullets.length)} />
              <SummaryTile label="Sports" value={String(sportCount)} />
              <SummaryTile label="Feed items" value={String(totalRaw)} />
              <SummaryTile label="Updated" value={updatedAt} />
            </div>
          </section>

          {/* Status strip */}
          <StripPanel strip={result.strip} />

          {/* Lead story */}
          {result.lead && <LeadStory bullet={result.lead} />}

          {/* Secondary picks */}
          {secondaryBullets.length > 0 && (
            <section className="overflow-hidden rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.15)] lg:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
                <h2 className="font-display text-[22px] leading-tight text-ink">Today&apos;s Picks</h2>
                <span className="rounded-full border border-rule bg-paper-deep px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                  {secondaryBullets.length} selected
                </span>
              </div>
              <div className="space-y-0.5">
                {secondaryBullets.map((b) => (
                  <BulletRow key={b.link} bullet={b} />
                ))}
              </div>
            </section>
          )}

          {/* Raw stories by sport */}
          {(["cricket", "football", "f1", "general"] as SportKey[]).map((sport) => {
            const items = (result.rawBySport[sport] ?? []).map((item) => ({
              title: item.title,
              link: item.link,
              source: item.source,
              snippet: item.snippet ?? "",
            }));
            return <SportSection key={sport} sport={sport} items={items} />;
          })}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">

          {/* Followed teams */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Tracked for you
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">Following</h2>
            <ul className="mt-4 space-y-2.5">
              {followed.map(({ sport, name }) => {
                const sportKey = sport.toLowerCase() as SportKey;
                const meta = SPORT_META[sportKey] ?? SPORT_META.general;
                return (
                  <li key={`${sport}-${name}`} className="flex items-center gap-3">
                    <span className={`flex-none font-display text-[14px] ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div>
                      <p className={`font-mono text-[8px] uppercase tracking-[0.18em] ${meta.color}`}>
                        {sport}
                      </p>
                      <p className="text-[13px] text-ink">{name}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 rounded-xl border border-rule-soft bg-paper-deep/40 p-3">
              <p className="text-[11px] leading-snug text-ink-faint">
                Stories mentioning your teams are flagged{" "}
                <span className="font-mono text-[9px] uppercase text-accent">For You</span>{" "}
                and rise to the top.
              </p>
            </div>
          </section>

          {/* Sport guide */}
          <section className="rounded-[28px] border border-rule bg-card/80 p-5 shadow-[0_18px_48px_-40px_rgba(27,24,21,0.2)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Coverage
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">Sources</h2>
            <ul className="mt-4 space-y-3">
              {(["cricket", "football", "f1"] as SportKey[]).map((sport) => {
                const meta = SPORT_META[sport];
                const count = result.rawBySport[sport]?.length ?? 0;
                const sources = [
                  ...new Set((result.rawBySport[sport] ?? []).map((i) => i.source)),
                ].join(", ");
                return (
                  <li key={sport} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex-none font-display text-[16px] ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div>
                      <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${meta.color}`}>
                        {meta.label} · {count} items
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
                        {sources || "Feed offline"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
