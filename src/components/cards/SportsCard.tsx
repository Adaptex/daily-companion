import Link from "next/link";
import { getSportsBriefing, type SportsBriefing } from "@/lib/sports/briefing";
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
    <CardShell>
      <SportSlideshow bullets={bullets} rawBySport={data.rawBySport} />
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
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
      {children}
      <div className="mt-4 border-t border-rule pt-3 flex justify-end">
        <Link
          href="/sports"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-accent"
        >
          All sports →
        </Link>
      </div>
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
