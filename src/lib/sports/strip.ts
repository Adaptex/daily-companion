// Resolves the 3 sport sources into a single editorial "status strip" line.
// Priority: LIVE > NEXT (within 24h) > YESTERDAY's RESULT > null.

import { PREFERENCES } from "@/config/preferences";
import { getCricketState } from "./cricket";
import { getF1State } from "./f1";
import { getFootballState } from "./football";

export type StripState =
  | {
      kind: "live";
      sport: "cricket" | "f1" | "football";
      label: string; // "LIVE NOW"
      title: string; // "Sri Lanka 142/4 (15 ov) vs Pakistan"
      sub?: string; // venue / over / etc.
    }
  | {
      kind: "next";
      sport: "cricket" | "f1" | "football";
      label: string; // "NEXT — IN 4H 12M"
      title: string;
      sub?: string;
    }
  | {
      kind: "result";
      sport: "cricket" | "f1" | "football";
      label: string; // "YESTERDAY"
      title: string;
      sub?: string;
    }
  | null;

const WITHIN_NEXT_MS = 24 * 60 * 60 * 1000;
const WITHIN_RESULT_MS = 36 * 60 * 60 * 1000;

export async function getSportsStrip(): Promise<StripState> {
  const prefs = PREFERENCES.sports;

  const [cricket, f1, football] = await Promise.all([
    prefs.cricket.enabled
      ? getCricketState(prefs.cricket.teams)
      : Promise.resolve({ followed: [], notable: [] }),
    prefs.f1.enabled ? getF1State() : Promise.resolve({ nextRace: null, lastResult: null }),
    prefs.football.enabled
      ? getFootballState(prefs.football.clubs)
      : Promise.resolve({ live: null, next: null, last: null }),
  ]);

  const now = Date.now();

  // 1. LIVE — cricket followed match wins, then football live, then nothing for F1 (no live timing in free APIs).
  const liveCricket = cricket.followed.find((m) => m.isLive);
  if (liveCricket) {
    return {
      kind: "live",
      sport: "cricket",
      label: "LIVE NOW",
      title: liveCricket.name,
      sub: liveCricket.status || liveCricket.venue,
    };
  }
  if (football.live) {
    const f = football.live;
    const score =
      f.scoreHome !== null && f.scoreAway !== null
        ? ` ${f.scoreHome}-${f.scoreAway}`
        : "";
    return {
      kind: "live",
      sport: "football",
      label: "LIVE NOW",
      title: `${f.homeTeam}${score ? "" : " vs"} ${score} ${score ? "vs " : ""}${f.awayTeam}`.trim(),
      sub: f.competition,
    };
  }

  // 2. NEXT — pick the soonest start within 24h across all sports.
  type Candidate = { ms: number; build: () => StripState };
  const candidates: Candidate[] = [];

  const upcomingCricket = cricket.followed
    .filter((m) => m.startUtc && !m.hasFinished && !m.isLive)
    .sort((a, b) => a.startUtc!.getTime() - b.startUtc!.getTime())[0];
  if (upcomingCricket?.startUtc) {
    const ms = upcomingCricket.startUtc.getTime() - now;
    if (ms > 0 && ms <= WITHIN_NEXT_MS) {
      candidates.push({
        ms,
        build: () => ({
          kind: "next",
          sport: "cricket",
          label: `NEXT — ${formatCountdown(ms)}`,
          title: upcomingCricket.name,
          sub: upcomingCricket.venue,
        }),
      });
    }
  }
  if (f1.nextRace?.startUtc) {
    const ms = f1.nextRace.startUtc.getTime() - now;
    if (ms > 0 && ms <= WITHIN_NEXT_MS) {
      candidates.push({
        ms,
        build: () => ({
          kind: "next",
          sport: "f1",
          label: `RACE — ${formatCountdown(ms)}`,
          title: f1.nextRace!.raceName,
          sub: f1.nextRace!.circuit,
        }),
      });
    }
  }
  if (football.next?.startUtc) {
    const ms = football.next.startUtc.getTime() - now;
    if (ms > 0 && ms <= WITHIN_NEXT_MS) {
      candidates.push({
        ms,
        build: () => ({
          kind: "next",
          sport: "football",
          label: `NEXT — ${formatCountdown(ms)}`,
          title: `${football.next!.homeTeam} vs ${football.next!.awayTeam}`,
          sub: football.next!.competition,
        }),
      });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.ms - b.ms);
    return candidates[0].build();
  }

  // 3. YESTERDAY's RESULT — most recent finished within 36h.
  type Result = { ms: number; build: () => StripState };
  const results: Result[] = [];

  const lastCricket = cricket.followed
    .filter((m) => m.hasFinished && m.startUtc)
    .sort((a, b) => b.startUtc!.getTime() - a.startUtc!.getTime())[0];
  if (lastCricket?.startUtc) {
    const ms = now - lastCricket.startUtc.getTime();
    if (ms <= WITHIN_RESULT_MS) {
      results.push({
        ms,
        build: () => ({
          kind: "result",
          sport: "cricket",
          label: "RECENT RESULT",
          title: lastCricket.name,
          sub: lastCricket.status,
        }),
      });
    }
  }
  if (f1.lastResult) {
    const raceDate = Date.parse(f1.lastResult.date);
    if (!Number.isNaN(raceDate)) {
      const ms = now - raceDate;
      if (ms <= WITHIN_RESULT_MS * 2) {
        results.push({
          ms,
          build: () => ({
            kind: "result",
            sport: "f1",
            label: "LAST RACE",
            title: `${f1.lastResult!.winner} won the ${f1.lastResult!.raceName}`,
            sub: f1.lastResult!.winnerTeam,
          }),
        });
      }
    }
  }
  if (football.last?.startUtc) {
    const ms = now - football.last.startUtc.getTime();
    if (ms <= WITHIN_RESULT_MS) {
      const f = football.last;
      const score =
        f.scoreHome !== null && f.scoreAway !== null
          ? `${f.scoreHome}–${f.scoreAway}`
          : "";
      results.push({
        ms,
        build: () => ({
          kind: "result",
          sport: "football",
          label: "LAST MATCH",
          title: `${f.homeTeam} ${score} ${f.awayTeam}`,
          sub: f.competition,
        }),
      });
    }
  }

  if (results.length > 0) {
    results.sort((a, b) => a.ms - b.ms);
    return results[0].build();
  }

  return null;
}

function formatCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 1) return `IN ${h}H ${m}M`;
  return `IN ${m}M`;
}
