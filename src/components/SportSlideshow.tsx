"use client";

import { useState, useEffect } from "react";
import type { SportBullet } from "@/lib/sports/briefing";
import type { SportFeedItem } from "@/lib/sports/news";
import { Feedback } from "@/components/Feedback";

const SPORT_LABEL: Record<SportBullet["sport"], string> = {
  cricket: "Cricket",
  f1: "F1",
  football: "Football",
  general: "Sport",
};

interface Props {
  bullets: SportBullet[];
  rawBySport: Record<string, SportFeedItem[]>;
}

function feedItemToBullet(item: SportFeedItem): SportBullet {
  return {
    headline: item.title,
    why: item.snippet?.slice(0, 140) ?? "",
    source: item.source,
    link: item.link,
    image: item.image,
    originalTitle: item.title,
    sport: item.sport,
    forYou: false,
  };
}

function highlightsUrl(bullet: SportBullet): string {
  const q = encodeURIComponent(
    `${SPORT_LABEL[bullet.sport]} ${bullet.headline} highlights`,
  );
  return `https://www.youtube.com/results?search_query=${q}`;
}

export function SportSlideshow({ bullets, rawBySport }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportBullet["sport"] | null>(null);

  const filteredBullets = selectedSport
    ? (rawBySport[selectedSport] ?? []).map((raw) => {
        const llmPick = bullets.find((b) => b.link === raw.link);
        return llmPick ?? feedItemToBullet(raw);
      })
    : bullets;
  const total = filteredBullets.length;

  useEffect(() => { setCurrent(0); }, [selectedSport]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setTimeout(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearTimeout(id);
  }, [paused, total, current]);

  if (!bullets.length) return null;

  const go = (n: number) => setCurrent(((n % total) + total) % total);
  const toggleSport = (sport: SportBullet["sport"]) => setSelectedSport(prev => prev === sport ? null : sport);

  return (
    <div className="flex flex-col gap-3">
      {/* Slideshow — 16:9 matches World & AI weight in the 2-col slot */}
      <div
        className="group/sw relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper-deep"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {filteredBullets.map((b, i) => (
          <SportSlide key={`${b.link}-${i}`} bullet={b} active={i === current} />
        ))}

        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go(current - 1); }}
              aria-label="Previous story"
              className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/sw:opacity-100 hover:bg-ink/60"
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M8.5 10.5L4.5 6.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(current + 1); }}
              aria-label="Next story"
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/sw:opacity-100 hover:bg-ink/60"
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M4.5 10.5l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {total > 1 && !paused && (
          <div key={`${selectedSport ?? 'all'}-${current}`} className="absolute bottom-0 left-0 z-30 h-[2px] bg-white/50 slide-progress" />
        )}
      </div>

      {/* Why strip */}
      <div className="rounded-xl border border-rule bg-paper-deep/40 px-4 py-3">
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
          Why it matters
        </p>
        <p key={`${selectedSport ?? 'all'}-${current}`} className="slide-why-in min-h-[2.25rem] text-[13px] leading-snug text-ink-soft">
          {filteredBullets[current]?.why}
        </p>
      </div>

      {/* Fixed sport chips — always show Cricket / Football / F1, dimmed if no stories */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(["cricket", "football", "f1"] as SportBullet["sport"][]).map((sport) => {
          const hasStories = bullets.some(b => b.sport === sport);
          const isActive = selectedSport === sport || (selectedSport === null && hasStories && filteredBullets[current]?.sport === sport);
          const hasForYou = bullets.some(b => b.sport === sport && b.forYou);
          return (
            <button
              key={sport}
              onClick={() => hasStories && toggleSport(sport)}
              disabled={!hasStories}
              aria-label={`Filter to ${SPORT_LABEL[sport]} stories`}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? "bg-ink text-paper"
                  : hasStories
                    ? "border border-rule text-ink-faint hover:border-ink/40 hover:text-ink"
                    : "border border-rule text-ink-faint/30 cursor-not-allowed"
              }`}
            >
              {SPORT_LABEL[sport]}
              {hasForYou && !isActive && hasStories && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}

        {/* YouTube highlights — updates with active slide */}
        <a
          key={`${selectedSport ?? 'all'}-${current}`}
          href={filteredBullets[current] ? highlightsUrl(filteredBullets[current]) : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-accent transition hover:border-accent hover:bg-accent/5"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Highlights
        </a>
      </div>
    </div>
  );
}

function SportSlide({ bullet, active }: { bullet: SportBullet; active: boolean }) {
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
            if (img.naturalWidth < 800 || img.naturalHeight < 450 || ratio < 1.0) {
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
          <span className="pointer-events-none select-none absolute right-2 top-0 font-display text-[90px] uppercase leading-none tracking-tight text-ink/[0.04]">
            {SPORT_LABEL[bullet.sport]}
          </span>
        </div>
      )}

      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      )}

      {/* Sport + For You badges */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <span
          className={`rounded-sm px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${
            hasImage ? "bg-ink/40 text-white/80 backdrop-blur-sm" : "bg-paper text-ink-faint border border-rule"
          }`}
        >
          {SPORT_LABEL[bullet.sport]}
        </span>
        {bullet.forYou && (
          <span className="rounded-sm bg-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
            For You
          </span>
        )}
      </div>

      {/* Feedback */}
      <div className="absolute top-3 right-3 z-20">
        <div className={`rounded-md px-1 py-0.5 ${hasImage ? "bg-ink/30 backdrop-blur-sm" : ""}`}>
          <Feedback id={`sports:${bullet.link}`} />
        </div>
      </div>

      {/* Clickable content */}
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 flex flex-col justify-end p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        tabIndex={active ? 0 : -1}
      >
        <h3
          className={`font-display text-[1.3rem] leading-tight tracking-tight ${
            hasImage ? "text-white" : "text-ink"
          }`}
        >
          {bullet.headline}
        </h3>
        <span
          className={`mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] ${
            hasImage ? "text-white/45" : "text-accent"
          }`}
        >
          {bullet.source} · read more →
        </span>
      </a>
    </div>
  );
}
