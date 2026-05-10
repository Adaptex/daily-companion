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

const BANK_TIMEOUT_MS = 25_000;

export async function scrapeAllBanks(): Promise<ScrapeResult[]> {
  const enabled = BANKS.filter((b) => b.enabled);
  const results: ScrapeResult[] = [];

  for (const bank of enabled) {
    const deadline = new Promise<ScrapeResult>((resolve) =>
      setTimeout(
        () => resolve({ bank: bank.name, ok: false, error: "Timed out after 25s" }),
        BANK_TIMEOUT_MS
      )
    );
    results.push(await Promise.race([scrapeBank(bank), deadline]));
  }

  return results;
}

async function scrapeBank(bank: BankConfig): Promise<ScrapeResult> {
  let markdown: string;

  try {
    const res = await fetch(`https://r.jina.ai/${bank.url}`, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "markdown",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Jina ${res.status}`);
    markdown = await res.text();
  } catch (err) {
    return { bank: bank.name, ok: false, error: `Fetch failed: ${String(err)}` };
  }

  // Truncate to stay within LLM context limits.
  const truncated = markdown.slice(0, 12_000);

  let offers: ScrapedOffer[];
  try {
    offers = await extractOffers(bank, truncated);
  } catch (err) {
    return { bank: bank.name, ok: false, error: `LLM extraction failed: ${String(err)}` };
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

  const rows = offers.map((o) => ({
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
