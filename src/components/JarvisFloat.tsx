"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvis, type JarvisState } from "@/hooks/useJarvis";

const MIC_COLOR: Record<JarvisState, string> = {
  idle: "bg-ink text-paper/50 hover:text-accent border-paper/10 hover:border-accent/40",
  listening: "bg-ink text-red-400 border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.25)]",
  thinking: "bg-ink text-accent/60 border-accent/30",
  speaking: "bg-ink text-accent border-accent shadow-[0_0_20px_rgba(194,65,12,0.2)]",
  error: "bg-ink text-red-400/70 border-red-400/40",
  unsupported: "bg-ink text-paper/20 border-paper/10",
};

export function JarvisFloat() {
  const [open, setOpen] = useState(false);
  const { state, transcript, reply, activate, reset } = useJarvis();

  const hasContent = !!(transcript || reply);
  const isActive = state !== "idle" && state !== "error" && state !== "unsupported";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-72 overflow-hidden rounded-2xl border border-paper/10 bg-ink shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <motion.span
                  className={`h-1.5 w-1.5 rounded-full ${state === "listening" ? "bg-red-400" : "bg-accent"}`}
                  animate={{ opacity: state === "idle" ? [1, 0.3, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                  Jarvis
                </span>
              </div>
              <button
                onClick={() => { reset(); setOpen(false); }}
                className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/30 transition-colors hover:text-paper/70"
              >
                Close
              </button>
            </div>

            {/* Panel body */}
            <div className="px-4 py-4">
              {/* State */}
              <p className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                state === "listening" ? "text-red-400" :
                state === "speaking" ? "text-accent" :
                state === "thinking" ? "text-accent/60" :
                state === "error" ? "text-red-400/80" :
                "text-paper/30"
              }`}>
                {state === "idle" && !hasContent ? "Press mic to talk" :
                 state === "listening" ? "Listening…" :
                 state === "thinking" ? "Thinking…" :
                 state === "speaking" ? "Speaking…" :
                 state === "error" ? "Something went wrong" :
                 state === "unsupported" ? "Not supported in this browser" :
                 "Ready"}
              </p>

              {/* Transcript + reply */}
              {hasContent && (
                <div className="mt-3 space-y-3">
                  {transcript && (
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/25">You</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-paper/60">{transcript}</p>
                    </div>
                  )}
                  {reply && (
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-accent/50">Jarvis</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-paper/85">{reply}</p>
                    </div>
                  )}
                  <button
                    onClick={reset}
                    className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/20 transition-colors hover:text-paper/50"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Mic button */}
              <button
                onClick={activate}
                disabled={state === "thinking" || state === "unsupported"}
                aria-label="Talk to Jarvis"
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                  state === "listening"
                    ? "border-red-400/60 text-red-400"
                    : "border-paper/10 text-paper/50 hover:border-accent/40 hover:text-accent"
                }`}
              >
                {state === "thinking" ? (
                  <motion.div
                    className="h-3.5 w-3.5 rounded-full border-2 border-accent/60 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v3M8 22h8" />
                  </svg>
                )}
                <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
                  {state === "speaking" ? "Stop" : state === "listening" ? "Listening" : "Talk"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Jarvis"
        className={`relative grid h-14 w-14 place-items-center rounded-full border-2 transition-all duration-300 ${MIC_COLOR[open ? (isActive ? state : "idle") : state]}`}
      >
        {/* Active pulse ring */}
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-full border border-accent/40"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v3M8 22h8" />
        </svg>
      </button>
    </div>
  );
}
