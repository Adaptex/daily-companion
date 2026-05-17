import { supabase } from "./supabase";
import { classifyOfferCategory, type OfferCategory, type OfferCategoryConfidence } from "./offer-taxonomy";

type OfferRow = {
  id: string;
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
  scraped_at: string;
};

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

export type Offer = {
  id: string;
  bank: string;
  merchant: string;
  category: OfferCategory;
  raw_category: string;
  category_confidence: OfferCategoryConfidence;
  category_reason: string;
  category_signals: string[];
  discount: string;
  conditions?: string;
  card_type?: string;
  valid_days?: string[];
  valid_from?: string;
  valid_until?: string;
  url: string;
  scraped_at: string;
};

export type OffersResult =
  | { ok: true; offers: Offer[]; scrapedAt: string; totalActive: number }
  | { ok: false; error: string };

export async function getTodayOffers(): Promise<OffersResult> {
  const { data, error } = await supabase
    .from("bank_offers")
    .select("*")
    .order("scraped_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "No offers scraped yet. Scrape runs daily at 5:30am." };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expanded = (data as OfferRow[]).flatMap(expandOfferRow);

  // Keep offers that are live now or start in the future.
  // The client decides whether each row belongs in Today or Upcoming.
  const active = expanded
    .filter((o) => {
      if (!o.valid_until) return true;
      const until = parseLocalDate(o.valid_until);
      until.setHours(0, 0, 0, 0);
      return until >= now;
    })
    .map((o) => {
      const classification = classifyOfferCategory({
        bank: o.bank,
        merchant: o.merchant,
        category: o.category,
        discount: o.discount,
        conditions: o.conditions,
        url: o.url,
      });

      return {
        ...o,
        raw_category: o.category,
        category: classification.category,
        category_confidence: classification.categoryConfidence,
        category_reason: classification.categoryReason,
        category_signals: classification.categorySignals,
      };
    });

  const scrapedAt = data[0]?.scraped_at ?? new Date().toISOString();

  return { ok: true, offers: active, scrapedAt, totalActive: active.length };
}

function expandOfferRow(row: OfferRow): OfferRow[] {
  const bundle = parseOfferBundle(row.conditions);
  if (!bundle) return [row];

  return bundle.map((item, index) => ({
    id: item.id || `${row.id}:${index}`,
    bank: row.bank,
    merchant: item.merchant || row.merchant,
    category: item.category || row.category,
    discount: item.discount || row.discount,
    conditions: item.conditions ?? undefined,
    card_type: item.card_type ?? undefined,
    valid_days: item.valid_days ?? undefined,
    valid_from: item.valid_from ?? undefined,
    valid_until: item.valid_until ?? undefined,
    url: item.url || row.url,
    scraped_at: row.scraped_at,
  }));
}

function parseOfferBundle(value?: string): StoredOfferBundleItem[] | null {
  if (!value || !value.startsWith(OFFER_BUNDLE_PREFIX)) return null;

  try {
    const parsed = JSON.parse(value.slice(OFFER_BUNDLE_PREFIX.length)) as {
      offers?: StoredOfferBundleItem[];
    };
    if (!parsed?.offers || !Array.isArray(parsed.offers)) return null;
    return parsed.offers.filter(
      (item) => item && typeof item.merchant === "string" && typeof item.discount === "string",
    );
  } catch {
    return null;
  }
}

function parseLocalDate(value: string): Date {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}
