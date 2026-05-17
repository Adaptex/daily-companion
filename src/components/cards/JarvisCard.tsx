"use client";

import { motion } from "framer-motion";
import { useJarvis, type JarvisState } from "@/hooks/useJarvis";

const STATE_LABEL: Record<JarvisState, string> = {
  idle: "Press to talk",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Something went wrong",
  unsupported: "Not supported in this browser",
};

const MIC_RING: Record<JarvisState, string> = {
  idle: "border-paper/10 text-paper/30 hover:border-accent/50 hover:text-accent/80",
  listening: "border-red-400 text-red-400 shadow-[0_0_24px_rgba(248,113,113,0.3)]",
  thinking: "border-accent/60 text-accent/60",
  speaking: "border-accent text-accent shadow-[0_0_24px_rgba(194,65,12,0.25)]",
  error: "border-red-400/60 text-red-400/60",
  unsupported: "border-paper/10 text-paper/20",
};

function Waveform({ state }: { state: JarvisState }) {
  const bars = [2, 5, 8, 13, 18, 13, 8, 5, 2, 5, 8, 13, 8, 5, 2];
  const isActive = state === "listening" || state === "speaking";
  const isThinking = state === "thinking";

  return (
    <div className="flex items-end gap-[3px]">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full origin-bottom transition-colors duration-500 ${
            isActive
              ? state === "listening"
                ? "bg-red-400"
                : "bg-accent"
              : isThinking
              ? "bg-accent/40"
              : "bg-accent/20"
          }`}
          style={{ height: `${h * 2}px` }}
          animate={
            isActive
              ? { scaleY: [0.5, 1.5, 0.5] }
              : isThinking
              ? { scaleY: [0.8, 1.1, 0.8] }
              : { scaleY: 0.6 }
          }
          transition={{
            duration: isActive ? 0.45 : 1.4,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function MicButton({
  state,
  onClick,
}: {
  state: JarvisState;
  onClick: () => void;
}) {
  const disabled = state === "thinking" || state === "unsupported";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={STATE_LABEL[state]}
      className={`grid h-14 w-14 flex-none place-items-center rounded-full border-2 transition-all duration-300 ${MIC_RING[state]} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {state === "thinking" ? (
        <motion.div
          className="h-4 w-4 rounded-full border-2 border-accent/60 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v3M8 22h8" />
        </svg>
      )}
    </button>
  );
}

export function JarvisCard() {
  const { state, transcript, reply, activate, reset } = useJarvis();
  const hasContent = !!(transcript || reply);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-ink p-7 sm:p-9">
      {/* Scan line */}
      <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
      {/* Grain */}
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-25 mix-blend-screen" />

      {/* Header row */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <motion.span
              className={`h-1.5 w-1.5 rounded-full ${
                state === "listening" ? "bg-red-400" : "bg-accent"
              }`}
              animate={{ opacity: state === "idle" ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
              Section G · AI Companion
            </span>
          </div>
          <h2 className="mt-2 font-display text-[38px] leading-tight tracking-tight text-paper sm:text-[48px]">
            Jarvis
          </h2>
        </div>
        <Waveform state={state} />
      </div>

      {/* State label + mic button */}
      <div className="relative z-10 mt-6 flex items-center gap-4 sm:mt-8">
        <MicButton state={state} onClick={activate} />
        <div>
          <p className={`font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
            state === "listening" ? "text-red-400" :
            state === "speaking" ? "text-accent" :
            state === "thinking" ? "text-accent/60" :
            state === "error" ? "text-red-400/80" :
            "text-paper/40"
          }`}>
            {STATE_LABEL[state]}
          </p>
          {state === "idle" && !hasContent && (
            <p className="mt-0.5 text-[13px] leading-snug text-paper/30">
              Ask about your day, the news, sports, or anything.
            </p>
          )}
        </div>
      </div>

      {/* Transcript + reply */}
      {hasContent && (
        <div className="relative z-10 mt-6 space-y-3 border-t border-paper/10 pt-5">
          {transcript && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/30">You said</p>
              <p className="mt-1 text-[14px] leading-snug text-paper/60">{transcript}</p>
            </div>
          )}
          {reply && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent/60">Jarvis</p>
              <p className="mt-1 text-[15px] leading-relaxed text-paper/90">{reply}</p>
            </div>
          )}
          <button
            onClick={reset}
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/20 transition-colors hover:text-paper/50"
          >
            Clear
          </button>
        </div>
      )}
    </article>
  );
}
