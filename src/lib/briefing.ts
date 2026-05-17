import { unstable_cache } from "next/cache";
import { fetchManyFeeds, type FeedItem } from "./feeds";
import { generate } from "./llm";

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

const NEWS_FEEDS = [
  { source: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { source: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { source: "Anthropic", url: "https://www.anthropic.com/news/rss.xml" },
  { source: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { source: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { source: "Guardian Business", url: "https://www.theguardian.com/business/rss" },
];

export type Bullet = {
  headline: string;
  why: string;
  source: string;
  link: string;
  image?: string;
  originalTitle: string;
  category: "world" | "ai" | "tech" | "business";
};

export type WorldAIBriefing = {
  lead: Bullet | null;
  rest: Bullet[];
  generatedAt: string;
  itemCount: number;
};

async function fetchWorldAIBriefing(): Promise<WorldAIBriefing> {
  const items = await fetchManyFeeds(NEWS_FEEDS);

  if (items.length === 0) {
    return { lead: null, rest: [], generatedAt: new Date().toISOString(), itemCount: 0 };
  }

  const recent = sortByDate(items).slice(0, 50);
  const prompt = buildPrompt(recent);
  const raw = await generate(prompt);
  const picks = parsePicks(raw, recent);
  const rawBullets: Bullet[] = picks.length ? picks : fallbackBullets(recent);

  const bullets = await Promise.all(
    rawBullets.map(async (b) => {
      if (b.image) return b;
      const og = await fetchOgImage(b.link);
      return og ? { ...b, image: og } : b;
    }),
  );

  return {
    lead: bullets[0] ?? null,
    rest: bullets.slice(1),
    generatedAt: new Date().toISOString(),
    itemCount: recent.length,
  };
}

export const getWorldAIBriefing = unstable_cache(
  fetchWorldAIBriefing,
  ["world-ai-briefing"],
  { revalidate: 3600, tags: ["world-ai-briefing"] },
);

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

  return `You curate a morning briefing for a software engineer in Colombo, Sri Lanka.

Pick exactly 20 stories: 5 World, 5 AI, 5 Tech, 5 Business. Assign categories based on content, not just source — a BBC article about an AI regulation is "ai", a Guardian Business article about a tech company's stock is "business".

Categories:
- world: major geopolitics, elections, disasters, international relations
- ai: AI/ML model releases, AI products, AI regulation, AI research
- tech: software, hardware, platforms, companies (non-AI)
- business: markets, earnings, finance, economy, mergers

The first pick overall should be the single biggest story today (hero image). Within each category pick the most important stories first.

He skips: sports match results or scores (handled separately), celebrity gossip, minor regional politics, clickbait, routine stock-price tickers.

For each pick return:
- id: the [number] from the list
- headline: punchy editorial voice, max 11 words, no clickbait
- why: one crisp sentence on why it matters to him, max 22 words
- category: exactly one of "world" | "ai" | "tech" | "business"

Return ONLY valid JSON, no markdown:
{"picks":[{"id":3,"headline":"...","why":"...","category":"ai"}]}

Items:
${list}`;
}

type ParsedPick = { id: number; headline: string; why: string; category: string };

const VALID_CATEGORIES = new Set(["world", "ai", "tech", "business"]);

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
        typeof o.why === "string" &&
        typeof o.category === "string"
      );
    })
    .map((p): Bullet | null => {
      const item = items[p.id];
      if (!item) return null;
      const category = VALID_CATEGORIES.has(p.category)
        ? (p.category as Bullet["category"])
        : sourceToCategory(item.source);
      return {
        headline: p.headline,
        why: p.why,
        source: item.source,
        link: item.link,
        image: item.image,
        originalTitle: item.title,
        category,
      };
    })
    .filter((b): b is Bullet => b !== null)
    .slice(0, 20);
}

function sourceToCategory(source: string): Bullet["category"] {
  if (source === "BBC World" || source === "Al Jazeera") return "world";
  if (source === "Anthropic" || source === "TechCrunch AI" || source === "The Verge AI") return "ai";
  if (source === "Guardian Business") return "business";
  return "tech";
}

function fallbackBullets(items: FeedItem[]): Bullet[] {
  return items.slice(0, 20).map((it) => ({
    headline: it.title,
    why: it.snippet.slice(0, 140),
    source: it.source,
    link: it.link,
    image: it.image,
    originalTitle: it.title,
    category: sourceToCategory(it.source),
  }));
}
