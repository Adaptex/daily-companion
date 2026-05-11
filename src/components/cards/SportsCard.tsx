import { getSportsBriefing } from "@/lib/sports/briefing";
import type { StripState } from "@/lib/sports/strip";
import { SportSlideshow } from "@/components/SportSlideshow";

export async function SportsCard() {
  let data;
  try {
    data = await getSportsBriefing();
  } catch (e) {
    return (
      <CardShell>
        <p className="text-sm text-accent-deep">
          Couldn&apos;t build sports briefing: {e instanceof Error ? e.message : "unknown error"}
        </p>
      </CardShell>
    );
  }

  if (!data.lead) {
    return (
      <CardShell>
        <p className="text-sm text-ink-soft">
          No sports feeds reachable right now. Try refresh in a minute.
        </p>
      </CardShell>
    );
  }

  const bullets = [data.lead, ...data.rest];

  return (
    <CardShell strip={data.strip}>
      <SportSlideshow bullets={bullets} />
    </CardShell>
  );
}

function StatusStrip({ strip }: { strip: NonNullable<StripState> }) {
  const accentByKind =
    strip.kind === "live"
      ? "text-accent animate-pulse"
      : strip.kind === "next"
        ? "text-accent"
        : "text-ink-faint";

  const sportLabel =
    strip.sport === "cricket" ? "Cricket"
    : strip.sport === "f1" ? "F1"
    : strip.sport === "football" ? "Football"
    : "Sport";

  return (
    <div className="mb-4 rounded-md border border-rule bg-paper-deep/40 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${accentByKind}`}>
          {sportLabel} · {strip.label}
        </span>
        {strip.kind === "live" && (
          <span className="h-2 w-2 flex-none rounded-full bg-accent animate-pulse" />
        )}
      </div>
      <p className="mt-1 font-display text-[15px] leading-snug text-ink">{strip.title}</p>
      {strip.sub && (
        <p className="mt-0.5 text-[11.5px] text-ink-faint">{strip.sub}</p>
      )}
    </div>
  );
}

function CardShell({
  children,
  strip,
}: {
  children: React.ReactNode;
  strip?: StripState;
}) {
  return (
    <section className="relative flex h-full flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section D
            </span>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Sports
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          your teams
        </span>
      </header>

      {strip && <StatusStrip strip={strip} />}
      {children}
    </section>
  );
}

export function SportsCardSkeleton() {
  return (
    <section className="relative flex flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            Section D
          </span>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Sports
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          checking scores…
        </span>
      </header>

      <div className="mb-4 h-14 animate-pulse rounded-md bg-paper-deep" />
      <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-paper-deep" />
      <div className="mt-3 h-14 animate-pulse rounded-xl bg-paper-deep" />
      <div className="mt-2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-paper-deep" />
        ))}
      </div>
    </section>
  );
}
