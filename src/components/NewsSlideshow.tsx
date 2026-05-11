"use client";

import { useState, useEffect } from "react";
import type { Bullet } from "@/lib/briefing";
import { Feedback } from "@/components/Feedback";

interface Props {
  bullets: Bullet[];
}

export function NewsSlideshow({ bullets }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = bullets.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setTimeout(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearTimeout(id);
  }, [paused, total, current]);

  if (!total) return null;

  const go = (n: number) => setCurrent(((n % total) + total) % total);

  return (
    <div className="flex flex-col gap-3">
      {/* Slideshow */}
      <div
        className="group/sw relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper-deep"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {bullets.map((b, i) => (
          <Slide key={b.link} bullet={b} active={i === current} />
        ))}

        {/* Arrows — show on hover */}
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

        {/* Progress bar — resets via key */}
        {total > 1 && !paused && (
          <div key={current} className="absolute bottom-0 left-0 z-30 h-[2px] bg-white/50 slide-progress" />
        )}
      </div>

      {/* Why this matters strip */}
      <div className="rounded-xl border border-rule bg-paper-deep/40 px-4 py-3">
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
          Why it matters
        </p>
        <p key={current} className="slide-why-in min-h-[2.25rem] text-[13px] leading-snug text-ink-soft">
          {bullets[current].why}
        </p>
      </div>

      {/* Source chips — tap to jump to that story */}
      {total > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {bullets.map((b, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Jump to story from ${b.source}`}
              className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
                i === current
                  ? "bg-ink text-paper"
                  : "border border-rule text-ink-faint hover:border-ink/40 hover:text-ink"
              }`}
            >
              {b.source}
            </button>
          ))}
        </div>
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
      {/* Background */}
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
            // Reject portrait headshots and low-res thumbnails
            if (img.naturalWidth < 900 || img.naturalHeight < 500 || ratio < 1.4) {
              setImgFailed(true);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-paper-deep">
          <span className="pointer-events-none select-none absolute right-2 top-0 font-display text-[130px] uppercase leading-none tracking-tight text-ink/[0.04]">
            {bullet.source.split(" ")[0]}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      )}

      {/* Feedback top-right */}
      <div className="absolute top-3 right-3 z-20">
        <div className={`rounded-md px-1 py-0.5 ${hasImage ? "bg-ink/30 backdrop-blur-sm" : ""}`}>
          <Feedback id={`world:${bullet.link}`} />
        </div>
      </div>

      {/* Full-slide link + content */}
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
