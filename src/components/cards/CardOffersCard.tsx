import { getTodayOffers } from "@/lib/offers";
import type { Offer } from "@/data/offers";
import { Feedback } from "@/components/Feedback";

const BANK_TINT: Record<Offer["bank"], string> = {
  "NDB": "bg-[#fde4d3] text-[#7c2d12]",
  "Commercial Bank": "bg-[#dbe7d6] text-[#3b5b34]",
  "HNB": "bg-[#e0dccd] text-[#5a4f2c]",
  "Sampath": "bg-[#e6dcef] text-[#4a2c5a]",
};

const CATEGORY_GLYPH: Record<Offer["category"], string> = {
  Groceries: "◐",
  Dining: "◑",
  Pharmacy: "◒",
  Online: "◓",
  Fuel: "◔",
  Travel: "◕",
};

export function CardOffersCard() {
  const data = getTodayOffers();

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
          {data.totalActive} live
        </span>
      </header>

      {data.byCategory.length === 0 ? (
        <EmptyState dayLong={data.todayLong} />
      ) : (
        <ul className="space-y-4">
          {data.byCategory.map((group) => (
            <li key={group.category}>
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                <span className="text-accent">{CATEGORY_GLYPH[group.category]}</span>
                {group.category}
              </p>
              <ul className="space-y-2">
                {group.offers.map((o, i) => (
                  <OfferRow key={`${group.category}-${i}`} offer={o} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        valid {data.todayLong}
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
        className="flex items-center gap-3 rounded-md py-1.5 px-1 transition hover:bg-paper-deep/40 focus:outline-none focus:bg-paper-deep/40"
      >
        <span
          className={`flex-none rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
            BANK_TINT[offer.bank]
          }`}
        >
          {offer.bank}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ink">
            {offer.merchant}
          </p>
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
            <p className="text-[12.5px] leading-snug text-ink-soft">
              {offer.conditions}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-rule-soft pt-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                {offer.cardType ?? "Card"}
              </span>
              <span className="text-[11px] font-medium text-accent">
                view on bank site →
              </span>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyState({ dayLong }: { dayLong: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <p className="font-display text-[20px] italic text-ink-soft">
        Nothing on {dayLong}.
      </p>
      <p className="mt-2 max-w-[20ch] text-[12.5px] text-ink-faint">
        No tracked offers active today. Check back tomorrow.
      </p>
    </div>
  );
}
