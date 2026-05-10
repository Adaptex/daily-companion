// Sports news pull. Primary + fallback per sport. Tags each item with its sport.

import { fetchFeed, type FeedItem } from "@/lib/feeds";

export type Sport = "cricket" | "f1" | "football" | "general";

export type SportFeedItem = FeedItem & { sport: Sport };

type SportFeed = {
  source: string;
  url: string;
  sport: Sport;
};

// Primary + fallback per sport. We try primary first; if 0 items, hit fallback.
const FEEDS: { primary: SportFeed; fallback: SportFeed }[] = [
  {
    primary: { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", sport: "general" },
    fallback: { source: "Guardian Sport", url: "https://www.theguardian.com/sport/rss", sport: "general" },
  },
  {
    primary: { source: "ESPNCricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", sport: "cricket" },
    fallback: { source: "BBC Cricket", url: "https://feeds.bbci.co.uk/sport/cricket/rss.xml", sport: "cricket" },
  },
  {
    primary: { source: "Autosport", url: "https://www.autosport.com/rss/f1/news/", sport: "f1" },
    fallback: { source: "BBC F1", url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml", sport: "f1" },
  },
  {
    primary: { source: "BBC Football", url: "https://feeds.bbci.co.uk/sport/football/rss.xml", sport: "football" },
    fallback: { source: "Guardian Football", url: "https://www.theguardian.com/football/rss", sport: "football" },
  },
];

export async function fetchSportsNews(): Promise<SportFeedItem[]> {
  const buckets = await Promise.all(
    FEEDS.map(async ({ primary, fallback }) => {
      const first = await fetchFeed(primary.source, primary.url);
      if (first.length > 0) return first.map((it) => ({ ...it, sport: primary.sport }));
      const second = await fetchFeed(fallback.source, fallback.url);
      return second.map((it) => ({ ...it, sport: fallback.sport }));
    }),
  );
  return buckets.flat();
}
