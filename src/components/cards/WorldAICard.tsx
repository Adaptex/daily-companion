import { getWorldAIBriefing, type Bullet } from "@/lib/briefing";
import { RefreshButton } from "@/components/RefreshButton";

export async function WorldAICard() {
  let data;
  try {
    data = await getWorldAIBriefing();
  } catch (e) {
    return (
      <CardShell>
        <p className="text-sm text-accent-deep">
          Couldn&apos;t build briefing: {e instanceof Error ? e.message : "unknown error"}
        </p>
      </CardShell>
    );
  }

  if (!data.lead) {
    return (
      <CardShell>
        <p className="text-sm text-ink-soft">
          No feeds reachable right now. Try refresh in a minute.
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell generatedAt={data.generatedAt} itemCount={data.itemCount}>
      <LeadStory bullet={data.lead} />

      <div className="mt-8 border-t border-rule pt-6">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {data.rest.map((b, i) => (
            <SecondaryStory key={i} bullet={b} />
          ))}
        </ul>
      </div>
    </CardShell>
  );
}

function LeadStory({ bullet }: { bullet: Bullet }) {
  return (
    <article className="group/item relative">
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none"
      >
        {bullet.image && (
          <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-lg border border-rule bg-paper-deep">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bullet.image}
              alt=""
              loading="eager"
              className="h-full w-full object-cover transition-transform duration-700 group-hover/item:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
          </div>
        )}

        <SourceTag source={bullet.source} accent />

        <h3 className="mt-2 font-display text-3xl leading-[1.05] tracking-tight text-ink sm:text-[2.6rem]">
          {bullet.headline}
        </h3>

        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          {bullet.why}
        </p>
      </a>

      <Popover bullet={bullet} />
    </article>
  );
}

function SecondaryStory({ bullet }: { bullet: Bullet }) {
  return (
    <li className="group/item relative">
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 focus:outline-none"
      >
        {bullet.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bullet.image}
            alt=""
            loading="lazy"
            className="h-16 w-16 flex-none rounded-md border border-rule object-cover"
          />
        ) : (
          <div className="h-16 w-16 flex-none rounded-md border border-rule bg-gradient-to-br from-paper-deep to-accent-soft/40" />
        )}

        <div className="min-w-0">
          <SourceTag source={bullet.source} />
          <p className="mt-0.5 line-clamp-2 font-display text-[17px] leading-snug text-ink">
            {bullet.headline}
          </p>
          <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-soft">{bullet.why}</p>
        </div>
      </a>

      <Popover bullet={bullet} />
    </li>
  );
}

function SourceTag({ source, accent }: { source: string; accent?: boolean }) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
        accent ? "text-accent" : "text-ink-faint"
      }`}
    >
      {source}
    </span>
  );
}

/** Pure-CSS hover popover. Shows on group-hover or keyboard focus-within. */
function Popover({ bullet }: { bullet: Bullet }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 origin-top opacity-0 transition-opacity duration-150 group-hover/item:pointer-events-auto group-hover/item:opacity-100 group-focus-within/item:pointer-events-auto group-focus-within/item:opacity-100"
    >
      <div className="pop-in rounded-lg border border-rule bg-card p-3 shadow-[0_10px_40px_-15px_rgba(27,24,21,0.25)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          original
        </p>
        <p className="mt-1 text-[13px] leading-snug text-ink">{bullet.originalTitle}</p>
        <div className="mt-2 flex items-center justify-between border-t border-rule-soft pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {bullet.source}
          </span>
          <span className="text-[11px] font-medium text-accent">read original →</span>
        </div>
      </div>
    </div>
  );
}

function CardShell({
  children,
  generatedAt,
  itemCount,
}: {
  children: React.ReactNode;
  generatedAt?: string;
  itemCount?: number;
}) {
  const time = generatedAt
    ? new Date(generatedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section className="relative overflow-visible rounded-2xl border border-rule bg-card/80 p-7 backdrop-blur-sm sm:col-span-2 lg:col-span-2 lg:p-9">
      <header className="mb-6 flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[22px] leading-none tracking-tight text-ink">
            World <span className="italic text-accent">&amp;</span> AI
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            front page
          </span>
        </div>
        <div className="flex items-center gap-4">
          {time && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {itemCount} items · {time}
            </span>
          )}
          <RefreshButton />
        </div>
      </header>
      {children}
    </section>
  );
}

export function WorldAICardSkeleton() {
  return (
    <section className="relative rounded-2xl border border-rule bg-card/80 p-7 backdrop-blur-sm sm:col-span-2 lg:col-span-2 lg:p-9">
      <header className="mb-6 flex items-center justify-between border-b border-rule pb-4">
        <h2 className="font-display text-[22px] leading-none tracking-tight text-ink">
          World <span className="italic text-accent">&amp;</span> AI
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          composing edition…
        </span>
      </header>

      <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-paper-deep" />
      <div className="mt-5 h-3 w-24 animate-pulse rounded bg-paper-deep" />
      <div className="mt-3 h-8 w-4/5 animate-pulse rounded bg-paper-deep" />
      <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-paper-deep" />

      <div className="mt-8 grid grid-cols-1 gap-5 border-t border-rule pt-6 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-16 flex-none animate-pulse rounded-md bg-paper-deep" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-paper-deep" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-paper-deep" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-paper-deep" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
