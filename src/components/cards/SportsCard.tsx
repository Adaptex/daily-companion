import { getSportsBriefing, type SportBullet } from "@/lib/sports/briefing";
import type { StripState } from "@/lib/sports/strip";
import { Feedback } from "@/components/Feedback";

const SPORT_LABEL: Record<SportBullet["sport"], string> = {
  cricket: "Cricket",
  f1: "F1",
  football: "Football",
  general: "Sport",
};

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

  return (
    <CardShell strip={data.strip}>
      <LeadStory bullet={data.lead} />

      <div className="mt-5 space-y-3 border-t border-rule pt-4">
        {data.rest.map((b, i) => (
          <SecondaryStory key={i} bullet={b} />
        ))}
      </div>
    </CardShell>
  );
}

function StatusStrip({ strip }: { strip: NonNullable<StripState> }) {
  const sportLabel = SPORT_LABEL[strip.sport];
  const accentByKind =
    strip.kind === "live"
      ? "text-accent animate-pulse"
      : strip.kind === "next"
        ? "text-accent"
        : "text-ink-faint";

  return (
    <div className="mb-4 rounded-md border border-rule bg-paper-deep/40 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.22em] ${accentByKind}`}
        >
          {sportLabel} · {strip.label}
        </span>
        {strip.kind === "live" && (
          <span className="h-2 w-2 flex-none rounded-full bg-accent animate-pulse" />
        )}
      </div>
      <p className="mt-1 font-display text-[15px] leading-snug text-ink">
        {strip.title}
      </p>
      {strip.sub && (
        <p className="mt-0.5 text-[11.5px] text-ink-faint">{strip.sub}</p>
      )}
    </div>
  );
}

function LeadStory({ bullet }: { bullet: SportBullet }) {
  return (
    <article className="group/item relative">
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none"
      >
        {bullet.image && (
          <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-lg border border-rule bg-paper-deep">
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

        <SportTag bullet={bullet} accent />

        <h3 className="mt-1.5 font-display text-[22px] leading-[1.1] tracking-tight text-ink">
          {bullet.headline}
        </h3>

        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          {bullet.why}
        </p>
      </a>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          {bullet.source}
        </span>
        <Feedback id={`sports:${bullet.link}`} />
      </div>
    </article>
  );
}

function SecondaryStory({ bullet }: { bullet: SportBullet }) {
  return (
    <article className="group/item relative">
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none"
      >
        <SportTag bullet={bullet} />
        <p className="mt-0.5 line-clamp-2 font-display text-[14.5px] leading-snug text-ink">
          {bullet.headline}
        </p>
      </a>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
          {bullet.source}
        </span>
        <Feedback id={`sports:${bullet.link}`} />
      </div>
    </article>
  );
}

function SportTag({ bullet, accent }: { bullet: SportBullet; accent?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
          accent ? "text-accent" : "text-ink-faint"
        }`}
      >
        {SPORT_LABEL[bullet.sport]}
      </span>
      {bullet.forYou && (
        <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-accent">
          For You
        </span>
      )}
    </span>
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
      <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-paper-deep" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-paper-deep" />
      <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-paper-deep" />
      <div className="mt-4 space-y-3 border-t border-rule pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 animate-pulse rounded bg-paper-deep" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-paper-deep" />
          </div>
        ))}
      </div>
    </section>
  );
}
