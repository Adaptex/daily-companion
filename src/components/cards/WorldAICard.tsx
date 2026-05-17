import Link from "next/link";
import { getWorldAIBriefing, type Bullet } from "@/lib/briefing";
import { RefreshButton } from "@/components/RefreshButton";
import { NewsSlideshow } from "@/components/NewsSlideshow";

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

  const bullets: Bullet[] = [data.lead, ...data.rest];

  return (
    <CardShell generatedAt={data.generatedAt} itemCount={data.itemCount}>
      <NewsSlideshow bullets={bullets} />
    </CardShell>
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
    <section className="relative h-full overflow-visible rounded-2xl border border-rule bg-card/80 p-7 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)] lg:p-9">
      <header className="mb-6 flex items-center justify-between border-b border-rule pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section A
            </span>
          </div>
          <h2 className="font-display text-[26px] leading-tight tracking-tight text-ink">
            News
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {time && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {time}
            </span>
          )}
          <RefreshButton />
        </div>
      </header>
      {children}
      <div className="mt-4 border-t border-rule pt-3 flex justify-end">
        <Link
          href="/news"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-accent"
        >
          All stories →
        </Link>
      </div>
    </section>
  );
}

export function WorldAICardSkeleton() {
  return (
    <section className="relative h-full rounded-2xl border border-rule bg-card/80 p-7 backdrop-blur-sm lg:p-9">
      <header className="mb-6 flex items-center justify-between border-b border-rule pb-4">
        <h2 className="font-display text-[26px] leading-tight tracking-tight text-ink">
          News
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          composing edition…
        </span>
      </header>

      <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-paper-deep" />
      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 animate-pulse rounded-full bg-paper-deep ${i === 0 ? "w-6" : "w-1.5"}`} />
        ))}
      </div>
      <div className="mt-4 space-y-1 border-t border-rule pt-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-2.5 w-3 animate-pulse rounded bg-paper-deep" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-paper-deep" />
            <div className="h-3 flex-1 animate-pulse rounded bg-paper-deep" />
          </div>
        ))}
      </div>
    </section>
  );
}
