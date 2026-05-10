import { supabase } from "./supabase";

export type Offer = {
  id: string;
  bank: string;
  merchant: string;
  category: string;
  discount: string;
  conditions?: string;
  card_type?: string;
  valid_days?: string[];
  valid_until?: string;
  url: string;
  scraped_at: string;
};

export type OffersResult =
  | { ok: true; offers: Offer[]; scrapedAt: string; totalActive: number }
  | { ok: false; error: string };

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function getTodayOffers(): Promise<OffersResult> {
  const { data, error } = await supabase
    .from("bank_offers")
    .select("*")
    .order("scraped_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "No offers scraped yet. Scrape runs daily at 5:30am." };

  const today = DAY_KEYS[new Date().getDay()];
  const now = new Date();

  const active = (data as Offer[]).filter((o) => {
    if (o.valid_until && new Date(o.valid_until) < now) return false;
    if (!o.valid_days || o.valid_days.length === 0) return true;
    return o.valid_days.includes(today);
  });

  const scrapedAt = data[0]?.scraped_at ?? new Date().toISOString();

  return { ok: true, offers: active, scrapedAt, totalActive: active.length };
}
