import Parser from "rss-parser";

type CustomItem = {
  "media:content"?: { $?: { url?: string; medium?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
};

const parser: Parser<unknown, CustomItem> = new Parser({
  timeout: 10_000,
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
    ],
  },
});

export type FeedItem = {
  source: string;
  title: string;
  link: string;
  snippet: string;
  pubDate?: string;
  image?: string;
};

export async function fetchFeed(source: string, url: string): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).slice(0, 8).map((it) => ({
      source,
      title: (it.title ?? "").trim(),
      link: it.link ?? "",
      snippet: ((it.contentSnippet ?? it.content ?? "") as string).trim().slice(0, 400),
      pubDate: it.isoDate ?? it.pubDate,
      image: extractImage(it as unknown as Record<string, unknown> & CustomItem),
    }));
  } catch {
    return [];
  }
}

export async function fetchManyFeeds(
  feeds: { source: string; url: string }[],
): Promise<FeedItem[]> {
  const results = await Promise.all(feeds.map((f) => fetchFeed(f.source, f.url)));
  return results.flat();
}

function extractImage(item: Record<string, unknown> & CustomItem): string | undefined {
  // 1. media:content
  const mc = item["media:content"];
  if (mc?.$?.url) return upgradeImageUrl(mc.$.url);

  // 2. media:thumbnail
  const mt = item["media:thumbnail"];
  if (mt?.$?.url) return upgradeImageUrl(mt.$.url);

  // 3. enclosure (RSS standard)
  const enc = item.enclosure as { url?: string; type?: string } | undefined;
  if (enc?.url && (!enc.type || enc.type.startsWith("image/"))) return upgradeImageUrl(enc.url);

  // 4. First <img> in content/content:encoded
  const contentRaw =
    (item["content:encoded"] as string | undefined) ||
    (item.content as string | undefined) ||
    "";
  const match = contentRaw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return upgradeImageUrl(match[1]);

  return undefined;
}

function upgradeImageUrl(url: string): string {
  // BBC serves thumbnails at /news/{w}/ and /ace/standard/{w}/ — upgrade to 1536px
  return url
    .replace(/ichef\.bbci\.co\.uk\/news\/\d+\//, "ichef.bbci.co.uk/news/1536/")
    .replace(/ichef\.bbci\.co\.uk\/ace\/standard\/\d+\//, "ichef.bbci.co.uk/ace/standard/1536/");
}
