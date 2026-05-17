// Sports briefing. LLM picks lead + 4 secondary, with FOR YOU flag on preference matches.

import { unstable_cache } from "next/cache";
import { generate } from "@/lib/llm";
import { fetchSportsNews, type Sport, type SportFeedItem } from "./news";
import { getSportsStrip, type StripState } from "./strip";
import { preferenceTerms } from "@/config/preferences";

async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DailyCompanion/1.0)" },
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const raw = m?.[1];
    if (!raw || raw.startsWith("data:")) return undefined;
    return raw.startsWith("http") ? raw : new URL(raw, url).href;
  } catch {
    return undefined;
  }
}

export type SportBullet = {
  headline: string;
  why: string;
  source: string;
  link: string;
  image?: string;
  originalTitle: string;
  sport: Sport;
  forYou: boolean;
};

export type SportsBriefing = {
  strip: StripState;
  lead: SportBullet | null;
  rest: SportBullet[];
  rawBySport: Record<string, SportFeedItem[]>;
  generatedAt: string;
  itemCount: number;
};

async function fetchSportsBriefing(): Promise<SportsBriefing> {
  const [items, strip] = await Promise.all([fetchSportsNews(), getSportsStrip()]);

  const rawBySport: Record<string, SportFeedItem[]> = {};
  for (const item of items) {
    if (!rawBySport[item.sport]) rawBySport[item.sport] = [];
    rawBySport[item.sport].push(item);
  }

  if (items.length === 0) {
    const empty: SportsBriefing = {
      strip,
      lead: null,
      rest: [],
      rawBySport: {},
      generatedAt: new Date().toISOString(),
      itemCount: 0,
    };
    return empty;
  }

  const recent = sortByDate(items).slice(0, 30);
  const terms = preferenceTerms();

  // Mark which items match preferences (any term appears in title or snippet).
  const tagged = recent.map((it, i) => ({
    ...it,
    index: i,
    matchesPref: containsAny(`${it.title} ${it.snippet}`.toLowerCase(), terms),
  }));

  const prompt = buildPrompt(tagged);
  const raw = await generate(prompt);
  const picks = parsePicks(raw, tagged);
  const rawBullets: SportBullet[] = picks.length ? picks : fallbackBullets(tagged);

  const bullets = await Promise.all(
    rawBullets.map(async (b) => {
      if (b.image) return b;
      const og = await fetchOgImage(b.link);
      return og ? { ...b, image: og } : b;
    }),
  );

  return {
    strip,
    lead: bullets[0] ?? null,
    rest: bullets.slice(1, 5),
    rawBySport,
    generatedAt: new Date().toISOString(),
    itemCount: recent.length,
  };
}

export const getSportsBriefing = unstable_cache(
  fetchSportsBriefing,
  ["sports-briefing"],
  { revalidate: 3600, tags: ["sports-briefing"] },
);

function sortByDate(items: SportFeedItem[]): SportFeedItem[] {
  return [...items].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
}

function containsAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => n.length > 1 && hay.includes(n));
}

type TaggedItem = SportFeedItem & { index: number; matchesPref: boolean };

function buildPrompt(items: TaggedItem[]): string {
  const list = items
    .map(
      (it) =>
        `[${it.index}] (${it.source} · ${it.sport}${it.matchesPref ? " · FOLLOWED" : ""}) ${it.title}\n    ${it.snippet}`,
    )
    .join("\n");

  return `You curate a sports briefing for a fan in Colombo. He follows: cricket (Sri Lanka, Chennai Super Kings), F1 (Verstappen / Red Bull), football (Arsenal). Items tagged FOLLOWED match his teams — strongly prefer these for the lead.

From the items below, pick FIVE most important. The first pick is the lead (gets a hero image).

Selection rules:
- Lead must be a FOLLOWED item if any has news today; otherwise the biggest general-sport story.
- Don't pick five items from the same sport — aim for 2 cricket / 2 football / 1 F1 if possible, but lean toward FOLLOWED items.
- Skip transfer rumours / clickbait if real news is available.
- No spoilers in the headline if the strip is showing a result for the same match.

For each pick, return:
- id: the [number] from the list
- headline: punchy editorial voice (max 10 words, no clickbait)
- why: one sentence on why it matters TO HIM (max 20 words)

Return ONLY valid JSON, no markdown, exactly:
{"picks":[{"id":3,"headline":"...","why":"..."}]}

Items:
${list}`;
}

type ParsedPick = { id: number; headline: string; why: string };

function parsePicks(raw: string, items: TaggedItem[]): SportBullet[] {
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  const picks = (parsed as { picks?: unknown })?.picks;
  if (!Array.isArray(picks)) return [];

  return picks
    .filter((p): p is ParsedPick => {
      if (typeof p !== "object" || p === null) return false;
      const o = p as Record<string, unknown>;
      return (
        typeof o.id === "number" &&
        typeof o.headline === "string" &&
        typeof o.why === "string"
      );
    })
    .map((p): SportBullet | null => {
      const item = items[p.id];
      if (!item) return null;
      return {
        headline: p.headline,
        why: p.why,
        source: item.source,
        link: item.link,
        image: item.image,
        originalTitle: item.title,
        sport: item.sport,
        forYou: item.matchesPref,
      };
    })
    .filter((b): b is SportBullet => b !== null)
    .slice(0, 5);
}

function fallbackBullets(items: TaggedItem[]): SportBullet[] {
  return items.slice(0, 5).map((it) => ({
    headline: it.title,
    why: it.snippet.slice(0, 140),
    source: it.source,
    link: it.link,
    image: it.image,
    originalTitle: it.title,
    sport: it.sport,
    forYou: it.matchesPref,
  }));
}
