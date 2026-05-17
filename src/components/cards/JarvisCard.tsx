"use client";

import { motion } from "framer-motion";

export function JarvisCard() {
  return (
    <article className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-ink p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
      {/* Scanning line */}
      <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

      {/* Grain on dark background */}
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-25 mix-blend-screen" />

      {/* Content */}
      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            Section G · Initializing
          </span>
        </div>
        <h2 className="mt-3 font-display text-[38px] leading-tight tracking-tight text-paper sm:text-[48px]">
          Jarvis
        </h2>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-paper/50">
          Your AI companion. Press to talk. It listens, remembers, and responds — out loud.
        </p>
      </div>

      {/* Waveform */}
      <div className="relative z-10 flex flex-none items-end gap-[3px] self-center">
        {[2, 5, 8, 13, 18, 13, 8, 5, 2, 5, 8, 13, 8, 5, 2].map((h, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-accent/30 origin-bottom"
            style={{ height: `${h * 2}px` }}
            animate={{ scaleY: [0.8, 1.3, 0.8] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="relative z-10 flex flex-none items-center gap-3 self-start sm:self-center">
        <div className="rounded-full border border-paper/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/30">
          coming soon
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full border border-paper/10 text-paper/20 transition group-hover:border-accent/40 group-hover:text-accent/70">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3M8 22h8" />
          </svg>
        </div>
      </div>
    </article>
  );
}
