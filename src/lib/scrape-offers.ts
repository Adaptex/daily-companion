import { createHash } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import { BANKS, type BankConfig } from "@/config/banks";
import { generate } from "./llm";

export type ScrapedOffer = {
  bank: string;
  merchant: string;
  category: string;
  discount: string;
  conditions?: string;
  card_type?: string;
  valid_days?: string[];
  valid_from?: string;
  valid_until?: string;
  url: string;
};

type ScrapeResult =
  | { bank: string; ok: true; count: number }
  | { bank: string; ok: false; error: string };

const BANK_TIMEOUT_MS = 90_000;
const FETCH_TIMEOUT_MS = 20_000;
const JINA_TIMEOUT_MS = 45_000;
const PROMPT_TEXT_LIMIT = 4_000;
const SCRAPE_CONCURRENCY = 2;

export async function scrapeAllBanks(): Promise<ScrapeResult[]> {
  const enabled = BANKS.filter((b) => b.enabled);
  const results: ScrapeResult[] = new Array(enabled.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < enabled.length) {
      const current = nextIndex++;
      results[current] = await scrapeBankWithDeadline(enabled[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(SCRAPE_CONCURRENCY, enabled.length) }, () => worker()),
  );
  return results;
}

function scrapeBankWithDeadline(bank: BankConfig): Promise<ScrapeResult> {
  const deadline = new Promise<ScrapeResult>((resolve) =>
    setTimeout(
      () => resolve({ bank: bank.name, ok: false, error: "Timed out after 90s" }),
      BANK_TIMEOUT_MS,
    ),
  );
  return Promise.race([scrapeBank(bank), deadline]);
}

function race<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|nav|footer|header|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(?:p|div|li|tr|h[1-6]|section|article|table|thead|tbody|tfoot|ul|ol|dl|dd|dt|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanSeylanCardText(value: string): string {
  const cleaned = value.replace(/^.*?">/, "").trim();
  return cleaned || value.trim();
}

function prepareExtractionText(text: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  const selected: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    if (!isOfferSignalLine(lines[i])) continue;
    if (isClearlyExpiredLine(lines[i], currentYear, currentMonth)) continue;

    for (let offset = -1; offset <= 2; offset++) {
      const candidate = lines[i + offset];
      if (!candidate) continue;
      if (isNoiseLine(candidate)) continue;
      if (isClearlyExpiredLine(candidate, currentYear, currentMonth)) continue;

      const key = candidate.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(candidate);
    }
  }

  const compact = selected.length > 0 ? selected.join("\n") : lines.slice(0, 200).join("\n");
  return compact.slice(0, PROMPT_TEXT_LIMIT);
}

function isOfferSignalLine(line: string): boolean {
  return /(%|\b0%|\bcashback\b|\bdiscount\b|\bsavings?\b|\brebate\b|\binstal(?:l|ment)\b|\bvalid\b|\buntil\b|\btill\b|\bweekend\b|\bmon(?:day)?\b|\btue(?:sday)?\b|\bwed(?:nesday)?\b|\bthu(?:rsday)?\b|\bfri(?:day)?\b|\bsat(?:urday)?\b|\bsun(?:day)?\b|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b)/i.test(line);
}

function isNoiseLine(line: string): boolean {
  if (/^(home|about us|about|contact us|contact|menu|search|login|log in|download|footer|copyright|privacy|terms|cookie|accept all|reject all|manage preferences|loading block|image|english|sinhala|tamil|a a a)$/i.test(line)) {
    return true;
  }

  if (/(card-offers|promotions|category=|offer-details)/i.test(line) && !/[%]|cashback|discount|savings?|rebate|instal|valid|until|till|weekend|\d{4}/i.test(line)) {
    return true;
  }

  return false;
}

function extractHnbOffers(text: string, bank: BankConfig, sourceUrl: string = bank.url): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    const titleLine = lines[i];
    const dateLine = lines[i + 1];

    if (!/^#{2,}\s*/.test(titleLine) || /valid\s+until/i.test(titleLine)) continue;

    const titleMatch = titleLine.match(/^#{2,}\s*(.*?)\s*#{0,}\s*$/i);
    const hasDateInfo = /Valid\s+(On|Until)/i.test(dateLine) || /\b20\d{2}-\d{2}-\d{2}\b/.test(dateLine);
    if (!titleMatch || !hasDateInfo) continue;

    const title = titleMatch[1].replace(/\s*View More.*$/i, "").trim();
    const validity = extractHnbValidity(title, dateLine);
    if (!title || (!validity.valid_from && !validity.valid_until)) continue;

    const { discount, merchant } = splitHnbTitle(title);
    offers.push({
      bank: bank.name,
      merchant,
      category: inferHnbCategory(title, sourceUrl),
      discount,
      conditions: dateLine.replace(/^#{2,}\s*/, "").trim(),
      card_type: "Credit",
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url: sourceUrl,
    });
    i += 1;
  }

  const seen = new Set<string>();
  return offers.filter((offer) => {
    const key = `${offer.merchant.toLowerCase()}|${offer.discount.toLowerCase()}|${offer.valid_from ?? ""}|${offer.valid_until ?? ""}|${offer.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractHnbValidity(title: string, dateLine: string): CommercialValidity {
  const combined = `${title} ${dateLine}`.replace(/\s+/g, " ").trim();
  const validity: CommercialValidity = {};
  const explicitWeekdays = extractExplicitWeekdayHints(combined);
  const isoDates = [...dateLine.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)]
    .map((match) => isoDateFromParts(Number(match[1]), Number(match[2]), Number(match[3])))
    .filter(Boolean);

  const isValidOn = /Valid\s+On/i.test(dateLine);
  const isValidUntil = /Valid\s+Until/i.test(dateLine);

  if (isoDates.length > 0) {
    validity.valid_from = isoDates[0];
    validity.valid_until = isoDates[isoDates.length - 1];
  }

  if (isValidOn) {
    if (explicitWeekdays.length > 0) {
      validity.valid_days = explicitWeekdays;
    } else if (isoDates.length > 0) {
      const weekdays = [...new Set(isoDates.map((date) => {
        const parsed = new Date(`${date}T00:00:00Z`);
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parsed.getUTCDay()];
      }))];
      validity.valid_days = weekdays;
    }
  } else if (isValidUntil) {
    if (explicitWeekdays.length > 0) {
      validity.valid_days = explicitWeekdays;
    }
  } else if (explicitWeekdays.length > 0) {
    validity.valid_days = explicitWeekdays;
  }

  return validity;
}

function splitHnbTitle(title: string): { discount: string; merchant: string } {
  const cleaned = title.replace(/\s+/g, " ").trim();
  const qualifyingSplit = cleaned.match(
    /^(.*?\b(?:off|savings?|discount|cashback|free|rebate|instal(?:l)?(?:ment)?s?|plan)\b.*?)(?:\s+(?:at|on|for)\s+)(.+)$/i,
  );
  if (qualifyingSplit) {
    return {
      discount: qualifyingSplit[1].trim(),
      merchant: qualifyingSplit[2].trim(),
    };
  }

  const dashIndex = cleaned.indexOf(" - ");
  if (dashIndex > 0) {
    return {
      discount: cleaned.slice(0, dashIndex).trim(),
      merchant: cleaned.slice(dashIndex + 3).trim(),
    };
  }

  return { discount: cleaned, merchant: cleaned };
}

function inferHnbCategory(title: string, sourceUrl: string = ""): string {
  const value = title.toLowerCase();
  let pageCategory = "";
  try {
    pageCategory = normalizeForComparison(new URL(sourceUrl).searchParams.get("category") ?? "");
  } catch {
    pageCategory = "";
  }

  if (pageCategory) {
    if (/(hotel|travel)/i.test(pageCategory)) return "Travel";
    if (/(dining|food|restaurant|cafe)/i.test(pageCategory)) return "Dining";
    if (/(online|web|app|ecommerce|e commerce)/i.test(pageCategory)) return "Online";
    if (/(autocare|fuel)/i.test(pageCategory)) return "Fuel";
    if (/(hospitals?|health|medical|wellness)/i.test(pageCategory)) return "Health";
    if (/(education|school|college|campus|university|academy|institute|tuition|training)/i.test(pageCategory)) return "Education";
    if (/(shopping|lifestyle|fashion|jewellery|jewelry|solar solutions)/i.test(pageCategory)) return "Shopping";
  }

  if (/(dine|restaurant|buffet|food|cafe|lunch|dinner|brunch)/i.test(value)) return "Dining";
  if (/(hotel|resort|villa|beach|stay|travel|booking|tour|trip)/i.test(value)) return "Travel";
  if (/(health|hospital|clinic|pharmacy|medical|wellness)/i.test(value)) return "Health";
  if (/(supermarket|grocery|grocer|food city|keells|glomark|cargills)/i.test(value)) return "Groceries";
  if (/(education|school|college|campus|university|academy|institute|tuition|training)/i.test(value)) return "Education";
  if (/(insurance|assurance|takaful|policy|premium)/i.test(value)) return "Insurance";
  if (/(online|web|e-?commerce|app)/i.test(value)) return "Online";
  if (/(fuel|auto|car|motor|tyre|garage|service|sri lankan airlines|airlines|air)/i.test(value)) return "Travel";
  if (/(jewel|gold|diamond|fashion|shopping|retail|merchant|store|stationery|bookshop|book shop|book centre|book center|atlas|axillia|sarasavi|singer|damro|abans|softlogic|appliance|electronics|furniture)/i.test(value)) return "Shopping";
  return "Other";
}

function extractSampathOffers(text: string, bank: BankConfig): ScrapedOffer[] {
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const offers: ScrapedOffer[] = [];
  let inLatestOffers = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^#\s*Latest Offers$/i.test(line)) {
      inLatestOffers = true;
      continue;
    }

    if (!inLatestOffers) continue;
    if (/^#\s/.test(line) && !/^#\s*Latest Offers$/i.test(line)) break;

    const title = line
      .replace(/^\*\s*\[/, "")
      .split("![Image")[0]
      .trim();
    if (!title) continue;

    if (isSampathPlaceholderTitle(title)) continue;

    const offerUrl = extractSampathOfferUrl(line) ?? bank.url;

    const contextLines = [title];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const next = lines[cursor];
      if (/^#\s/.test(next) && !/^#\s*Latest Offers$/i.test(next)) break;
      if (/\(https:\/\/www\.sampath\.lk\/sampath-cards\/credit-card-offer\/\d+\)$/i.test(next)) break;
      contextLines.push(next);
    }
    const context = contextLines.join(" ");
    const validity = extractCommercialValidity(context);
    const { discount, merchant } = splitSampathTitle(title);
    offers.push({
      bank: bank.name,
      merchant,
      category: inferSampathCategory(context || title),
      discount,
      card_type: inferCardType(context || title),
      conditions: context || title,
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url: offerUrl,
    });
  }

  return dedupeOffers(offers).slice(0, 40);
}

function isSampathPlaceholderTitle(title: string): boolean {
  const normalized = normalizeForComparison(title);
  return normalized === "visa offers" || normalized === "mastercard offers" || normalized === "other" || normalized === "await for exciting offers";
}

const SOCIAL_URL_PATTERN = /\b(facebook\.com|instagram\.com|twitter\.com|x\.com|t\.me|youtube\.com)\b/i;

/**
 * Common post-extraction stage: for any offer that has a per-offer detail URL
 * but no date fields populated, fetch that page and extract precise dates.
 * Runs in parallel with bounded concurrency. Skips social/external URLs.
 */
async function enrichOffersWithDetailPages(
  offers: ScrapedOffer[],
  bankUrl: string,
): Promise<ScrapedOffer[]> {
  const enrichable = offers.filter(
    (offer) =>
      Boolean(offer.url) &&
      offer.url !== bankUrl &&
      !SOCIAL_URL_PATTERN.test(offer.url) &&
      !offer.valid_from &&
      !offer.valid_until &&
      (!offer.valid_days || offer.valid_days.length === 0),
  );
  if (enrichable.length === 0) return offers;

  const enriched = new Map<string, Partial<ScrapedOffer>>();
  const concurrency = Math.min(4, enrichable.length);
  const queue = enrichable.slice();

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const offer = queue.shift();
        if (!offer) continue;
        const text = (await tryDirectFetch(offer.url)) ?? (await tryJinaFetch(offer.url));
        if (!text) continue;
        const validity = extractCommercialValidity(text);
        const hasNewDates =
          validity.valid_from ||
          validity.valid_until ||
          (validity.valid_days && validity.valid_days.length > 0);
        if (!hasNewDates) continue;
        enriched.set(stableOfferFingerprint(offer), {
          valid_days: validity.valid_days?.length ? validity.valid_days : offer.valid_days,
          valid_from: validity.valid_from ?? offer.valid_from,
          valid_until: validity.valid_until ?? offer.valid_until,
          conditions: validity.label ?? offer.conditions,
        });
      }
    }),
  );

  return offers.map((offer) => {
    const patch = enriched.get(stableOfferFingerprint(offer));
    return patch ? { ...offer, ...patch } : offer;
  });
}

// ---------------------------------------------------------------------------
// Common post-extraction pipeline
// ---------------------------------------------------------------------------

/**
 * Generic category-level placeholder names that appear in bank listing pages
 * but represent installment program buckets, not real merchant offers.
 */
const GENERIC_MERCHANT_BLOCKLIST = new Set([
  "restaurant", "restaurants", "supermarkets", "others", "travel", "car care",
  "jewellery", "opticians", "healthcare", "shoes & leather",
  "home care & electronics", "online stores", "leisure", "instalment plans",
  "visa offers", "mastercard offers", "buy anything anywhere",
  "fuel", "education", "insurance payments", "foreign currency transactions",
  "supermarket - fuel", "instalment plan facility",
]);

/**
 * Drops offers that are clearly not real merchant deals:
 * - merchant name is a known generic category label
 * - merchant is empty / too short
 * - no discount text at all
 */
function applyQualityFilter(offers: ScrapedOffer[]): ScrapedOffer[] {
  return offers.filter((o) => {
    const m = normalizeForComparison(o.merchant ?? "");
    if (!m || m.length < 3) return false;
    if (GENERIC_MERCHANT_BLOCKLIST.has(m)) return false;
    if (!o.discount || normalizeForComparison(o.discount).length < 2) return false;

    // Reject category navigation labels where the "discount" is just the
    // merchant name repeated (e.g. Sampath nav: merchant="Premium Offers",
    // discount="Premium Offers").
    if (m === normalizeForComparison(o.discount)) return false;

    // Reject offers where the discount text is identical to the conditions
    // text — these are descriptive banners masquerading as offers
    // (e.g. NDB "Unlock Premium Global Experiences with Visa").
    if (o.discount && o.conditions &&
        normalizeForComparison(o.discount) === normalizeForComparison(o.conditions)) return false;

    // Reject scraping artifacts: placeholder text and cookie consent banners.
    const cond = o.conditions ?? "";
    if (/await\s+for\s+exciting\s+offers/i.test(cond)) return false;
    if (/\b(we use cookies|cookie preferences|essential cookies|privacy control)\b/i.test(cond)) return false;

    return true;
  });
}

/**
 * For banks that have per-offer detail page URLs embedded in their listing HTML
 * (configured via bank.offerDetailUrlPattern), scan the HTML, fetch each detail
 * page, and match the result back to a raw offer by merchant name similarity.
 * Updates the matched offer's URL so that enrichOffersWithDetailPages can then
 * fetch the correct page for date extraction.
 */
async function discoverAndAssignDetailUrls(
  offers: ScrapedOffer[],
  listingHtml: string,
  bank: BankConfig,
): Promise<ScrapedOffer[]> {
  if (!bank.offerDetailUrlPattern) return offers;

  const base = bank.offerDetailUrlBase ?? "";
  const pattern = new RegExp(bank.offerDetailUrlPattern, "g");

  // All unique per-offer URLs found in the listing page HTML
  const detailPaths = [...new Set([...listingHtml.matchAll(pattern)].map((m) => m[0]))];
  if (detailPaths.length === 0) return offers;

  const detailUrls = detailPaths.map((p) => (p.startsWith("http") ? p : base + p));

  // Offers that still point to the listing page (no individual URL yet)
  const needsUrl = offers.filter(
    (o) => !o.url || o.url === bank.url || o.url === base,
  );
  if (needsUrl.length === 0) return offers;

  // Fetch each detail page — bounded concurrency
  const detailTexts = new Map<string, string>(); // url → page text
  const concurrency = Math.min(4, detailUrls.length);
  const queue = detailUrls.slice();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) continue;
        const text = (await tryDirectFetch(url)) ?? (await tryJinaFetch(url));
        if (text) detailTexts.set(url, text);
      }
    }),
  );

  // Match each offer to its best detail page by merchant name word overlap
  const usedUrls = new Set<string>();
  const urlPatches = new Map<string, string>(); // fingerprint → detail url

  // Sort by merchant name length descending so more-specific names are matched first
  const sorted = [...needsUrl].sort((a, b) => b.merchant.length - a.merchant.length);

  for (const offer of sorted) {
    const merchantWords = normalizeForComparison(offer.merchant)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    if (merchantWords.length === 0) continue;

    let bestUrl: string | undefined;
    let bestScore = 0;

    for (const [url, text] of detailTexts) {
      if (usedUrls.has(url)) continue;
      const head = normalizeForComparison(text.slice(0, 400));
      const score = merchantWords.filter((w) => head.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestUrl = url;
      }
    }

    if (bestUrl && bestScore > 0) {
      urlPatches.set(stableOfferFingerprint(offer), bestUrl);
      usedUrls.add(bestUrl);
    }
  }

  if (urlPatches.size === 0) return offers;
  return offers.map((offer) => {
    const url = urlPatches.get(stableOfferFingerprint(offer));
    return url ? { ...offer, url } : offer;
  });
}

/**
 * Decode numeric and named HTML entities in offer string fields.
 * Jina AI and direct-fetched bank pages sometimes return entities
 * (e.g. &#039; for apostrophe) that survive into stored data.
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function decodeEntityFields(offers: ScrapedOffer[]): ScrapedOffer[] {
  return offers.map((o) => ({
    ...o,
    merchant: decodeHtmlEntities(o.merchant),
    discount: decodeHtmlEntities(o.discount),
    conditions: o.conditions ? decodeHtmlEntities(o.conditions) : o.conditions,
  }));
}

/**
 * Common post-extraction pipeline applied to every bank's raw offers:
 *   1. discoverAndAssignDetailUrls — find + assign per-offer page URLs from listing HTML
 *   2. enrichOffersWithDetailPages — fetch those URLs to fill in missing date fields
 *   3. decodeEntityFields          — decode HTML entities (&#039; etc.) in text fields
 *   4. applyQualityFilter         — drop generic category placeholder rows
 */
async function normalizeOfferPipeline(
  offers: ScrapedOffer[],
  listingHtml: string | null,
  bank: BankConfig,
): Promise<ScrapedOffer[]> {
  let result = offers;

  if (listingHtml && bank.offerDetailUrlPattern) {
    result = await discoverAndAssignDetailUrls(result, listingHtml, bank);
  }

  result = await enrichOffersWithDetailPages(result, bank.url);
  result = decodeEntityFields(result);
  result = applyQualityFilter(result);

  return result;
}

async function enrichSampathOffersWithDetails(offers: ScrapedOffer[], bank: BankConfig): Promise<ScrapedOffer[]> {
  const enrichable = offers.filter((offer) => offer.category === "Other" && Boolean(offer.url) && offer.url !== bank.url);
  if (enrichable.length === 0) return offers;

  const enriched = new Map<string, ScrapedOffer>();
  await Promise.all(
    enrichable.map(async (offer) => {
      const detailText = (await tryJinaFetch(offer.url)) ?? (await tryDirectFetch(offer.url));
      if (!detailText) return;

      const detailLines = detailText
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trim().replace(/\s{2,}/g, " "))
        .filter(Boolean);

      const detailOffer = extractSampathDetailOffer(detailLines, { ...bank, url: offer.url }, offer.merchant);
      if (!detailOffer) return;

      const key = stableOfferFingerprint(offer);
      enriched.set(key, {
        ...offer,
        ...detailOffer,
        merchant: offer.merchant || detailOffer.merchant,
        category: detailOffer.category !== "Other" ? detailOffer.category : offer.category,
        discount: detailOffer.discount || offer.discount,
        conditions: detailOffer.conditions || offer.conditions,
        card_type: detailOffer.card_type ?? offer.card_type,
        valid_days: detailOffer.valid_days ?? offer.valid_days,
        valid_from: detailOffer.valid_from ?? offer.valid_from,
        valid_until: detailOffer.valid_until ?? offer.valid_until,
        url: offer.url || detailOffer.url,
      });
    }),
  );

  return offers.map((offer) => enriched.get(stableOfferFingerprint(offer)) ?? offer);
}

function extractSampathDetailOffer(lines: string[], bank: BankConfig, fallbackMerchant?: string): ScrapedOffer | null {
  const titleLine =
    lines.find((line) => /^#\s+.+Sampath Cards offers$/i.test(line)) ??
    lines.find((line) => /^#\s+.+$/i.test(line) && !/^#\s+Promotion Details$/i.test(line));
  const merchant = (
    titleLine
      ? titleLine
          .replace(/^#\s+/, "")
          .replace(/\s*[–-]\s*Sampath Cards offers.*$/i, "")
          .trim()
      : fallbackMerchant ?? ""
  ).trim();
  if (!merchant) return null;

  const bodyText = lines.join(" ");
  const discountLine =
    lines.find((line) => !/^#\s/.test(line) && parseDiscountLabel(line)) ??
    lines.find((line) => /\bDiscount\b|\bSavings?\b|\bCashback\b|\bInstall(?:ment)?\b/i.test(line) && !/^#\s/.test(line)) ??
    titleLine;
  const discount = parseDiscountLabel(discountLine ?? "") ?? parseDiscountLabel(bodyText);
  if (!discount) return null;

  const validity = extractCommercialValidity(bodyText);
  const conditions =
    [
      lines.find((line) => /^#{4,5}\s*Promotion Period/i.test(line)),
      lines.find((line) => /^(?:Promotion Period|Eligible Card Categories|Location|Partner)\b/i.test(line)),
      lines.find((line) => !/^#\s/.test(line) && /\bDiscount\b|\bSavings?\b|\bInstall(?:ment)?\b/i.test(line)),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || bodyText;

  return {
    bank: bank.name,
    merchant,
    category: inferCommercialCategory(merchant, bodyText),
    discount,
    conditions,
    card_type: inferCardType(bodyText),
    valid_days: validity.valid_days,
    valid_from: validity.valid_from,
    valid_until: validity.valid_until,
    url: bank.url,
  };
}

function splitSampathTitle(title: string): { discount: string; merchant: string } {
  const cleaned = title.replace(/\s+/g, " ").trim();
  const parsedDiscount = parseDiscountLabel(cleaned);
  if (parsedDiscount) {
    const merchant = stripSampathDiscountPrefix(cleaned);
    if (merchant && merchant !== cleaned) {
      return {
        discount: parsedDiscount,
        merchant,
      };
    }
  }

  const onMatch = cleaned.match(
    /^(.*?\b(?:discount|offer|offers|interest|rates?|plan|plans|exclusive offers|special rates)\b.*?)(?:\s+(?:at|on|for)\s+)(.+)$/i,
  );
  if (onMatch) {
    return {
      discount: onMatch[1].trim(),
      merchant: onMatch[2].trim(),
    };
  }

  const dashIndex = cleaned.indexOf(" - ");
  if (dashIndex > 0) {
    return {
      discount: cleaned.slice(0, dashIndex).trim(),
      merchant: cleaned.slice(dashIndex + 3).trim(),
    };
  }

  return { discount: cleaned, merchant: cleaned };
}

function stripSampathDiscountPrefix(value: string): string {
  return value
    .replace(/^(?:up to|upto)?\s*\d{1,2}(?:\.\d+)?\s*%\s*(?:discount|off|savings?|cashback|rebate)?\s*/i, "")
    .replace(/^(?:special rates?|special discount|exclusive offers?|discounts?|savings?|offers?)\s*/i, "")
    .replace(/\s+(?:for|at|on)\s+.+$/i, "")
    .trim();
}

function extractSampathOfferUrl(text: string): string | null {
  const matches = [...text.matchAll(/\((https?:\/\/www\.sampath\.lk\/sampath-cards\/credit-card-offer\/\d+)\)/gi)];
  return matches.at(-1)?.[1] ?? null;
}

function inferSampathCategory(title: string): string {
  const value = title.toLowerCase();
  if (/(restaurant|hotel|cafe|dine|buffet|food|bar|lounge)/i.test(value)) return "Dining";
  if (/(supermarket|grocery|food city|glomark|cargills|market|mall)/i.test(value)) return "Groceries";
  if (/(resort|beach|travel|destination|tour|booking|visa destination)/i.test(value)) return "Travel";
  if (/(education|school|college|campus|university|academy|institute|tuition|training)/i.test(value)) return "Education";
  if (/(insurance|assurance|takaful|policy|premium)/i.test(value)) return "Insurance";
  if (/(interest|install|installment|settlement|plan|plans)/i.test(value)) return "Other";
  if (/(health|hospital|clinic|pharmacy|medical|wellness)/i.test(value)) return "Health";
  if (/(shopping|retail|store|stationery|bookshop|book shop|book centre|book center|atlas|axillia|sarasavi|singer|damro|abans|softlogic|appliance|electronics|furniture)/i.test(value)) return "Shopping";
  return "Other";
}

function inferCardType(title: string): string {
  const value = title.toLowerCase();
  const hasCredit = /\bcredit\b/i.test(value);
  const hasDebit = /\bdebit\b/i.test(value);

  if (hasCredit && hasDebit) return "Both";
  if (hasDebit) return "Debit";
  if (hasCredit) return "Credit";
  return "Credit";
}

function extractPeoplesOffers(text: string, bank: BankConfig): ScrapedOffer[] {
  const cleaned = text.replace(/\r/g, "\n");
  const details: string[] = [];
  if (/electric\s*&\s*household items/i.test(cleaned)) details.push("Electric & Household Items");
  if (/excluding grocery items/i.test(cleaned)) details.push("Excluding Grocery Items");
  if (/furniture/i.test(cleaned)) details.push("Furniture");
  if (/home appliances/i.test(cleaned)) details.push("Home Appliances");
  if (/computer|camera|mobile|television|tv/i.test(cleaned)) details.push("Electronics");

  if (details.length === 0) details.push("Credit Card Instalment Plan Facility");

  return dedupeOffers(
    details.map((detail) => ({
      bank: bank.name,
      merchant: "People's Bank",
      category: inferPeoplesCategory(detail),
      discount: "Credit card instalment plan facility",
      conditions: detail,
      card_type: "Credit",
      url: bank.url,
    })),
  );
}

function inferPeoplesCategory(detail: string): string {
  const value = detail.toLowerCase();
  if (/(electric|household|home appliances|furniture|electronics|computer|camera|television|tv)/i.test(value)) return "Shopping";
  if (/(grocery|market|food)/i.test(value)) return "Groceries";
  if (/(education|school|college|campus|university|academy|institute|tuition|training)/i.test(value)) return "Education";
  if (/(insurance|assurance|takaful|policy|premium)/i.test(value)) return "Insurance";
  return "Other";
}

function extractSeylanOffers(text: string, bank: BankConfig): ScrapedOffer[] {
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  const plainPrimaryOffer = extractSeylanPrimaryOffer(lines, bank);
  if (plainPrimaryOffer) {
    offers.push(plainPrimaryOffer);
  }

  for (let index = 0; index < lines.length; index++) {
    const headingMatch = lines[index].match(/^#{2,5}\s*(.+)$/);
    if (!headingMatch) continue;

    const merchant = headingMatch[1].trim();
    if (!merchant) continue;

    const block: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const next = lines[cursor];
      if (/^#{5}\s+/.test(next)) break;
      if (/^#\s*Related Promotions\b/i.test(next)) break;
      block.push(next);
      if (/^\[READ MORE\]/i.test(next)) break;
    }

    const blockText = block.join(" ").trim();
    const discountLine = block.find((line) => parseDiscountLabel(line)) ?? block[0] ?? merchant;
    const discount = parseDiscountLabel(discountLine) ?? discountLine.replace(/\s+/g, " ").trim();
    const conditions = block
      .filter(
        (line) =>
          !/^\[READ MORE\]/i.test(line) &&
          !/^-\s*\[x\]/i.test(line) &&
          !/calendar\.google\.com/i.test(line) &&
          !/^!?\[Image/i.test(line),
      )
      .join(" ")
      .trim() || merchant;

    const calendarContext = lines.slice(Math.max(0, index - 5), Math.min(lines.length, index + 2)).join(" ");
    const calendarValidity = parseCalendarLinkDates(calendarContext);
    const textValidity = extractCommercialValidity([merchant, blockText].join(" "));
    const validity = mergeCommercialValidity(calendarValidity, textValidity);
    const url = extractMarkdownLinkUrl(block.join(" ")) ?? extractMarkdownLinkUrl(lines.slice(index, Math.min(lines.length, index + 6)).join(" ")) ?? bank.url;
    const cardType = inferCardType([merchant, blockText].join(" "));
    const pageCategory = extractSeylanPageCategory(lines, index);
    const category = inferCommercialCategory(merchant, [pageCategory, blockText, conditions].filter(Boolean).join(" "));

    const key = [
      normalizeForComparison(merchant),
      normalizeForComparison(discount),
      normalizeForComparison(conditions),
      validity.valid_until ?? "",
      (cardType ?? "").toLowerCase(),
      url,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      bank: bank.name,
      merchant,
      category,
      discount,
      conditions,
      card_type: cardType,
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url,
    });
  }

  return dedupeOffers(offers).slice(0, 200);
}

async function enrichSeylanOffersWithDetails(offers: ScrapedOffer[], bank: BankConfig): Promise<ScrapedOffer[]> {
  const enrichable = offers.filter(
    (offer) =>
      offer.category === "Other" &&
      Boolean(offer.url) &&
      offer.url !== bank.url &&
      !offer.url.startsWith("https://www.seylan.lk/promotions"),
  );

  if (enrichable.length === 0) return offers;

  const enrichedByKey = new Map<string, ScrapedOffer>();
  const pool = Math.max(1, Math.min(6, enrichable.length));
  const queue = enrichable.slice();

  await Promise.all(
    Array.from({ length: pool }, async () => {
      while (queue.length > 0) {
        const offer = queue.shift();
        if (!offer) continue;

        const detailText = (await tryDirectFetch(offer.url)) ?? (await tryJinaFetch(offer.url));
        if (!detailText) continue;

        const detailLines = detailText
          .replace(/\r/g, "\n")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const detailOffer = extractSeylanPrimaryOffer(detailLines, { ...bank, url: offer.url });
        if (!detailOffer || detailOffer.category === "Other") continue;

        const key = [
          normalizeForComparison(offer.merchant),
          normalizeForComparison(offer.discount),
          normalizeForComparison(offer.conditions ?? ""),
          offer.card_type ?? "",
          offer.valid_days?.join(",") ?? "",
          offer.valid_from ?? "",
          offer.valid_until ?? "",
          offer.url,
        ].join("|");

        enrichedByKey.set(key, {
          ...offer,
          ...detailOffer,
          category: detailOffer.category,
        });
      }
    }),
  );

  return offers.map((offer) => {
    const key = [
      normalizeForComparison(offer.merchant),
      normalizeForComparison(offer.discount),
      normalizeForComparison(offer.conditions ?? ""),
      offer.card_type ?? "",
      offer.valid_days?.join(",") ?? "",
      offer.valid_from ?? "",
      offer.valid_until ?? "",
      offer.url,
    ].join("|");
    return enrichedByKey.get(key) ?? offer;
  });
}

async function extractSeylanOffersFromHtml(html: string, bank: BankConfig): Promise<ScrapedOffer[]> {
  const titleMatches = [...html.matchAll(/<h5[^>]*class="[^"]*new-promotion-title[^"]*"[^>]*>([\s\S]*?)<\/h5>/gi)];
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < titleMatches.length; index++) {
    const match = titleMatches[index];
    const nextIndex = titleMatches[index + 1]?.index ?? html.length;
    const windowStart = Math.max(0, (match.index ?? 0) - 2400);
    const window = html.slice(windowStart, nextIndex);

    const title = cleanSeylanCardText(htmlToText(match[1]).replace(/^#{1,6}\s*/, ""));
    if (!title) continue;

    const discountHtml = extractHtmlFragment(window, /<p[^>]*class="[^"]*new-promotion-dis[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const discountText = htmlToText(discountHtml).trim();
    const discount = parseDiscountLabel(discountText) ?? discountText;
    if (!discount) continue;

    const readMoreUrl =
      window.match(/<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*\bnew-promotion-btn\b[^"]*"[^>]*>[\s\S]*?READ MORE[\s\S]*?<\/a>/i)?.[1] ??
      window.match(/<a\b[^>]*class="[^"]*\bnew-promotion-btn\b[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?READ MORE[\s\S]*?<\/a>/i)?.[1] ??
      bank.url;

    const contextText = cleanSeylanCardText(htmlToText(window));
    const category = inferCommercialCategory(title, contextText);

    const validity: CommercialValidity =
      parseCalendarLinkDates(window) ?? extractCommercialValidity(contextText);

    const candidate: ScrapedOffer = {
      bank: bank.name,
      merchant: title,
      category,
      discount,
      conditions: contextText,
      card_type: inferCardType(contextText),
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url: readMoreUrl,
    };

    const key = [
      normalizeForComparison(candidate.bank),
      normalizeForComparison(candidate.merchant),
      normalizeForComparison(candidate.discount),
      normalizeForComparison(candidate.conditions ?? ""),
      candidate.card_type ?? "",
      candidate.valid_days?.join(",") ?? "",
      candidate.valid_from ?? "",
      candidate.valid_until ?? "",
      candidate.url,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    offers.push(candidate);
  }

  return offers;
}

function extractSeylanPrimaryOffer(lines: string[], bank: BankConfig): ScrapedOffer | null {
  const cardIndex = lines.findLastIndex((line) => /^Card Promotions\b/i.test(line));
  if (cardIndex < 0) return null;

  const cardLine = lines[cardIndex];
  const inlineCategoryMatch = cardLine.match(/\bCard Promotions\s*:\s*([A-Za-z][A-Za-z &/-]*)/i);
  const pageCategory = inlineCategoryMatch?.[1]?.trim() ?? extractSeylanPageCategory(lines, cardIndex);
  const splitCategoryLine = lines[cardIndex + 1];
  const hasSplitCategory = Boolean(splitCategoryLine && /^:\s*/.test(splitCategoryLine));
  let titleIndex = inlineCategoryMatch ? cardIndex + 1 : hasSplitCategory ? cardIndex + 2 : cardIndex + 1;
  while (titleIndex < lines.length && isSeylanNoiseLine(lines[titleIndex])) {
    titleIndex++;
  }
  const titleRaw = lines[titleIndex];
  const titleLine = titleRaw?.replace(/^#{1,6}\s*/, "").trim();
  if (!titleLine || /^(Details\s*\/\s*Promotions|Terms and Conditions|Related Promotions)$/i.test(titleLine)) return null;

  const relatedIndex = lines.findIndex((line, index) => index > cardIndex && /^#?\s*Related Promotions$/i.test(line));
  const block = lines.slice(titleIndex + 1, relatedIndex >= 0 ? relatedIndex : lines.length);
  const discountLine = block.find((line) => parseDiscountLabel(line));
  if (!discountLine) return null;

  const discount = parseDiscountLabel(discountLine) ?? discountLine.replace(/\s+/g, " ").trim();
  const conditions = block
    .filter(
      (line) =>
        !/^\[READ MORE\]/i.test(line) &&
        !/^-\s*\[x\]/i.test(line) &&
        !/calendar\.google\.com/i.test(line) &&
        !/^!?[[]?Image/i.test(line) &&
        !/^#?\s*Related Promotions$/i.test(line) &&
        !/^Card Promotions$/i.test(line) &&
        !/^:\s*/.test(line),
    )
    .join(" ")
    .trim() || titleLine;

  const validity = extractCommercialValidity([pageCategory, titleLine, conditions].join(" "));
  const cardType = inferCardType([titleLine, conditions].join(" "));
  const category = inferCommercialCategory(titleLine, [pageCategory, titleLine, conditions].join(" "));

  return {
    bank: bank.name,
    merchant: titleLine,
    category,
    discount,
    conditions,
    card_type: cardType,
    valid_days: validity.valid_days,
    valid_from: validity.valid_from,
    valid_until: validity.valid_until,
    url: bank.url,
  };
}

function isSeylanNoiseLine(line: string): boolean {
  return (
    /^!?[[]?Image/i.test(line) ||
    /^Read More$/i.test(line) ||
    /^Read More\b/i.test(line) ||
    /^Card Promotions\b/i.test(line) ||
    /^Related Promotions$/i.test(line) ||
    /^Details\s*\/\s*Promotions$/i.test(line) ||
    /^Terms and Conditions$/i.test(line) ||
    /^\*+\s*$/.test(line) ||
    /^Accept All$/i.test(line) ||
    /^Save Preferences$/i.test(line)
  );
}

function extractSeylanPageCategory(lines: string[], index: number): string | undefined {
  for (let offset = 1; offset <= 5; offset++) {
    const line = lines[index + offset];
    const match = line?.match(/^:\s*([A-Za-z][A-Za-z &/-]*)$/i);
    if (match) return match[1].trim();
  }

  const forwardWindow = lines.slice(index, Math.min(lines.length, index + 2)).join(" ");
  const forwardMatch = forwardWindow.match(/\bCard Promotions\s*:\s*([A-Za-z][A-Za-z &/-]*)/i);
  if (forwardMatch) return forwardMatch[1].trim();

  const backwardWindow = lines.slice(0, index).join(" ");
  const backwardMatches = [...backwardWindow.matchAll(/\bCard Promotions\s*:\s*([A-Za-z][A-Za-z &/-]*)/gi)];
  return backwardMatches.at(-1)?.[1]?.trim();
}

function dedupeOffers(offers: ScrapedOffer[]): ScrapedOffer[] {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    const key = [
      offer.bank.toLowerCase(),
      offer.merchant.toLowerCase(),
      offer.discount.toLowerCase(),
      offer.valid_until ?? "",
      offer.valid_from ?? "",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeOffersByIdentity(offers: ScrapedOffer[]): ScrapedOffer[] {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    const key = [
      offer.bank.toLowerCase(),
      normalizeForComparison(offer.merchant),
      normalizeForComparison(offer.discount),
      normalizeForComparison(offer.conditions ?? ""),
      (offer.card_type ?? "").toLowerCase(),
      offer.valid_days?.join(",") ?? "",
      offer.valid_from ?? "",
      offer.valid_until ?? "",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isClearlyExpiredLine(line: string, currentYear: number, currentMonth: number): boolean {
  const years = [...line.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  if (years.length > 0 && Math.max(...years) < currentYear) {
    return true;
  }

  if (years.length > 0 && Math.min(...years) > currentYear) {
    return false;
  }

  const monthMatches = [...line.matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi)];
  if (monthMatches.length === 0) return false;

  const months = monthMatches
    .map((match) => monthNameToNumber(match[1]))
    .filter((month): month is number => Boolean(month));

  if (months.length === 0) return false;

  if (years.includes(currentYear)) {
    return months.every((month) => month < currentMonth);
  }

  return false;
}

function monthNameToNumber(month: string): number | null {
  switch (month.toLowerCase()) {
    case "jan":
    case "january":
      return 1;
    case "feb":
    case "february":
      return 2;
    case "mar":
    case "march":
      return 3;
    case "apr":
    case "april":
      return 4;
    case "may":
      return 5;
    case "jun":
    case "june":
      return 6;
    case "jul":
    case "july":
      return 7;
    case "aug":
    case "august":
      return 8;
    case "sep":
    case "september":
      return 9;
    case "oct":
    case "october":
      return 10;
    case "nov":
    case "november":
      return 11;
    case "dec":
    case "december":
      return 12;
    default:
      return null;
  }
}

async function tryDirectFetch(url: string): Promise<string | null> {
  try {
    const res = await race(
      fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      }),
      FETCH_TIMEOUT_MS,
      "direct fetch"
    );
    if (!res.ok) return null;
    return htmlToText(await race(res.text(), FETCH_TIMEOUT_MS, "direct body"));
  } catch {
    return null;
  }
}

async function tryDirectFetchHtml(url: string): Promise<string | null> {
  try {
    const res = await race(
      fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      }),
      FETCH_TIMEOUT_MS,
      "direct html fetch"
    );
    if (!res.ok) return null;
    return await race(res.text(), FETCH_TIMEOUT_MS, "direct html body");
  } catch {
    return null;
  }
}

async function tryJinaFetch(url: string): Promise<string | null> {
  try {
    const res = await race(
      fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: "text/plain", "X-Return-Format": "markdown" },
      }),
      JINA_TIMEOUT_MS,
      "jina fetch"
    );
    if (!res.ok) return null;
    return await race(res.text(), JINA_TIMEOUT_MS, "jina body");
  } catch {
    return null;
  }
}

async function scrapeBank(bank: BankConfig): Promise<ScrapeResult> {
  try {
    if (bank.name === "HNB") {
      const hnbText = await tryJinaFetch(bank.url);
      if (hnbText) {
        const categoryUrls = extractHnbCategoryUrls(hnbText, bank.url);
        const pages = new Map<string, string>();
        pages.set(bank.url, hnbText);

        const fetchedCategories = await Promise.all(
          categoryUrls
            .filter((categoryUrl) => !pages.has(categoryUrl))
            .map(async (categoryUrl) => [categoryUrl, await tryJinaFetch(categoryUrl)] as const),
        );

        for (const [categoryUrl, categoryText] of fetchedCategories) {
          if (categoryText) {
            pages.set(categoryUrl, categoryText);
          }
        }

        const rawOffers = dedupeOffersByIdentity(
          [...pages.entries()].flatMap(([sourceUrl, sourceText]) =>
            repairOffersWithSource(bank, sourceText, extractHnbOffers(sourceText, bank, sourceUrl)),
          ),
        );
        const offers = await normalizeOfferPipeline(rawOffers, null, bank);

        if (offers.length > 0) {
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "Sampath") {
      const sampathText = await tryJinaFetch(bank.url);
      if (sampathText) {
        const categoryEnriched = await enrichSampathOffersWithDetails(
          repairOffersWithSource(bank, sampathText, extractSampathOffers(sampathText, bank)),
          bank,
        );
        const offers = await normalizeOfferPipeline(categoryEnriched, null, bank);
        if (offers.length > 0) {
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "People's Bank") {
      const peoplesText = await tryJinaFetch(bank.url);
      if (peoplesText) {
        const offers = await normalizeOfferPipeline(
          repairOffersWithSource(bank, peoplesText, extractPeoplesOffers(peoplesText, bank)),
          null,
          bank,
        );
        if (offers.length > 0) {
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "Seylan") {
      const seylanText = await tryJinaFetch(bank.url) ?? await tryDirectFetch(bank.url);
      const seylanHtml = await tryDirectFetchHtml(bank.url);
      if (seylanText || seylanHtml) {
        const textOffers = seylanText
          ? await enrichSeylanOffersWithDetails(repairOffersWithSource(bank, seylanText, extractSeylanOffers(seylanText, bank)), bank)
          : [];
        const htmlOffers = seylanHtml ? await extractSeylanOffersFromHtml(seylanHtml, bank) : [];
        const offers = await normalizeOfferPipeline(
          dedupeOffersByIdentity([...textOffers, ...htmlOffers]),
          seylanHtml,
          bank,
        );
        if (offers.length > 0) {
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "Commercial Bank") {
      const commercialHtml = await tryDirectFetchHtml(bank.url);
      if (commercialHtml) {
        const rawOffers = extractCommercialBankOffersFromHtml(commercialHtml, bank);
        if (rawOffers.length > 0) {
          const offers = await normalizeOfferPipeline(rawOffers, commercialHtml, bank);
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "NDB") {
      const ndbHtml = await tryDirectFetchHtml(bank.url);
      if (ndbHtml) {
        const rawOffers = extractNdbOffersFromHtml(ndbHtml, bank);
        if (rawOffers.length > 0) {
          const offers = await normalizeOfferPipeline(rawOffers, ndbHtml, bank);
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    if (bank.name === "BOC") {
      const bocHtml = await tryDirectFetchHtml(bank.url);
      if (bocHtml) {
        const rawOffers = extractBocOffersFromHtml(bocHtml, bank);
        if (rawOffers.length > 0) {
          const offers = await normalizeOfferPipeline(rawOffers, bocHtml, bank);
          try {
            await upsertOffers(bank.name, offers, bank.url);
            return { bank: bank.name, ok: true, count: offers.length };
          } catch (err) {
            return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
          }
        }
      }
    }

    // Try direct fetch; fall back to Jina AI for JS-rendered or blocked pages.
    let text = await tryDirectFetch(bank.url);
    let usedJina = false;
    let sourceText = text;

    if (!text) {
      console.info(`[scrape] ${bank.name}: direct fetch failed, trying Jina AI`);
      text = await tryJinaFetch(bank.url);
      usedJina = true;
      sourceText = text;
    }

    if (!text) {
      return { bank: bank.name, ok: false, error: "Fetch failed via direct and Jina AI" };
    }

    const commercialSupplementalOffers =
      bank.name === "Commercial Bank" ? extractCommercialBankOffers(text, bank) : [];

    let offers: ScrapedOffer[] = [];
    let extractionError: string | null = null;
    try {
      offers = await extractOffers(bank, prepareExtractionText(text));
    } catch (err) {
      extractionError = String(err);
    }

    // If direct fetch yielded no offers, the page is likely JS-rendered — retry with Jina AI.
    if ((offers.length === 0 || extractionError) && !usedJina) {
      console.info(`[scrape] ${bank.name}: retrying with Jina AI`);
      const jinaText = await tryJinaFetch(bank.url);
      if (jinaText) {
        usedJina = true;
        sourceText = jinaText;
        offers = [];
        extractionError = null;
        try {
          offers = await extractOffers(bank, prepareExtractionText(jinaText));
        } catch (err) {
          extractionError = String(err);
        }
      }
    }

    if (extractionError && offers.length === 0) {
      return { bank: bank.name, ok: false, error: `LLM extraction failed: ${extractionError}` };
    }

    if (offers.length === 0) {
      return { bank: bank.name, ok: false, error: "No offers extracted" };
    }

    if (commercialSupplementalOffers.length > 0) {
      offers = mergeCommercialBankOffers(offers, commercialSupplementalOffers);
    }

    if (sourceText) {
      offers = repairOffersWithSource(bank, sourceText, offers);
    }

    offers = decodeEntityFields(offers);

    try {
      await upsertOffers(bank.name, offers, bank.url);
    } catch (err) {
      return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
    }

    return { bank: bank.name, ok: true, count: offers.length };
  } catch (err) {
    return { bank: bank.name, ok: false, error: `Unhandled scrape error: ${String(err)}` };
  }
}

function extractHnbCategoryUrls(text: string, baseUrl: string): string[] {
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let startIndex = -1;
  for (let index = lines.length - 1; index >= 0; index--) {
    if (/Sort by Category/i.test(lines[index])) {
      startIndex = index;
      break;
    }
  }
  if (startIndex < 0) return [];

  const labels: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    if (/^###\s+/i.test(line)) break;
    if (!line || /^All$/i.test(line)) continue;
    labels.push(line);
  }

  const uniqueLabels = [...new Set(labels)];
  return uniqueLabels.map((label) => {
    const url = new URL(baseUrl);
    url.searchParams.set("category", label);
    return url.toString();
  });
}

async function extractOffers(bank: BankConfig, markdown: string): Promise<ScrapedOffer[]> {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2026-05-11"
  const prompt = `You are extracting credit/debit card offers from a Sri Lankan bank's promotions page.
Bank: ${bank.name}${bank.note ? `\nContext: ${bank.note}` : ""}
Today's date: ${today}

From the page content below, extract every card offer you can find. For each offer return:
- merchant: the merchant or business name (string)
- category: one of [Groceries, Dining, Pharmacy, Fuel, Online, Travel, Health, Education, Insurance, Shopping, Entertainment, Other]
- discount: the discount or benefit (e.g. "10% off", "15% cashback", "0% instalment 12 months")
  Do not invent placeholder values like "0%" unless the page explicitly shows that exact value.
- conditions: key conditions in one sentence — include any specific dates verbatim (optional)
- card_type: "Credit", "Debit", or "Both" (optional, omit if unclear)
- valid_days: IMPORTANT — if the offer is valid only on specific days or dates, you MUST set this:
    • Day-of-week promotions: use abbreviations, e.g. ["Mon","Wed"]
    • Specific calendar dates (e.g. "valid 3rd, 6th, 10th, 13th May"): calculate the day-of-week for each date using today's date as reference, then list the unique day names. E.g. if those dates fall on Sundays and Wednesdays, set ["Sun","Wed"]
    • Omit only if the offer is truly valid every day with no day restriction
- valid_from: ISO date "YYYY-MM-DD" — set if the offer starts on a future date OR if the earliest specific date listed is in the future. Omit if offer is already active.
- valid_until: ISO date "YYYY-MM-DD" — set to the expiry date, or to the last specific date if a date list is given. Omit if ongoing with no end date.

Focus on actual offer entries. Ignore navigation, headers, footers, cookie banners, and repeated category labels unless they are part of a real offer.
Only include offers that are active today or start in the future. Ignore archived or expired offers whose end date is before today's date.

Return ONLY valid JSON, no markdown:
{"offers":[{"merchant":"...","category":"...","discount":"...","conditions":"...","card_type":"...","valid_days":["Mon"],"valid_from":"2026-06-01","valid_until":"2026-07-31"}]}

If no clear card offers are found, return {"offers":[]}.

Page content:
${markdown}`;

  const raw = await generate(prompt);
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
  }

  const list = (parsed as { offers?: unknown })?.offers;
  if (!Array.isArray(list)) throw new Error("Response missing offers array");

  return list
    .filter((o): o is Record<string, unknown> => typeof o === "object" && o !== null)
    .map((o) => ({
      bank: bank.name,
      merchant: String(o.merchant ?? "").trim(),
      category: String(o.category ?? "Other").trim(),
      discount: String(o.discount ?? "").trim(),
      conditions: o.conditions ? String(o.conditions).trim() : undefined,
      card_type: o.card_type ? String(o.card_type).trim() : undefined,
      valid_days: Array.isArray(o.valid_days)
        ? (o.valid_days as unknown[]).map(String)
        : undefined,
      valid_from: o.valid_from ? String(o.valid_from) : undefined,
      valid_until: o.valid_until ? String(o.valid_until) : undefined,
      url: bank.url,
    }))
    .filter((o) => o.merchant && o.discount);
}

function repairOffersWithSource(bank: BankConfig, sourceText: string, offers: ScrapedOffer[]): ScrapedOffer[] {
  return offers.map((offer) => repairOfferValidity(bank, sourceText, repairOfferDiscount(bank, sourceText, offer)));
}

function repairOfferDiscount(bank: BankConfig, sourceText: string, offer: ScrapedOffer): ScrapedOffer {
  if (isDualCardDiscount(offer.discount)) {
    return offer;
  }

  const sourceDiscount = findSourceDiscountForOffer(sourceText, offer);
  if (!sourceDiscount) return offer;

  const current = normalizeForComparison(offer.discount);
  const candidate = normalizeForComparison(sourceDiscount);
  const currentPercentValue = currentPercent(offer.discount);
  const candidatePercentValue = currentPercent(sourceDiscount);
  const currentHasQualifier = hasDiscountQualifier(offer.discount);
  const candidateHasQualifier = hasDiscountQualifier(sourceDiscount);

  const currentAppearsInSource = current ? normalizeForComparison(prepareExtractionText(sourceText)).includes(current) : false;
  const numericMatch = currentPercentValue !== null && currentPercentValue === candidatePercentValue;

  if (!isSuspiciousDiscount(offer.discount) && numericMatch) {
    if (currentHasQualifier || !candidateHasQualifier) {
      return offer;
    }
  }

  if (!isSuspiciousDiscount(offer.discount) && currentAppearsInSource && currentHasQualifier) {
    return offer;
  }

  if (current !== candidate) {
    console.info(
      `[scrape] ${bank.name}: corrected discount for ${offer.merchant} from "${offer.discount}" to "${sourceDiscount}"`
    );
  }

  return { ...offer, discount: sourceDiscount };
}

function isDualCardDiscount(value: string): boolean {
  return /\bcredit cards?\b.*&.*\bdebit cards?\b/i.test(value);
}

function repairOfferValidity(bank: BankConfig, sourceText: string, offer: ScrapedOffer): ScrapedOffer {
  const conditionValidity = extractCommercialValidity([offer.merchant, offer.conditions ?? ""].join(" "));
  const sourceValidity = mergeCommercialValidity(conditionValidity, findSourceValidityForOffer(sourceText, offer));
  const currentFrom = offer.valid_from;
  const currentUntil = offer.valid_until;
  const currentDateCount = [currentFrom, currentUntil].filter(Boolean).length;
  const currentReversed = Boolean(currentFrom && currentUntil && currentFrom > currentUntil);

  let repaired = offer;
  if (
    sourceValidity &&
    (currentReversed || currentDateCount < 2) &&
    (sourceValidity.valid_from || sourceValidity.valid_until)
  ) {
    const next = {
      ...repaired,
      valid_from: sourceValidity.valid_from ?? repaired.valid_from,
      valid_until: sourceValidity.valid_until ?? repaired.valid_until,
      valid_days: sourceValidity.valid_days?.length ? sourceValidity.valid_days : repaired.valid_days,
    };

    if (
      next.valid_from !== repaired.valid_from ||
      next.valid_until !== repaired.valid_until ||
      (next.valid_days?.join(",") ?? "") !== (repaired.valid_days?.join(",") ?? "")
    ) {
      console.info(
        `[scrape] ${bank.name}: normalized validity for ${offer.merchant} from "${repaired.valid_from ?? "none"}..${repaired.valid_until ?? "none"}" to "${next.valid_from ?? "none"}..${next.valid_until ?? "none"}"`,
      );
      repaired = next;
    }
  }

  const explicitWeekdays = extractExplicitWeekdayHints(offer.merchant);
  if (explicitWeekdays.length === 0) return repaired;

  const currentDays = repaired.valid_days ?? [];
  const sameDays =
    currentDays.length === explicitWeekdays.length &&
    currentDays.every((day) => explicitWeekdays.includes(day));

  if (sameDays) return repaired;

  console.info(
    `[scrape] ${bank.name}: normalized weekday for ${offer.merchant} from "${currentDays.join(",") || "none"}" to "${explicitWeekdays.join(",")}"`,
  );

  return {
    ...repaired,
    valid_days: explicitWeekdays,
  };
}

function extractCommercialBankOffers(sourceText: string, bank: BankConfig): ScrapedOffer[] {
  const lines = sourceText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!/ComBank/i.test(line)) continue;

    const merchant = extractCommercialMerchant(line);
    if (!merchant) continue;

    const context = [lines[index - 2], lines[index - 1], line, lines[index + 1], lines[index + 2]]
      .filter(Boolean)
      .join(" ");

    const discount =
      parseDiscountLabel(line) ??
      parseDiscountLabel(lines[index - 1] ?? "") ??
      parseDiscountLabel(lines[index - 2] ?? "") ??
      parseDiscountLabel(context);
    if (!discount) continue;

    const validity = extractCommercialValidity(`${merchant} ${context}`);
    const cardType = extractCommercialCardType(context);
    const conditions = extractCommercialConditions(context, line, merchant, validity);

    const key = [
      normalizeForComparison(merchant),
      normalizeForComparison(discount),
      normalizeForComparison(conditions ?? ""),
      validity.valid_until ?? "",
      (cardType ?? "").toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      bank: bank.name,
      merchant,
      category: inferCommercialCategory(merchant, context),
      discount,
      conditions,
      card_type: cardType,
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url: bank.url,
    });
  }

  return offers;
}

function mergeCommercialBankOffers(baseOffers: ScrapedOffer[], supplementalOffers: ScrapedOffer[]): ScrapedOffer[] {
  const merged = [...baseOffers];
  const mergedIndex = new Map<string, number>();
  for (let index = 0; index < merged.length; index++) {
    mergedIndex.set(stableOfferFingerprint(merged[index]), index);
  }

  for (const supplemental of supplementalOffers) {
    const key = stableOfferFingerprint(supplemental);
    const existingIndex = mergedIndex.get(key);

    if (existingIndex === undefined) {
      mergedIndex.set(key, merged.length);
      merged.push(supplemental);
      continue;
    }

    const existing = merged[existingIndex];
    const existingDiscount = normalizeForComparison(existing.discount);
    const supplementalDiscount = normalizeForComparison(supplemental.discount);
    const existingHasQualifier = hasDiscountQualifier(existing.discount);
    const supplementalHasQualifier = hasDiscountQualifier(supplemental.discount);

    const shouldReplace =
      isSuspiciousDiscount(existing.discount) ||
      (!existingHasQualifier && supplementalHasQualifier) ||
      (currentPercent(existing.discount) !== currentPercent(supplemental.discount) && supplementalHasQualifier);

    if (shouldReplace || existingDiscount !== supplementalDiscount) {
      merged[existingIndex] = {
        ...existing,
        ...supplemental,
        merchant: existing.merchant || supplemental.merchant,
        bank: existing.bank || supplemental.bank,
      };
      mergedIndex.set(key, existingIndex);
    }
  }

  return merged;
}

function extractCommercialBankOffersFromHtml(html: string, bank: BankConfig): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();
  const rewardRegex = /<a\b[^>]*class="[^"]*\breward\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(rewardRegex)) {
    const href = match[1].trim();
    const inner = match[2];
    const title = htmlToText(extractHtmlFragment(inner, /<h3[^>]*>([\s\S]*?)<\/h3>/i));
    const category = htmlToText(extractHtmlFragment(inner, /<p[^>]*class="category"[^>]*>([\s\S]*?)<\/p>/i));
    const offerTag = htmlToText(extractHtmlFragment(inner, /<div[^>]*class="offer-tag[^"]*"[^>]*>([\s\S]*?)<\/div>/i));
    const validDate = htmlToText(extractHtmlFragment(inner, /<p[^>]*class="valid-date"[^>]*>([\s\S]*?)<\/p>/i));

    if (!title || !offerTag) continue;

    const merchant = extractCommercialMerchant(title);
    const discount = parseDiscountLabel(offerTag);
    if (!merchant || !discount) continue;

    const validity = extractCommercialValidity(`${offerTag} ${validDate} ${title}`);
    const cardType = extractCommercialCardType(title);
    const conditions = validDate || title;
    const normalizedCategory = inferCommercialCategory(merchant, `${category} ${title}`);

    const key = [
      normalizeForComparison(merchant),
      normalizeForComparison(discount),
      normalizeForComparison(conditions),
      validity.valid_until ?? "",
      (cardType ?? "").toLowerCase(),
      href,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      bank: bank.name,
      merchant,
      category: normalizedCategory,
      discount,
      conditions,
      card_type: cardType,
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url: href,
    });
  }

  return offers;
}

function extractNdbOffersFromHtml(html: string, bank: BankConfig): ScrapedOffer[] {
  const openerRegex = /<a\b(?=[^>]*href="\/cards\/card-offers\/offer-details\/[^"]+")(?=[^>]*title="View Offer Details")[^>]*>/gi;
  const openers = [...html.matchAll(openerRegex)];
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < openers.length; index++) {
    const opener = openers[index][0];
    const href = extractAttribute(opener, "href");
    if (!href) continue;

    const blockStart = (openers[index].index ?? 0) + opener.length;
    const blockEnd = openers[index + 1]?.index ?? html.length;
    const block = html.slice(blockStart, blockEnd);
    if (!/card\s+offer-card/i.test(block)) continue;

    const title = htmlToText(extractHtmlFragment(block, /<h5[^>]*class="[^"]*card-title[^"]*ndbcolor[^"]*"[^>]*>([\s\S]*?)<\/h5>/i));
    const merchant = htmlToText(extractHtmlFragment(block, /<p[^>]*class="card-title"[^>]*>([\s\S]*?)<\/p>/i));
    const cardTypeText = htmlToText(extractHtmlFragment(block, /<p[^>]*class="text-muted[^"]*"[^>]*>([\s\S]*?)<\/p>/i));
    const dateText = htmlToText(extractHtmlFragment(block, /<p[^>]*class="offer-date[^"]*"[^>]*>([\s\S]*?)<\/p>/i));
    const discount = parseDiscountLabel(title) ?? title;

    if (!merchant || !discount) continue;

    const conditions = dateText || title;
    const validity = extractCommercialValidity(`${dateText} ${title}`);
    const cardType = extractCommercialCardType(`${cardTypeText} ${title}`);
    const category = inferCommercialCategory(merchant, `${title} ${dateText} ${cardTypeText}`);
    const url = resolveOfferUrl(href, bank.url);

    const key = [
      normalizeForComparison(merchant),
      normalizeForComparison(discount),
      normalizeForComparison(conditions),
      validity.valid_until ?? "",
      (cardType ?? "").toLowerCase(),
      url,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      bank: bank.name,
      merchant,
      category,
      discount,
      conditions,
      card_type: cardType,
      valid_days: validity.valid_days,
      valid_from: validity.valid_from,
      valid_until: validity.valid_until,
      url,
    });
  }

  return offers;
}

function extractBocOffersFromHtml(html: string, bank: BankConfig): ScrapedOffer[] {
  const openerRegex = /<a\b(?=[^>]*class="[^"]*\bswiper-slide\b[^"]*\bproduct\b[^"]*\bunique\b[^"]*")[^>]*>/gi;
  const openers = [...html.matchAll(openerRegex)];
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < openers.length; index++) {
    const opener = openers[index][0];
    const href = extractAttribute(opener, "href");
    if (!href) continue;

    const blockStart = (openers[index].index ?? 0) + opener.length;
    const blockEnd = openers[index + 1]?.index ?? html.length;
    const block = html.slice(blockStart, blockEnd);

    const merchant = htmlToText(extractHtmlFragment(block, /<h4[^>]*>([\s\S]*?)<\/h4>/i));
    if (!merchant) continue;

    const badge = htmlToText(extractHtmlFragment(block, /<div[^>]*class="offer"[^>]*>([\s\S]*?)<\/div>/i));
    const description = htmlToText(extractHtmlFragment(block, /<div[^>]*class="description"[^>]*>([\s\S]*?)<\/div>/i));
    const expiry = htmlToText(extractHtmlFragment(block, /<table[^>]*class="highligh-box"[^>]*>([\s\S]*?)<\/table>/i));
    const discount = parseDiscountLabel(description) ?? parseDiscountLabel(badge) ?? badge;
    if (!discount) continue;

    const context = `${badge} ${description} ${expiry}`;
    const validity = extractCommercialValidity(`${merchant} ${context}`);
    const explicitWeekday = extractExplicitWeekdayHint(merchant);
    const normalizedValidity =
      explicitWeekday && (!validity.valid_days || validity.valid_days.length === 0 || validity.valid_days.some((day) => day !== explicitWeekday))
        ? {
            ...validity,
            valid_days: [explicitWeekday],
          }
        : validity;
    const cardType = extractCommercialCardType(`${merchant} ${context}`);
    const category = inferCommercialCategory(merchant, context);
    const conditions = [description, expiry].filter(Boolean).join(" ").trim() || merchant;
    const url = resolveOfferUrl(href, bank.url);

    const key = [
      normalizeForComparison(merchant),
      normalizeForComparison(discount),
      normalizeForComparison(conditions),
      normalizedValidity.valid_until ?? "",
      (cardType ?? "").toLowerCase(),
      url,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      bank: bank.name,
      merchant,
      category,
      discount,
      conditions,
      card_type: cardType,
      valid_days: normalizedValidity.valid_days,
      valid_from: normalizedValidity.valid_from,
      valid_until: normalizedValidity.valid_until,
      url,
    });
  }

  return offers;
}

function extractCommercialMerchant(line: string): string | null {
  const cleaned = line.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/\bat\s+(.+?)\s+with\s+ComBank\b/i);
  if (match) return stripCommercialTail(match[1]);

  const altMatch = cleaned.match(/\b(?:deal|deals|offer|offers|savings?|discounts?)\s+(?:at|for)\s+(.+?)\s+with\s+ComBank\b/i);
  if (altMatch) return stripCommercialTail(altMatch[1]);

  return null;
}

function extractHtmlFragment(source: string, pattern: RegExp): string {
  return source.match(pattern)?.[1] ?? "";
}

function extractAttribute(source: string, name: string): string | null {
  const match = source.match(new RegExp(`${name}="([^"]+)"`, "i"));
  return match?.[1] ?? null;
}

function resolveOfferUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function stripCommercialTail(value: string): string {
  return value
    .replace(/\s+(?:Credit|Debit|Credit and Debit|Credit & Debit|Premium Credit|Premium Debit|Platinum Credit|Platinum Debit)\s+Cards?$/i, "")
    .replace(/\s+(?:Credit|Debit|Credit and Debit|Credit & Debit|Premium Credit|Premium Debit|Platinum Credit|Platinum Debit)$/i, "")
    .replace(/\s+(?:offer|offers|deal|deals)$/i, "")
    .trim();
}

function extractCommercialConditions(context: string, line: string, merchant: string, validity: CommercialValidity): string {
  const cleaned = context.replace(/\s+/g, " ").trim();
  const merchantIndex = cleaned.toLowerCase().indexOf(normalizeForComparison(merchant));
  const afterMerchant = merchantIndex >= 0 ? cleaned.slice(merchantIndex + merchant.length).trim() : cleaned;
  const validityText =
    validity.label ??
    line.match(/(offer valid.*)$/i)?.[1] ??
    afterMerchant.match(/(offer valid.*)$/i)?.[1] ??
    afterMerchant;

  return validityText || cleaned;
}

type CommercialValidity = {
  valid_days?: string[];
  valid_from?: string;
  valid_until?: string;
  label?: string;
};

function mergeCommercialValidity(primary: CommercialValidity | null, secondary: CommercialValidity | null): CommercialValidity {
  const validDays = new Set<string>();

  for (const validity of [primary, secondary]) {
    for (const day of validity?.valid_days ?? []) {
      validDays.add(day);
    }
  }

  return {
    valid_days: validDays.size > 0 ? [...validDays] : undefined,
    valid_from: primary?.valid_from ?? secondary?.valid_from,
    valid_until: primary?.valid_until ?? secondary?.valid_until,
    label: primary?.label ?? secondary?.label,
  };
}

function extractCommercialValidity(text: string): CommercialValidity {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const validDays = new Set<string>();

  // Use matchAll so multi-day patterns like "Saturday & Sunday" capture all days.
  for (const m of cleaned.matchAll(/\b(?:every|on)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/gi)) {
    validDays.add(weekdayToAbbrev(m[1]));
  }

  if (!validDays.size && /\b(deal|deals|offer|offers|promotion|promotions|valid|until|till|every|on)\b/i.test(cleaned)) {
    for (const m of cleaned.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/gi)) {
      validDays.add(weekdayToAbbrev(m[1]));
    }
  }

  // Keep weekdayMatch reference for the fallback below (any match is sufficient).
  const weekdayMatch = validDays.size > 0;

  const fullRangeMatch = cleaned.match(
    /\b(?:from|between)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\s+(?:to|till|until|-|and)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\b/i,
  );
  if (fullRangeMatch) {
    const validFrom = parseHumanDateToIso(fullRangeMatch[1]);
    const validUntil = parseHumanDateToIso(fullRangeMatch[2]);

    if (validFrom && validUntil) {
      return {
        valid_days: validDays.size > 0 ? [...validDays] : undefined,
        valid_from: validFrom,
        valid_until: validUntil,
        label: cleaned.match(/(?:offer valid|booking period|valid period|on\b|every\b).*/i)?.[0]?.trim() ?? cleaned,
      };
    }
  }

  const rangeMatch = cleaned.match(
    /\b(?:from|between)\s+(\d{1,2}(?:st|nd|rd|th)?)\s+(?:to|till|until|-|and)\s+(\d{1,2}(?:st|nd|rd|th)?)\s+([A-Za-z]+)\s+(\d{4})\b/i,
  );
  if (rangeMatch) {
    const month = monthNameToNumber(rangeMatch[3]);
    const year = Number(rangeMatch[4]);
    const startDay = Number(rangeMatch[1].replace(/(?:st|nd|rd|th)$/i, ""));
    const endDay = Number(rangeMatch[2].replace(/(?:st|nd|rd|th)$/i, ""));

    if (month && Number.isFinite(year) && Number.isFinite(startDay) && Number.isFinite(endDay)) {
      const validFrom = isoDateFromParts(year, month, startDay);
      const validUntil = isoDateFromParts(year, month, endDay);
      return {
        valid_days: validDays.size > 0 ? [...validDays] : undefined,
        valid_from: validFrom,
        valid_until: validUntil,
        label: cleaned.match(/(?:offer valid|booking period|valid period|on\b|every\b).*/i)?.[0]?.trim() ?? cleaned,
      };
    }
  }

  const dateListMatch = cleaned.match(
    /(?:on\s+|every\s+)?((?:\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:,|\.|&|and)\s*)?)+)\s+([A-Za-z]+)\s+(\d{4})/i,
  );
  if (dateListMatch) {
    const dayTokens = dateListMatch[1].split(/\s*(?:,|\.|&|and)\s*/i).map((part) => part.trim()).filter(Boolean);
    const month = monthNameToNumber(dateListMatch[2]);
    const year = Number(dateListMatch[3]);
    if (month && Number.isFinite(year)) {
      const parsedDates = dayTokens
        .map((token) => Number(token.replace(/(?:st|nd|rd|th)$/i, "")))
        .filter((day): day is number => Number.isFinite(day))
        .map((day) => isoDateFromParts(year, month, day))
        .sort();

      // Don't infer recurring valid_days from specific calendar dates — these
      // are one-time dates, not "every Saturday" patterns. If all dates happen
      // to fall on the same weekday we'd still get false positives on future
      // weeks. extractSpecificDates() on the client checks the exact dates.
      // valid_days is only kept if a weekday-keyword pattern matched earlier.
      const validFrom = parsedDates[0];
      const validUntil = parsedDates[parsedDates.length - 1];
      return {
        valid_days: validDays.size > 0 ? [...validDays] : undefined,
        valid_from: validFrom,
        valid_until: validUntil,
        label: cleaned.match(/(?:offer valid|booking period|valid period).*/i)?.[0]?.trim() ?? cleaned,
      };
    }
  }

  const singleDateMatch =
    cleaned.match(/(?:till|until|on|from|by)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i) ??
    cleaned.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\b/);
  const fallbackDateMatch = cleaned.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\b/);
  const dateMatch = singleDateMatch ?? fallbackDateMatch;
  const validUntil = dateMatch ? parseHumanDateToIso(dateMatch[1]) : undefined;
  if (!weekdayMatch && validUntil && !validDays.size) {
    // Use local-time date + .getDay() — constructing with T00:00:00 gives local midnight,
    // so .getUTCDay() would return the wrong day in UTC+5:30 (Sri Lanka).
    const parsed = new Date(`${validUntil}T00:00:00`);
    validDays.add(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parsed.getDay()]);
  }

  return {
    valid_days: validDays.size > 0 ? [...validDays] : undefined,
    valid_until: validUntil,
    label: cleaned.match(/(?:offer valid|booking period|valid period).*/i)?.[0]?.trim() ?? cleaned,
  };
}

function findSourceValidityForOffer(sourceText: string, offer: ScrapedOffer): CommercialValidity | null {
  const lines = prepareExtractionText(sourceText)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  const terms = buildSearchTerms([offer.merchant, offer.conditions ?? ""]);
  const candidates: Array<{ validity: CommercialValidity; score: number }> = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!lineMatchesAnyTerm(line, terms)) continue;

    for (let offset = -3; offset <= 3; offset++) {
      const candidateLine = lines[index + offset];
      if (!candidateLine) continue;

      const context = lines.slice(Math.max(0, index + offset - 1), Math.min(lines.length, index + offset + 2)).join(" ");
      const validity = extractCommercialValidity(context);
      if (!validity.valid_from && !validity.valid_until && (!validity.valid_days || validity.valid_days.length === 0)) continue;

      let score = 100 - Math.abs(offset) * 14;
      if (lineMatchesAnyTerm(candidateLine, terms)) score += 20;
      if (/\bvalid\b|\bfrom\b|\buntil\b|\btill\b|\bbooking period\b/i.test(context)) score += 20;
      if (validity.valid_from && validity.valid_until) score += 30;
      else if (validity.valid_from || validity.valid_until) score += 15;
      if (validity.valid_days?.length) score += 5;

      candidates.push({ validity, score });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.validity ?? null;
}

function extractCommercialCardType(text: string): string | undefined {
  const cleaned = text.toLowerCase();
  const hasCredit = /\bcredit\b/.test(cleaned);
  const hasDebit = /\bdebit\b/.test(cleaned);

  if (hasCredit && hasDebit) return "Both";
  if (hasDebit) return "Debit";
  if (hasCredit) return "Credit";
  return undefined;
}

function inferCommercialCategory(merchant: string, context: string): string {
  const value = `${merchant} ${context}`.toLowerCase();
  const websiteLikeMerchant = /\b[a-z0-9-]+\.[a-z]{2,}\b/i.test(merchant);
  if (/(supermarket|grocery|food city|glomark|cargills|keells|laugfs super|spar)/i.test(value)) return "Groceries";
  if (/(academy|campus|school|college|institute|university|education|educational|course|courses|tuition|training)/i.test(value)) return "Education";
  if (/(insurance|assurance|takaful|policy|premium)/i.test(value)) return "Insurance";
  if (/(hotel|resort|villa|beach|safari|retreat|lodge|inn|boutique|camp|bungalow|guest house|kanda|hill|rock)/i.test(value) && /(room\s*bookings?|accommodation|stay(?:\s+at)?|bed\s+and\s+breakfast|half\s+board|full\s+board|reservations?)/i.test(value)) {
    return "Travel";
  }
  if (/(restaurant|cafe|dine|dining|lunch|dinner|buffet|food|curry club|pizza|burger|fast food|takeaway)/i.test(value)) return "Dining";
  if (/(hotel|resort|beach|travel|stay|vacation|holiday|booking|tour|tourism|safari|retreat|lodge|inn|boutique|camp|bungalow|villa|guest house|hill|rock|kanda)/i.test(value)) return "Travel";
  if (/\b(hospital|clinic|pharmacy|medical|health|wellness|spa)\b/i.test(value)) return "Health";
  if (/(fuel|petrol|diesel|gas station|service station|garage|tyre|tyres|auto|automobile|automobiles|motor|motors|vehicle|vehicles|toyota|toyotsu|tyrezone|pit\s*&\s*drive|pit and drive)/i.test(value)) return "Fuel";
  if (
    websiteLikeMerchant &&
    !/\b(insurance|hospital|health|education|school|college)\b/i.test(value) &&
    /\b(instal(?:l|ment)|cashback|purchase|shop|store|market|online|offer|deal|deals|discount|savings?)\b/i.test(value)
  ) {
    return "Online";
  }
  if (/\bonline\b|\bapp\b|\bwebsite\b|\be-?commerce\b/i.test(value)) return "Online";
  if (/(shopping|retail|fashion|clothing|apparel|garment|textile|lifestyle|tile|tiles|ceramic|interior|home improvement|home decor|jewell?ery|hardware|store|mall|stationery|bookshop|book shop|book centre|book center|atlas|axillia|sarasavi|singer|damro|abans|softlogic|appliance|electronics|furniture)/i.test(value)) return "Shopping";
  if (/\btemu\b/i.test(value)) return "Online";
  return "Other";
}

function weekdayToAbbrev(value: string): string {
  switch (value.toLowerCase()) {
    case "monday":
      return "Mon";
    case "tuesday":
      return "Tue";
    case "wednesday":
      return "Wed";
    case "thursday":
      return "Thu";
    case "friday":
      return "Fri";
    case "saturday":
      return "Sat";
    case "sunday":
      return "Sun";
    default:
      return value.slice(0, 3);
  }
}

function extractExplicitWeekdayHint(text: string): string | undefined {
  const match = text.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/i);
  return match ? weekdayToAbbrev(match[1]) : undefined;
}

function extractExplicitWeekdayHints(text: string): string[] {
  const weekdays = new Set<string>();
  for (const match of text.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/gi)) {
    weekdays.add(weekdayToAbbrev(match[1]));
  }
  return [...weekdays];
}

function extractMarkdownLinkUrl(text: string): string | null {
  const match = text.match(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/i);
  return match?.[1] ?? null;
}

function parseCalendarLinkDates(text: string): { valid_from?: string; valid_until?: string } | null {
  const match = text.match(/calendar\.google\.com\/[^)\s]*[?&]dates=(\d{4})(\d{2})(\d{2})(?:\/(\d{4})(\d{2})(\d{2}))?/i);
  if (!match) return null;

  const valid_from = isoDateFromParts(Number(match[1]), Number(match[2]), Number(match[3]));
  const valid_until = match[4] && match[5] && match[6]
    ? isoDateFromParts(Number(match[4]), Number(match[5]), Number(match[6]))
    : valid_from;

  return { valid_from, valid_until };
}

function weekdayAbbrevFromDate(year: number, month: number, day: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function parseHumanDateToIso(value: string): string | undefined {
  const match = value.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = monthNameToNumber(match[2]);
  const year = Number(match[3]);

  if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return undefined;
  return isoDateFromParts(year, month, day);
}

function isoDateFromParts(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().split("T")[0];
}

function findSourceDiscountForOffer(sourceText: string, offer: ScrapedOffer): string | null {
  const lines = prepareExtractionText(sourceText)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  const terms = buildSearchTerms([offer.merchant, offer.conditions ?? ""]);
  const candidates: Array<{ label: string; score: number }> = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!lineMatchesAnyTerm(line, terms)) continue;

    for (let offset = -3; offset <= 3; offset++) {
      const candidateLine = lines[index + offset];
      if (!candidateLine) continue;

      const candidate = parseDiscountLabel(candidateLine);
      if (!candidate) continue;

      if (isSuspiciousDiscount(candidate) && !/(instal(?:l|ment)|interest\s*free|plan)/i.test(candidateLine)) continue;

      const score = 100 - Math.abs(offset) * 12 + (lineMatchesAnyTerm(candidateLine, terms) ? 15 : 0);
      candidates.push({ label: candidate, score });
    }
  }

  if (candidates.length === 0) {
    for (const line of lines) {
      const candidate = parseDiscountLabel(line);
      if (!candidate) continue;
      if (isSuspiciousDiscount(candidate) && !/(instal(?:l|ment)|interest\s*free|plan)/i.test(line)) continue;
      candidates.push({ label: candidate, score: 10 });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.label ?? null;
}

function parseDiscountLabel(line: string): string | null {
  const normalized = line.replace(/\s+/g, " ").trim();

  const dualCardMatch = normalized.match(
    /\b\d{1,2}(?:\.\d+)?\s*%\s*(?:off|savings?|cashback|rebate|discount)?\s*(?:for|on)?\s*credit cards?\s*&\s*\d{1,2}(?:\.\d+)?\s*%\s*(?:off|savings?|cashback|rebate|discount)?\s*(?:for|on)?\s*debit cards?\b/i,
  );
  if (dualCardMatch) return normalized;

  const leadingMatch = normalized.match(/\b(\d{1,2}(?:\.\d+)?)\s*%\s*(off|savings?|cashback|rebate|discount)\b/i);
  if (leadingMatch) return formatDiscountLabel(leadingMatch[1], leadingMatch[2], normalized);

  const upToMatch = normalized.match(/\b(?:up to|upto)\s*(\d{1,2}(?:\.\d+)?)\s*%\s*(off|savings?|cashback|rebate)?\b/i);
  if (upToMatch) return formatDiscountLabel(upToMatch[1], upToMatch[2], normalized);

  const discountMatch = normalized.match(/\b(?:discount|save|savings?)\s*[-:]*\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (discountMatch) return formatDiscountLabel(discountMatch[1], normalized, normalized);

  const trailingMatch = normalized.match(/\b(\d{1,2}(?:\.\d+)?)\s*%\s*(off|savings?|cashback|rebate)\b/i);
  if (trailingMatch) return formatDiscountLabel(trailingMatch[1], trailingMatch[2], normalized);

  const instalmentMatch = normalized.match(/\b0%\s*(instal(?:l|ment)|interest\s*free|plan|offer|promotion)\b/i);
  if (instalmentMatch) return "0% instalment";

  return null;
}

function formatDiscountLabel(percent: string, qualifier: string | undefined, sourceLine: string): string {
  const value = Number(percent);
  const label = Number.isFinite(value) ? String(value) : percent;
  const text = (qualifier ?? "").toLowerCase();
  const source = sourceLine.toLowerCase();

  if (/savings?/.test(text) || /savings?/.test(source)) return `${label}% Savings`;
  if (/cashback/.test(text) || /cashback/.test(source)) return `${label}% cashback`;
  if (/rebate/.test(text) || /rebate/.test(source)) return `${label}% rebate`;
  if (/up to/.test(source)) return `Up to ${label}% off`;
  if (/discount/.test(source)) return `${label}% off`;
  return `${label}% off`;
}

function buildSearchTerms(values: string[]): string[] {
  const stopwords = new Set([
    "with",
    "and",
    "or",
    "at",
    "for",
    "the",
    "best",
    "offer",
    "offers",
    "discount",
    "deals",
    "deal",
    "fresh",
    "credit",
    "debit",
    "cards",
    "card",
    "bank",
    "supermarket",
    "shopping",
    "online",
    "premium",
    "platinum",
  ]);

  const terms = new Set<string>();

  for (const value of values) {
    const normalized = normalizeForComparison(value);
    if (normalized) terms.add(normalized);

    const stripped = normalized
      .split(" ")
      .filter((part) => part && !stopwords.has(part))
      .join(" ")
      .trim();
    if (stripped) terms.add(stripped);

    for (const part of normalized.split(" ")) {
      if (part.length >= 4 && !stopwords.has(part)) terms.add(part);
    }
  }

  return [...terms].filter(Boolean);
}

function lineMatchesAnyTerm(line: string, terms: string[]): boolean {
  const normalized = normalizeForComparison(line);
  return terms.some((term) => normalized.includes(term));
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function currentPercent(value: string): string | null {
  const match = value.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
  return match ? match[1] : null;
}

function isSuspiciousDiscount(value: string): boolean {
  const normalized = normalizeForComparison(value);
  if (!normalized) return true;
  if (/^0\s*%$/.test(normalized)) return true;
  if (/^(best offer|offer|special offer|special|deal|discount|savings?|cashback|rebate)$/i.test(normalized)) return true;
  if (!/\d/.test(normalized) && !/(off|savings?|cashback|rebate|install|instal|plan)/i.test(normalized)) return true;
  return false;
}

function hasDiscountQualifier(value: string): boolean {
  return /(off|savings?|cashback|rebate|install|instal|plan)/i.test(value);
}

function stableOfferFingerprint(offer: ScrapedOffer): string {
  // Use only listing-page fields that are stable before and after enrichment.
  // Enriched fields (conditions, valid_days, valid_from, valid_until, url) can
  // vary between scrapes when detail-page fetching is inconsistent, which would
  // cause UUID churn and orphan votes stored in localStorage.
  return [
    offer.bank,
    offer.merchant,
    offer.discount,
    offer.card_type ?? "",
  ]
    .map((part) => normalizeForComparison(part))
    .join("|");
}

function stableOfferId(offer: ScrapedOffer): string {
  const hex = createHash("sha1").update(stableOfferFingerprint(offer)).digest("hex").slice(0, 32);
  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  const timeHi = ((parseInt(hex.slice(12, 16), 16) & 0x0fff) | 0x5000)
    .toString(16)
    .padStart(4, "0");
  const clockSeq = ((parseInt(hex.slice(16, 20), 16) & 0x3fff) | 0x8000)
    .toString(16)
    .padStart(4, "0");
  const node = hex.slice(20, 32);
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

type StoredOfferBundleItem = {
  id: string;
  merchant: string;
  category: string;
  discount: string;
  conditions?: string | null;
  card_type?: string | null;
  valid_days?: string[] | null;
  valid_from?: string | null;
  valid_until?: string | null;
  url: string;
};

const OFFER_BUNDLE_PREFIX = "__OFFER_BUNDLE__:";

function hashToUuid(seed: string): string {
  const hex = createHash("sha1").update(seed).digest("hex").slice(0, 32);
  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  const timeHi = ((parseInt(hex.slice(12, 16), 16) & 0x0fff) | 0x5000)
    .toString(16)
    .padStart(4, "0");
  const clockSeq = ((parseInt(hex.slice(16, 20), 16) & 0x3fff) | 0x8000)
    .toString(16)
    .padStart(4, "0");
  const node = hex.slice(20, 32);
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

function stableBundleId(items: StoredOfferBundleItem[]): string {
  const seed = items
    .map((item) =>
      [
        item.id,
        item.merchant,
        item.discount,
        item.conditions ?? "",
        item.card_type ?? "",
        item.valid_days?.join(",") ?? "",
        item.valid_from ?? "",
        item.valid_until ?? "",
        item.url,
      ]
        .map((part) => normalizeForComparison(part))
        .join("|"),
    )
    .sort()
    .join("||");
  return hashToUuid(seed);
}

function serializeOfferBundle(items: StoredOfferBundleItem[]): string {
  return `${OFFER_BUNDLE_PREFIX}${JSON.stringify({ offers: items })}`;
}

async function upsertOffers(bank: string, offers: ScrapedOffer[], url: string): Promise<void> {
  // Delete stale offers for this bank before inserting fresh ones.
  await supabaseAdmin.from("bank_offers").delete().eq("bank", bank);

  // Deduplicate by merchant — the table enforces one row per merchant today.
  const grouped = new Map<string, ScrapedOffer[]>();
  for (const offer of offers) {
    const key = normalizeForComparison(offer.merchant);
    const bucket = grouped.get(key) ?? [];
    bucket.push(offer);
    grouped.set(key, bucket);
  }

  const scrapedAt = new Date().toISOString();
  const rows = [...grouped.values()].map((group) => {
    const primary = [...group].sort((a, b) => scoreGroupedOffer(b) - scoreGroupedOffer(a))[0];
    const storedItems = group.map((offer) => ({
      id: stableOfferId(offer),
      merchant: offer.merchant,
      category: offer.category,
      discount: offer.discount,
      conditions: offer.conditions ?? null,
      card_type: offer.card_type ?? null,
      valid_days: offer.valid_days ?? null,
      valid_from: offer.valid_from ?? null,
      valid_until: offer.valid_until ?? null,
      url: offer.url,
    }));
    const isBundle = storedItems.length > 1;

    return {
      id: isBundle ? stableBundleId(storedItems) : storedItems[0].id,
      bank: primary.bank,
      merchant: primary.merchant,
      category: primary.category,
      discount: primary.discount,
      conditions: isBundle ? serializeOfferBundle(storedItems) : (primary.conditions ?? null),
      card_type: primary.card_type ?? null,
      valid_days: isBundle ? null : primary.valid_days ?? null,
      valid_from: isBundle ? null : primary.valid_from ?? null,
      valid_until: isBundle ? null : primary.valid_until ?? null,
      url: primary.url ?? url,
      scraped_at: scrapedAt,
    };
  });

  const { error } = await supabaseAdmin.from("bank_offers").insert(rows);
  if (error) throw new Error(error.message);
}

function scoreGroupedOffer(offer: ScrapedOffer): number {
  let score = 0;
  if (offer.category && offer.category !== "Other") score += 3;
  if (parseDiscountLabel(offer.discount)) score += 2;
  if (offer.valid_days && offer.valid_days.length > 0) score += 1.5;
  if (offer.valid_from) score += 0.75;
  if (offer.valid_until) score += 1;
  if (offer.card_type) score += 0.5;
  if ((offer.conditions ?? "").length > 30) score += 0.5;
  if (offer.url && offer.url !== offer.bank) score += 0.25;
  return score;
}
