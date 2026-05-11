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

  // Reset timer whenever current slide changes or pause state changes
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setTimeout(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearTimeout(id);
  }, [paused, total, current]);

  if (!total) return null;

  const go = (n: number) => setCurrent(((n % total) + total) % total);

  return (
    <div className="flex flex-col gap-4">
      {/* Slideshow */}
      <div
        className="group/sw relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper-deep"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {bullets.map((b, i) => (
          <Slide key={b.link} bullet={b} active={i === current} />
        ))}

        {/* Arrows — only visible on hover */}
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

        {/* Progress bar — resets via key on slide change */}
        {total > 1 && !paused && (
          <div
            key={current}
            className="absolute bottom-0 left-0 z-30 h-[2px] bg-white/50 slide-progress"
          />
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-2">
          {bullets.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Story ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Headline index — click to jump to slide */}
      <div className="space-y-0.5 border-t border-rule pt-3">
        {bullets.map((b, i) => (
          <button
            key={b.link}
            onClick={() => go(i)}
            className={`group/idx w-full text-left flex items-baseline gap-3 rounded-lg px-2 py-1.5 transition-colors ${
              i === current ? "bg-accent/8" : "hover:bg-paper-deep/70"
            }`}
          >
            <span className="w-3 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
              {i + 1}
            </span>
            <span
              className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] ${
                i === current
                  ? "text-accent"
                  : "text-ink-faint group-hover/idx:text-ink-soft"
              }`}
            >
              {b.source}
            </span>
            <span
              className={`line-clamp-1 font-display text-[13px] leading-snug ${
                i === current ? "text-ink" : "text-ink-soft"
              }`}
            >
              {b.headline}
            </span>
          </button>
        ))}
      </div>
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
      {/* Background: image or typographic fallback */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bullet.image!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth < 800 || img.naturalHeight < 450) setImgFailed(true);
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-paper-deep">
          <span className="select-none font-display text-[100px] uppercase leading-none tracking-tight text-ink/[0.05]">
            {bullet.source.split(" ")[0]}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 ${
          hasImage
            ? "bg-gradient-to-t from-ink/85 via-ink/20 to-transparent"
            : "bg-gradient-to-b from-paper-deep/0 via-transparent to-paper-deep/30"
        }`}
      />

      {/* Dots row top-left, feedback top-right */}
      <div className="absolute top-3 right-3 z-20">
        <div
          className={`rounded-md px-1 py-0.5 ${
            hasImage ? "bg-ink/30 backdrop-blur-sm" : ""
          }`}
        >
          <Feedback id={`world:${bullet.link}`} />
        </div>
      </div>

      {/* Clickable content — full-slide link */}
      <a
        href={bullet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex flex-col justify-end p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        tabIndex={active ? 0 : -1}
      >
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
            hasImage ? "text-white/60" : "text-ink-faint"
          }`}
        >
          {bullet.source}
        </span>
        <h3
          className={`mt-1.5 font-display text-[1.65rem] leading-tight tracking-tight ${
            hasImage ? "text-white" : "text-ink"
          }`}
        >
          {bullet.headline}
        </h3>
        <p
          className={`mt-2 line-clamp-2 text-[13px] leading-relaxed ${
            hasImage ? "text-white/75" : "text-ink-soft"
          }`}
        >
          {bullet.why}
        </p>
        <span
          className={`mt-3 font-mono text-[10px] uppercase tracking-[0.18em] ${
            hasImage ? "text-white/45" : "text-accent"
          }`}
        >
          read more →
        </span>
      </a>
    </div>
  );
}
