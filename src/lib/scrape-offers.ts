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
  valid_until?: string;
  url: string;
};

type ScrapeResult =
  | { bank: string; ok: true; count: number }
  | { bank: string; ok: false; error: string };

const BANK_TIMEOUT_MS = 90_000;
const FETCH_TIMEOUT_MS = 20_000;
const JINA_TIMEOUT_MS = 45_000;

export async function scrapeAllBanks(): Promise<ScrapeResult[]> {
  const enabled = BANKS.filter((b) => b.enabled);
  const results: ScrapeResult[] = [];

  for (const bank of enabled) {
    const deadline = new Promise<ScrapeResult>((resolve) =>
      setTimeout(
        () => resolve({ bank: bank.name, ok: false, error: "Timed out after 90s" }),
        BANK_TIMEOUT_MS
      )
    );
    results.push(await Promise.race([scrapeBank(bank), deadline]));
  }

  return results;
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
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
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
  // Try direct fetch; fall back to Jina AI for JS-rendered or blocked pages.
  let text = await tryDirectFetch(bank.url);
  let usedJina = false;

  if (!text) {
    console.info(`[scrape] ${bank.name}: direct fetch failed, trying Jina AI`);
    text = await tryJinaFetch(bank.url);
    usedJina = true;
  }

  if (!text) {
    return { bank: bank.name, ok: false, error: "Fetch failed via direct and Jina AI" };
  }

  let offers: ScrapedOffer[] = [];
  try {
    offers = await extractOffers(bank, text.slice(0, 12_000));
  } catch (err) {
    return { bank: bank.name, ok: false, error: `LLM extraction failed: ${String(err)}` };
  }

  // If direct fetch yielded no offers, the page is likely JS-rendered — retry with Jina AI.
  if (offers.length === 0 && !usedJina) {
    console.info(`[scrape] ${bank.name}: no offers from direct fetch, retrying with Jina AI`);
    const jinaText = await tryJinaFetch(bank.url);
    if (jinaText) {
      try {
        offers = await extractOffers(bank, jinaText.slice(0, 12_000));
      } catch {
        // fall through to "no offers" error
      }
    }
  }

  if (offers.length === 0) {
    return { bank: bank.name, ok: false, error: "No offers extracted" };
  }

  try {
    await upsertOffers(bank.name, offers, bank.url);
  } catch (err) {
    return { bank: bank.name, ok: false, error: `DB write failed: ${String(err)}` };
  }

  return { bank: bank.name, ok: true, count: offers.length };
}

async function extractOffers(bank: BankConfig, markdown: string): Promise<ScrapedOffer[]> {
  const prompt = `You are extracting credit/debit card offers from a Sri Lankan bank's promotions page.
Bank: ${bank.name}${bank.note ? `\nContext: ${bank.note}` : ""}

From the page content below, extract every card offer you can find. For each offer return:
- merchant: the merchant or business name (string)
- category: one of [Groceries, Dining, Pharmacy, Fuel, Online, Travel, Health, Entertainment, Other]
- discount: the discount or benefit (e.g. "10% off", "15% cashback", "0% instalment 12 months")
- conditions: key conditions in one sentence (optional)
- card_type: "Credit", "Debit", or "Both" (optional, omit if unclear)
- valid_days: array of day names if day-specific (e.g. ["Mon","Tue"]), omit if all days

Return ONLY valid JSON, no markdown:
{"offers":[{"merchant":"...","category":"...","discount":"...","conditions":"...","card_type":"...","valid_days":["Mon"]}]}

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
      valid_until: o.valid_until ? String(o.valid_until) : undefined,
      url: bank.url,
    }))
    .filter((o) => o.merchant && o.discount);
}

async function upsertOffers(bank: string, offers: ScrapedOffer[], url: string): Promise<void> {
  // Delete stale offers for this bank before inserting fresh ones.
  await supabaseAdmin.from("bank_offers").delete().eq("bank", bank);

  // Deduplicate by merchant — LLM occasionally extracts the same merchant twice.
  const seen = new Set<string>();
  const rows = offers
    .filter((o) => {
      const key = o.merchant.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((o) => ({
      bank: o.bank,
      merchant: o.merchant,
      category: o.category,
      discount: o.discount,
      conditions: o.conditions ?? null,
      card_type: o.card_type ?? null,
      valid_days: o.valid_days ?? null,
      valid_until: o.valid_until ?? null,
      url,
      scraped_at: new Date().toISOString(),
    }));

  const { error } = await supabaseAdmin.from("bank_offers").insert(rows);
  if (error) throw new Error(error.message);
}
