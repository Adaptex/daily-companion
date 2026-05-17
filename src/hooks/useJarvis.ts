"use client";

import { useState, useRef, useCallback } from "react";

export type JarvisState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "unsupported";

export type JarvisMessage = { role: "user" | "assistant"; content: string };

export type JarvisHook = {
  state: JarvisState;
  transcript: string;
  reply: string;
  history: JarvisMessage[];
  activate: () => void;
  reset: () => void;
};

export function useJarvis(): JarvisHook {
  const [state, setState] = useState<JarvisState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [history, setHistory] = useState<JarvisMessage[]>([]);

  // Refs to avoid stale closures in speech callbacks
  const historyRef = useRef<JarvisMessage[]>([]);
  const stateRef = useRef<JarvisState>("idle");

  const setStateSync = (s: JarvisState) => {
    stateRef.current = s;
    setState(s);
  };

  const updateHistory = (msgs: JarvisMessage[]) => {
    historyRef.current = msgs;
    setHistory(msgs);
  };

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setStateSync("speaking");
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = "en-GB";
    utterance.onend = () => setStateSync("idle");
    utterance.onerror = () => setStateSync("idle");
    speechSynthesis.speak(utterance);
  }, []);

  const sendToApi = useCallback(
    async (userText: string) => {
      setStateSync("thinking");
      const msgs: JarvisMessage[] = [
        ...historyRef.current,
        { role: "user", content: userText },
      ];

      try {
        const res = await fetch("/api/jarvis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: msgs }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const replyText: string = data.reply ?? "I did not get a response.";
        setReply(replyText);
        updateHistory([...msgs, { role: "assistant", content: replyText }]);
        speak(replyText);
      } catch {
        setStateSync("error");
        setReply("Could not reach Jarvis. Check your connection.");
      }
    },
    [speak],
  );

  const activate = useCallback(() => {
    const current = stateRef.current;

    // Interrupt if speaking
    if (current === "speaking") {
      speechSynthesis.cancel();
      setStateSync("idle");
      return;
    }

    if (current === "listening" || current === "thinking") return;

    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStateSync("unsupported");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-GB";

    recognition.onstart = () => setStateSync("listening");

    recognition.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const text: string = e.results[0][0].transcript;
      setTranscript(text);
      sendToApi(text);
    };

    recognition.onerror = (e: { error: string }) => {
      if (e.error === "no-speech") {
        setStateSync("idle");
      } else {
        setStateSync("error");
        setReply(`Mic error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      if (stateRef.current === "listening") setStateSync("idle");
    };

    recognition.start();
  }, [sendToApi]);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") speechSynthesis.cancel();
    setStateSync("idle");
    setTranscript("");
    setReply("");
    updateHistory([]);
  }, []);

  return { state, transcript, reply, history, activate, reset };
}
