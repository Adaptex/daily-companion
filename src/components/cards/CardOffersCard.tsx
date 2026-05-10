"use client";

import { useEffect, useState } from "react";
import type { Offer, OffersResult } from "@/lib/offers";
import { Feedback } from "@/components/Feedback";
import { OFFER_CATEGORIES, type OfferCategory } from "@/config/banks";

export function CardOffersCard() {
  const [result, setResult] = useState<OffersResult | null>(null);
  const [category, setCategory] = useState<OfferCategory>("All");

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ ok: false, error: "Failed to load offers." }));
  }, []);

  const filtered =
    result?.ok
      ? category === "All"
        ? result.offers
        : result.offers.filter((o) => o.category === category)
      : [];

  // Only show categories that have offers.
  const availableCategories = result?.ok
    ? (["All", ...new Set(result.offers.map((o) => o.category))] as OfferCategory[])
    : (["All"] as OfferCategory[]);

  const scrapedTime = result?.ok
    ? new Date(result.scrapedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const byCategory = filtered.reduce<Record<string, Offer[]>>((acc, o) => {
    (acc[o.category] ??= []).push(o);
    return acc;
  }, {});

  return (
    <section className="relative flex flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            Section C
          </span>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Today&apos;s Offers
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          {result?.ok ? `${result.totalActive} live` : "—"}
        </span>
      </header>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
              category === cat
                ? "bg-ink text-paper"
                : "border border-rule text-ink-faint hover:border-ink/30 hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* States */}
      {!result && (
        <div className="flex flex-1 flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-paper-deep" />
          ))}
        </div>
      )}

      {result && !result.ok && (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="font-display text-[18px] italic text-ink-soft">Couldn&apos;t retrieve offers.</p>
          <p className="mt-2 max-w-[24ch] text-[12px] text-ink-faint">{result.error}</p>
        </div>
      )}

      {result?.ok && filtered.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="font-display text-[18px] italic text-ink-soft">
            No {category === "All" ? "" : category.toLowerCase()} offers today.
          </p>
        </div>
      )}

      {result?.ok && filtered.length > 0 && (
        <ul className="space-y-4">
          {Object.entries(byCategory).map(([cat, offers]) => (
            <li key={cat}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                {cat}
              </p>
              <ul className="space-y-2">
                {offers.map((o) => (
                  <OfferRow key={o.id} offer={o} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        {scrapedTime ? `Updated ${scrapedTime}` : "Checking offers…"}
      </footer>
    </section>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="group/offer relative">
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md py-1.5 px-1 transition hover:bg-paper-deep/40 focus:outline-none focus:bg-paper-deep/40"
      >
        <span className="flex-none rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          {offer.bank}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ink">{offer.merchant}</p>
        </div>

        <span className="flex-none font-display text-[15px] italic text-accent">
          {offer.discount}
        </span>
      </a>

      <div className="absolute right-1 top-1.5 opacity-0 transition-opacity group-hover/offer:opacity-100 group-focus-within/offer:opacity-100">
        <Feedback id={`offer:${offer.bank}:${offer.merchant}`} />
      </div>

      {offer.conditions && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-1 opacity-0 transition-opacity duration-150 group-hover/offer:pointer-events-auto group-hover/offer:opacity-100 group-focus-within/offer:pointer-events-auto group-focus-within/offer:opacity-100"
        >
          <div className="pop-in rounded-lg border border-rule bg-card p-3 shadow-[0_10px_40px_-15px_rgba(27,24,21,0.25)]">
            <p className="text-[12.5px] leading-snug text-ink-soft">{offer.conditions}</p>
            <div className="mt-2 flex items-center justify-between border-t border-rule-soft pt-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                {offer.card_type ?? "Card"}
              </span>
              <span className="text-[11px] font-medium text-accent">view on bank site →</span>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
