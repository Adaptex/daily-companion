"use client";

import { useEffect, useState } from "react";
import type { Offer, OffersResult } from "@/lib/offers";
import { Feedback } from "@/components/Feedback";
import { OFFER_CATEGORIES, type OfferCategory } from "@/config/banks";

function parseDiscount(d: string): number {
  const m = d.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

export function CardOffersCard() {
  const [result, setResult] = useState<OffersResult | null>(null);
  const [category, setCategory] = useState<OfferCategory>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ ok: false, error: "Failed to load offers." }));
  }, []);

  const highlights = result?.ok
    ? [...result.offers]
        .sort((a, b) => parseDiscount(b.discount) - parseDiscount(a.discount))
        .slice(0, 3)
    : [];

  const filtered = result?.ok
    ? result.offers.filter(
        (o) =>
          (category === "All" || o.category === category) &&
          (!search || o.merchant.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const availableCategories = result?.ok
    ? (["All", ...new Set(result.offers.map((o) => o.category))] as OfferCategory[])
    : (["All"] as OfferCategory[]);

  const scrapedTime = result?.ok
    ? new Date(result.scrapedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const MAX_VISIBLE = 10;
  const visibleOffers = filtered.slice(0, MAX_VISIBLE);
  const hiddenCount = filtered.length - visibleOffers.length;

  const byCategory = visibleOffers.reduce<Record<string, Offer[]>>((acc, o) => {
    (acc[o.category] ??= []).push(o);
    return acc;
  }, {});

  return (
    <section className="relative flex h-full flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section C
            </span>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Today&apos;s Offers
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          {result?.ok ? `${result.totalActive} live` : "—"}
        </span>
      </header>

      {/* Today's highlights */}
      {highlights.length > 0 && (
        <div className="mb-4 rounded-xl border border-rule bg-paper-deep/60 p-3">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-ink-faint">
            Today&apos;s highlights
          </p>
          <div className="grid grid-cols-3 gap-2">
            {highlights.map((o) => (
              <a
                key={o.id}
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-0.5 rounded-lg border border-transparent p-2 transition hover:border-rule hover:bg-paper"
              >
                <span className="font-display text-[22px] leading-none tracking-tight text-accent">
                  {o.discount}
                </span>
                <span className="mt-1 line-clamp-1 text-[11px] font-medium text-ink">
                  {o.merchant}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                  {o.bank}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <input
          type="search"
          placeholder="Search merchants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-rule bg-transparent py-1.5 pl-3 pr-8 font-mono text-[11px] text-ink placeholder:text-ink-faint/50 focus:border-ink/30 focus:outline-none transition"
        />
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

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
            No {search ? `"${search}"` : category === "All" ? "" : category.toLowerCase()} offers found.
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
              <ul className="space-y-1">
                {offers.map((o) => (
                  <OfferRow key={o.id} offer={o} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {result?.ok && hiddenCount > 0 && (
        <a
          href="/offers"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rule py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint transition hover:border-ink/30 hover:text-ink"
        >
          View all {filtered.length} offers
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      )}

      <footer className="mt-auto border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        {scrapedTime ? `Updated ${scrapedTime}` : "Checking offers…"}
      </footer>
    </section>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  return (
    <li className="group/offer relative">
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-center gap-3 rounded-md py-2 px-1 transition hover:bg-paper-deep/40 focus:outline-none focus:bg-paper-deep/40"
      >
        {/* Left accent bar */}
        <div className="h-8 w-0.5 flex-none self-stretch rounded-full bg-accent/20 transition group-hover/link:bg-accent/50" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{offer.merchant}</p>
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            {offer.bank}
          </span>
        </div>

        <span className="flex-none font-display text-[16px] italic text-accent">
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
