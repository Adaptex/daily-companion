// Football via football-data.org (free tier ~10 req/min, limited competitions).
// Docs: https://www.football-data.org/documentation/quickstart

const TTL_MS = 10 * 60 * 1000;

export type FootballFixture = {
  competition: string;
  matchday: number | null;
  homeTeam: string;
  awayTeam: string;
  startUtc: Date | null;
  status: "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED" | "FINISHED" | string;
  scoreHome: number | null;
  scoreAway: number | null;
  followedTeam: string | null; // which preference team is involved
};

export type FootballState = {
  live: FootballFixture | null;
  next: FootballFixture | null;
  last: FootballFixture | null;
};

const EMPTY: FootballState = { live: null, next: null, last: null };
let cache: { data: FootballState; expires: number } | null = null;

// Hardcoded team-name → football-data.org team IDs for known preferences.
// Arsenal = 57. Add more as preferences expand.
const TEAM_IDS: Record<string, number> = {
  arsenal: 57,
};

export async function getFootballState(followedClubs: string[]): Promise<FootballState> {
  if (cache && Date.now() < cache.expires) return cache.data;

  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return EMPTY;

  // Resolve first known club → team ID. (One team per call to stay within free tier.)
  const teamName = followedClubs.find((c) => TEAM_IDS[c.toLowerCase()] !== undefined);
  if (!teamName) return EMPTY;
  const teamId = TEAM_IDS[teamName.toLowerCase()];

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}/matches?limit=10`,
      {
        headers: { "X-Auth-Token": key },
        next: { revalidate: 600 },
      },
    );
    if (!res.ok) return EMPTY;
    const json = await res.json();
    const matches: unknown[] = Array.isArray(json?.matches) ? json.matches : [];

    const fixtures: FootballFixture[] = matches
      .map((raw): FootballFixture | null => {
        if (typeof raw !== "object" || raw === null) return null;
        const m = raw as Record<string, unknown>;
        const utcDate = (m.utcDate as string) ?? "";
        const home = (m.homeTeam as Record<string, unknown> | undefined)?.name as string | undefined;
        const away = (m.awayTeam as Record<string, unknown> | undefined)?.name as string | undefined;
        const score = m.score as Record<string, unknown> | undefined;
        const fullTime = score?.fullTime as Record<string, unknown> | undefined;
        const comp = (m.competition as Record<string, unknown> | undefined)?.name as string | undefined;
        return {
          competition: comp ?? "",
          matchday: typeof m.matchday === "number" ? m.matchday : null,
          homeTeam: home ?? "",
          awayTeam: away ?? "",
          startUtc: utcDate ? new Date(utcDate) : null,
          status: (m.status as string) ?? "SCHEDULED",
          scoreHome: typeof fullTime?.home === "number" ? (fullTime.home as number) : null,
          scoreAway: typeof fullTime?.away === "number" ? (fullTime.away as number) : null,
          followedTeam: teamName,
        };
      })
      .filter((f): f is FootballFixture => f !== null);

    const now = Date.now();
    const live =
      fixtures.find((f) => f.status === "LIVE" || f.status === "IN_PLAY" || f.status === "PAUSED") ??
      null;
    const next =
      fixtures
        .filter((f) => f.status === "SCHEDULED" && f.startUtc && f.startUtc.getTime() > now)
        .sort((a, b) => (a.startUtc!.getTime() - b.startUtc!.getTime()))[0] ?? null;
    const last =
      fixtures
        .filter((f) => f.status === "FINISHED" && f.startUtc)
        .sort((a, b) => (b.startUtc!.getTime() - a.startUtc!.getTime()))[0] ?? null;

    const data: FootballState = { live, next, last };
    cache = { data, expires: Date.now() + TTL_MS };
    return data;
  } catch {
    return EMPTY;
  }
}
