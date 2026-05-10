// Cricket via CricAPI (free tier ~100/day). Conservative caching to protect quota.
// Docs: https://cricapi.com/how-to-use

const TTL_MS = 10 * 60 * 1000;

export type CricketMatch = {
  id: string;
  name: string; // "Team A vs Team B"
  matchType: string; // "t20", "test", etc.
  status: string; // human-readable status from API
  venue: string;
  startUtc: Date | null;
  isLive: boolean;
  hasFinished: boolean;
  followed: boolean; // matches a preference team
};

export type CricketState = {
  followed: CricketMatch[]; // matches involving preference teams
  notable: CricketMatch[]; // other current/upcoming matches
};

const EMPTY: CricketState = { followed: [], notable: [] };
let cache: { data: CricketState; expires: number } | null = null;

export async function getCricketState(followedTeams: string[]): Promise<CricketState> {
  if (cache && Date.now() < cache.expires) return cache.data;

  const key = process.env.CRICAPI_KEY;
  if (!key) return EMPTY;

  try {
    // currentMatches gives live + recently finished + upcoming in one call.
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return EMPTY;
    const json = await res.json();
    const list: unknown[] = Array.isArray(json?.data) ? json.data : [];

    const lcTeams = followedTeams.map((t) => t.toLowerCase());

    const matches: CricketMatch[] = list
      .map((raw): CricketMatch | null => {
        if (typeof raw !== "object" || raw === null) return null;
        const m = raw as Record<string, unknown>;
        const teams = Array.isArray(m.teams) ? (m.teams as string[]) : [];
        const name =
          typeof m.name === "string" ? m.name : teams.join(" vs ") || "Match";
        const matchType = (m.matchType as string) ?? "";
        const status = (m.status as string) ?? "";
        const venue = (m.venue as string) ?? "";
        const dateStr = (m.dateTimeGMT as string) ?? (m.date as string) ?? "";
        const startUtc = dateStr ? new Date(dateStr) : null;
        const matchStarted = m.matchStarted === true;
        const matchEnded = m.matchEnded === true;
        const isLive = matchStarted && !matchEnded;
        const hayName = name.toLowerCase();
        const hayTeams = teams.map((t) => t.toLowerCase());
        const followed = lcTeams.some(
          (t) => hayName.includes(t) || hayTeams.some((ht) => ht.includes(t)),
        );
        return {
          id: typeof m.id === "string" ? m.id : crypto.randomUUID(),
          name,
          matchType,
          status,
          venue,
          startUtc,
          isLive,
          hasFinished: matchEnded,
          followed,
        };
      })
      .filter((m): m is CricketMatch => m !== null);

    const data: CricketState = {
      followed: matches.filter((m) => m.followed),
      notable: matches.filter((m) => !m.followed).slice(0, 6),
    };
    cache = { data, expires: Date.now() + TTL_MS };
    return data;
  } catch {
    return EMPTY;
  }
}
