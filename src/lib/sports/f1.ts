// F1 schedule + last result via Jolpica-F1 (Ergast successor, no key required).
// Docs: https://github.com/jolpica/jolpica-f1

const BASE = "https://api.jolpi.ca/ergast/f1";
const TTL_MS = 10 * 60 * 1000;

export type F1Race = {
  round: number;
  raceName: string;
  circuit: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM:SSZ
  startUtc: Date | null;
};

export type F1Result = {
  raceName: string;
  date: string;
  winner: string; // "Driver Surname"
  winnerTeam: string;
};

export type F1State = {
  nextRace: F1Race | null;
  lastResult: F1Result | null;
};

let cache: { data: F1State; expires: number } | null = null;

export async function getF1State(): Promise<F1State> {
  if (cache && Date.now() < cache.expires) return cache.data;

  const [next, last] = await Promise.all([fetchNextRace(), fetchLastResult()]);
  const data = { nextRace: next, lastResult: last };
  cache = { data, expires: Date.now() + TTL_MS };
  return data;
}

async function fetchNextRace(): Promise<F1Race | null> {
  try {
    const res = await fetch(`${BASE}/current/next.json`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const race = json?.MRData?.RaceTable?.Races?.[0];
    if (!race) return null;
    const startUtc =
      race.date && race.time ? new Date(`${race.date}T${race.time}`) : null;
    return {
      round: Number(race.round),
      raceName: race.raceName,
      circuit: race.Circuit?.circuitName ?? "",
      date: race.date,
      time: race.time,
      startUtc,
    };
  } catch {
    return null;
  }
}

async function fetchLastResult(): Promise<F1Result | null> {
  try {
    const res = await fetch(`${BASE}/current/last/results.json`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const race = json?.MRData?.RaceTable?.Races?.[0];
    const winner = race?.Results?.[0];
    if (!race || !winner) return null;
    return {
      raceName: race.raceName,
      date: race.date,
      winner: `${winner.Driver?.givenName ?? ""} ${winner.Driver?.familyName ?? ""}`.trim(),
      winnerTeam: winner.Constructor?.name ?? "",
    };
  } catch {
    return null;
  }
}
