"use client";

import { useState, useEffect } from "react";
import type { Bullet } from "@/lib/briefing";
import { Feedback } from "@/components/Feedback";

type Category = 'all' | 'world' | 'ai' | 'tech' | 'business';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  world: 'World',
  ai: 'AI',
  tech: 'Tech',
  business: 'Business',
};

interface Props {
  bullets: Bullet[];
}

export function NewsSlideshow({ bullets }: Props) {
  const [category, setCategory] = useState<Category>('all');
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const filtered = category === 'all' ? bullets : bullets.filter((b) => resolveCategory(b) === category);
  const total = filtered.length;

  // Reset slide index when filter changes
  useEffect(() => { setCurrent(0); }, [category]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setTimeout(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearTimeout(id);
  }, [paused, total, current]);

  const go = (n: number) => setCurrent(((n % total) + total) % total);

  function resolveCategory(b: Bullet): Category {
    // Source overrides handle stale cache where TechCrunch/Verge were stored as 'tech'
    if (b.source === 'BBC World' || b.source === 'Al Jazeera') return 'world';
    if (b.source === 'Anthropic' || b.source === 'TechCrunch AI' || b.source === 'The Verge AI') return 'ai';
    if (b.source === 'Guardian Business') return 'business';
    return (b.category as Category) ?? 'tech';
  }

  // Only show categories that have at least one bullet
  const availableCategories: Category[] = ['all', ...(['world', 'ai', 'tech', 'business'] as Category[]).filter(
    (cat) => bullets.some((b) => resolveCategory(b) === cat)
  )];

  if (!bullets.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Category filter pills */}
      {availableCategories.length > 1 && (
        <div className="flex gap-1.5">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
                cat === category
                  ? 'bg-ink text-paper'
                  : 'border border-rule text-ink-faint hover:border-ink/40 hover:text-ink'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Slideshow */}
      {total === 0 ? (
        <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-paper-deep">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
            No {CATEGORY_LABELS[category]} stories today
          </p>
        </div>
      ) : (
        <>
          <div
            className="group/sw relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper-deep"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {filtered.map((b, i) => (
              <Slide key={b.link} bullet={b} active={i === current} />
            ))}

            {total > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); go(current - 1); }}
                  aria-label="Previous story"
                  className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/sw:opacity-100 hover:bg-ink/60"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M8.5 10.5L4.5 6.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); go(current + 1); }}
                  aria-label="Next story"
                  className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/sw:opacity-100 hover:bg-ink/60"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M4.5 10.5l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}

            {total > 1 && !paused && (
              <div key={`${category}-${current}`} className="absolute bottom-0 left-0 z-30 h-[2px] bg-white/50 slide-progress" />
            )}
          </div>

          {/* Why this matters */}
          <div className="rounded-xl border border-rule bg-paper-deep/40 px-4 py-3">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
              Why it matters
            </p>
            <p key={`${category}-${current}`} className="slide-why-in min-h-[2.25rem] text-[13px] leading-snug text-ink-soft">
              {filtered[current]?.why}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Slide({ bullet, active }: { bullet: Bullet; active: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!(bullet.image && !imgFailed);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        active ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
      }`}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bullet.image!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget;
            const ratio = img.naturalWidth / img.naturalHeight;
            if (img.naturalWidth < 800 || img.naturalHeight < 450 || ratio < 1.1) {
              setImgFailed(true);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper-deep">
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
              No image available
            </span>
          </div>
          <span className="pointer-events-none select-none absolute right-3 bottom-4 font-display text-[88px] uppercase leading-none tracking-tight text-ink/[0.06]">
            {bullet.source.split(" ")[0]}
          </span>
        </div>
      )}

      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      )}

      <div className="absolute top-3 right-3 z-20">
        <div className={`rounded-md px-1 py-0.5 ${hasImage ? "bg-ink/30 backdrop-blur-sm" : ""}`}>
          <Feedback id={`world:${bullet.link}`} />
        </div>
      </div>

      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 flex flex-col justify-end p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        tabIndex={active ? 0 : -1}
      >
        <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${hasImage ? "text-white/60" : "text-ink-faint"}`}>
          {bullet.source}
        </span>
        <h3 className={`mt-1.5 font-display text-[1.65rem] leading-tight tracking-tight ${hasImage ? "text-white" : "text-ink"}`}>
          {bullet.headline}
        </h3>
        <span className={`mt-3 font-mono text-[10px] uppercase tracking-[0.18em] ${hasImage ? "text-white/45" : "text-accent"}`}>
          read more →
        </span>
      </a>
    </div>
  );
}
