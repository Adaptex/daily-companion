"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL = 30 * 60 * 1000;
const MIN_FOCUS_GAP = 30 * 60 * 1000;

export function AutoRefresh() {
  const router = useRouter();
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const doRefresh = () => {
      lastRefresh.current = Date.now();
      router.refresh();
    };

    const tick = () => {
      if (document.visibilityState === "visible") doRefresh();
    };

    const onFocus = () => {
      if (Date.now() - lastRefresh.current >= MIN_FOCUS_GAP) doRefresh();
    };

    const id = window.setInterval(tick, REFRESH_INTERVAL);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
