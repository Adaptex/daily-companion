import { fetchManyFeeds, type FeedItem } from "./feeds";
import { generate } from "./llm";

const WORLD_AI_FEEDS = [
  { source: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { source: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { source: "Anthropic", url: "https://www.anthropic.com/news/rss.xml" },
  { source: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { source: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
];

export type Bullet = {
  headline: string;
  why: string;
  source: string;
  link: string;
  image?: string;
  originalTitle: string;
};

export type WorldAIBriefing = {
  lead: Bullet | null;
  rest: Bullet[];
  generatedAt: string;
  itemCount: number;
};

const TTL_MS = 10 * 60 * 1000;
let cache: { data: WorldAIBriefing; expires: number } | null = null;

export async function getWorldAIBriefing(force = false): Promise<WorldAIBriefing> {
  if (!force && cache && Date.now() < cache.expires) return cache.data;

  const items = await fetchManyFeeds(WORLD_AI_FEEDS);

  if (items.length === 0) {
    const empty: WorldAIBriefing = {
      lead: null,
      rest: [],
      generatedAt: new Date().toISOString(),
      itemCount: 0,
    };
    return empty;
  }

  const recent = sortByDate(items).slice(0, 30);
  const prompt = buildPrompt(recent);
  const raw = await generate(prompt);
  const picks = parsePicks(raw, recent);
  const bullets: Bullet[] = picks.length ? picks : fallbackBullets(recent);

  const data: WorldAIBriefing = {
    lead: bullets[0] ?? null,
    rest: bullets.slice(1, 6),
    generatedAt: new Date().toISOString(),
    itemCount: recent.length,
  };

  cache = { data, expires: Date.now() + TTL_MS };
  return data;
}

export function invalidateBriefingCache(): void {
  cache = null;
}

function sortByDate(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
}

function buildPrompt(items: FeedItem[]): string {
  const list = items
    .map((it, i) => `[${i}] (${it.source}) ${it.title}\n    ${it.snippet}`)
    .join("\n");

  return `You curate a morning briefing for a software engineer in Colombo, Sri Lanka. He cares most about:
- AI / model releases (Anthropic, OpenAI, Google, open-source)
- Big tech moves that affect his work
- Major world events that move markets or daily life
- Genuinely interesting science / culture (rare)

He skips: clickbait, celebrity gossip, minor regional politics, sports (separate card), and routine stock-ticker news.

From the items below, pick the SIX most important. The first pick should be the single biggest story today (it gets a hero image).

For each pick, return:
- id: the [number] from the list
- headline: rewritten in punchy editorial voice (max 11 words, no clickbait)
- why: one crisp sentence on why it matters to him (max 22 words)

Return ONLY valid JSON, no markdown, in exactly this shape:
{"picks":[{"id":3,"headline":"...","why":"..."}]}

Items:
${list}`;
}

type ParsedPick = { id: number; headline: string; why: string };

function parsePicks(raw: string, items: FeedItem[]): Bullet[] {
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
    .map((p) => {
      const item = items[p.id];
      if (!item) return null;
      return {
        headline: p.headline,
        why: p.why,
        source: item.source,
        link: item.link,
        image: item.image,
        originalTitle: item.title,
      } satisfies Bullet;
    })
    .filter((b): b is Bullet => b !== null)
    .slice(0, 6);
}

function fallbackBullets(items: FeedItem[]): Bullet[] {
  return items.slice(0, 6).map((it) => ({
    headline: it.title,
    why: it.snippet.slice(0, 140),
    source: it.source,
    link: it.link,
    image: it.image,
    originalTitle: it.title,
  }));
}
