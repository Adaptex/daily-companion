"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offer, OffersResult } from "@/lib/offers";
import { Feedback } from "@/components/Feedback";
import { type OfferCategory } from "@/config/banks";
import {
  readFeedbackStoreSnapshot,
  type FeedbackStore,
  subscribeFeedbackStore,
} from "@/lib/feedback-store";

/**
 * Strips leading HTML/template artifacts from conditions text.
 * e.g. `el> slug}}">Valid Until...` → `Valid Until...`
 * These come from Jina markdown rendering of template-rendered bank pages.
 */
function cleanConditionsDisplay(text: string): string {
  const before = text.slice(0, 100);
  const idx = before.indexOf('">');
  if (idx !== -1 && /[/{}>|{}]/.test(before.slice(0, idx))) {
    const cleaned = text.slice(idx + 2).trim();
    return cleaned || text.trim();
  }
  return text.trim();
}

function parseDiscount(d: string): number {
  const m = d.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function summarizeBenefit(offer: Offer): string {
  const raw = normalizeSpaces(offer.discount || "");
  if (!raw) return "View details";

  const hint = normalizeSpaces([offer.card_type, offer.conditions, offer.merchant].filter(Boolean).join(" "));

  if (/^0%\s*$/i.test(raw) || /^0%\b/i.test(raw)) {
    if (/\binstall(?:ment|ation|ed)?\b|\bplan\b/i.test(hint)) {
      return "0% installment";
    }
    return "Check details";
  }

  const shortClause = raw.split(/\s+(?:on|for|with)\s+/i)[0].trim();
  if (shortClause.length > 0 && shortClause.length <= 28) {
    return shortClause;
  }

  if (/^up to \d+%/i.test(raw)) {
    const matched = raw.match(/^up to \d+%/i);
    if (matched) return matched[0];
  }

  return raw.length > 28 ? `${raw.slice(0, 25).trimEnd()}…` : raw;
}

const MAX_VISIBLE = 10;

function isUrgent(offer: Offer): boolean {
  if (parseDiscount(offer.discount) >= 30) return true;
  if (!offer.valid_until) return false;
  const hoursLeft = (parseLocalDate(offer.valid_until).getTime() - Date.now()) / 3_600_000;
  return hoursLeft > 0 && hoursLeft < 48;
}

function isFresh(offer: Offer): boolean {
  if (!offer.scraped_at) return false;
  return (Date.now() - new Date(offer.scraped_at).getTime()) / 3_600_000 < 24;
}

const SOCIAL_PATTERN = /\b(facebook\.com|instagram\.com|twitter\.com|x\.com|t\.me|youtube\.com)\b/i;

function isSocialSource(url: string | null | undefined): boolean {
  return Boolean(url && SOCIAL_PATTERN.test(url));
}

function generateOfferStory(offer: Offer): string {
  const d = summarizeBenefit(offer);
  const m = offer.merchant;
  switch (offer.category) {
    case "Dining":        return `Save ${d} on your next meal at ${m}`;
    case "Supermarket":   return `${d} off your grocery run at ${m}`;
    case "Travel":        return `${d} on your next getaway — book via ${m}`;
    case "Online":        return `Shop at ${m} online and keep ${d} in your pocket`;
    case "Fuel":          return `${d} cashback every time you fill up at ${m}`;
    case "Pharmacy":
    case "Health":        return `${d} on health & wellness at ${m}`;
    case "Shopping":      return `${d} off your next purchase at ${m}`;
    case "Entertainment": return `Catch something great at ${m} and save ${d}`;
    case "Education":     return `Invest in learning at ${m} — ${d} off`;
    case "Insurance":     return `${d} on insurance through ${m}`;
    default:              return `Save ${d} at ${m}`;
  }
}

function getContextualLabel(offer: Offer, voteWeight: number): string | undefined {
  if (isFresh(offer)) return "Just added";
  if (offer.valid_until) {
    const daysLeft = Math.ceil(
      (parseLocalDate(offer.valid_until).getTime() - Date.now()) / 86_400_000,
    );
    if (daysLeft > 0 && daysLeft <= 7) return `Expires in ${daysLeft}d`;
  }
  if (voteWeight >= 2) return "Community pick";
  return undefined;
}

type Collection = { name: string; icon: string; offers: Offer[] };

function groupIntoCollections(offers: Offer[], getFeedbackWeight: (o: Offer) => number): Collection[] {
  const assigned = new Set<string>();
  const pick = (predicate: (o: Offer) => boolean): Offer[] =>
    offers.filter((o) => {
      if (assigned.has(o.id) || !predicate(o)) return false;
      assigned.add(o.id);
      return true;
    });

  const fresh     = pick(isFresh);
  const getaways  = pick((o) => o.category === "Travel");
  const dining    = pick((o) => o.category === "Dining");
  const quickWins = pick((o) => parseDiscount(o.discount) >= 20);
  const rest      = pick(() => true).sort((a, b) => getFeedbackWeight(b) - getFeedbackWeight(a));

  return [
    fresh.length     > 0 ? { name: "Fresh Picks",    icon: "✦", offers: fresh }     : null,
    getaways.length  > 0 ? { name: "Getaways",        icon: "✈", offers: getaways }  : null,
    dining.length    > 0 ? { name: "Dining Gems",     icon: "◆", offers: dining }    : null,
    quickWins.length > 0 ? { name: "Quick Wins",      icon: "↑", offers: quickWins } : null,
    rest.length      > 0 ? { name: "All Deals",       icon: "·", offers: rest }      : null,
  ].filter((c): c is Collection => c !== null);
}

function getCollectionStyle(name: string): { text: string; rule: string } {
  switch (name) {
    case "Fresh Picks": return { text: "text-emerald-600",  rule: "bg-emerald-200/50" };
    case "Getaways":    return { text: "text-sky-600",      rule: "bg-sky-200/50" };
    case "Dining Gems": return { text: "text-amber-600",    rule: "bg-amber-200/50" };
    case "Quick Wins":  return { text: "text-violet-600",   rule: "bg-violet-200/50" };
    default:            return { text: "text-ink-soft",     rule: "bg-rule/60" };
  }
}

type CardOffersCardProps = {
  mode?: "compact" | "page";
};

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
  april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
  august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9,
  november: 10, nov: 10, december: 11, dec: 11,
};

const MONTHS_ALT = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec";

// Extracts specific calendar dates from conditions text.
// Handles: "13th May", "3rd of May", "3rd, 6th, 10th, 27th and 31st May 2026"
// Captures an explicit 4-digit year when present so past-year dates aren't
// mistakenly treated as current-year dates (e.g. "13th May 2025" stays in 2025).
function extractSpecificDates(conditions: string): Date[] {
  const currentYear = new Date().getFullYear();
  const dates: Date[] = [];
  const seen = new Set<string>();

  const addDate = (day: number, month: number, year: number) => {
    if (day < 1 || day > 31) return;
    const key = `${year}-${month}-${day}`;
    if (seen.has(key)) return;
    seen.add(key);
    const d = new Date(year, month, day);
    if (d.getDate() === day) dates.push(d); // rejects invalid dates like Feb 31
  };

  // Matches a comma/and-separated list of days followed by a month name,
  // with an optional 4-digit year after the month.
  // e.g. "3rd, 6th, 10th, 31st May 2026" or "13th May" or "3 of May"
  const pattern = new RegExp(
    `\\b((?:\\d{1,2}(?:st|nd|rd|th)?(?:\\s*(?:,|and|&)\\s*))+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}(?:st|nd|rd|th)?)(?:\\s+of)?\\s+(${MONTHS_ALT})(?:\\s+(\\d{4}))?\\b`,
    "gi",
  );

  let m;
  while ((m = pattern.exec(conditions)) !== null) {
    const daysPart = m[1];
    const month = MONTH_MAP[m[2].toLowerCase()];
    if (month === undefined) continue;
    const year = m[3] ? parseInt(m[3]) : currentYear;
    const nums = daysPart.match(/\d{1,2}/g) ?? [];
    for (const n of nums) addDate(parseInt(n), month, year);
  }

  return dates;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseLocalDate(value: string): Date {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function normalizeDayName(day: string): string | undefined {
  const short = day.trim().slice(0, 3);
  if (short.length < 3) return undefined;
  const normalized = `${short[0].toUpperCase()}${short.slice(1).toLowerCase()}`;
  return DAY_NAME_TO_INDEX[normalized] === undefined ? undefined : normalized;
}

function getNormalizedValidDays(validDays: string[]): string[] {
  return Array.from(new Set(validDays.map(normalizeDayName).filter((day): day is string => Boolean(day))));
}

function getFutureDatesFromValidDays(validDays: string[]): Date[] {
  const normalized = getNormalizedValidDays(validDays);
  const today = startOfDay(new Date());
  const todayIndex = today.getDay();
  const seen = new Set<number>();

  return normalized
    .map((day) => DAY_NAME_TO_INDEX[day])
    .filter((day): day is number => day !== undefined)
    .map((dayIndex) => {
      let offset = (dayIndex - todayIndex + 7) % 7;
      if (offset === 0) offset = 7;
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return startOfDay(date);
    })
    .filter((date) => {
      const key = date.getTime();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

function getNextRelevantDate(offer: Offer): Date | undefined {
  const today = startOfDay(new Date());

  if (offer.valid_from) {
    const from = startOfDay(parseLocalDate(offer.valid_from));
    if (from > today) return from;
  }

  if (offer.valid_days && offer.valid_days.length > 0) {
    const futureDays = getFutureDatesFromValidDays(offer.valid_days);
    if (futureDays.length > 0) return futureDays[0];
  }

  if (offer.conditions) {
    const future = extractSpecificDates(offer.conditions)
      .map((d) => startOfDay(d))
      .filter((d) => d > today)
      .sort((a, b) => a.getTime() - b.getTime());
    if (future.length > 0) return future[0];
  }

  return undefined;
}

// Returns a compact human label for when an upcoming offer is valid.
// e.g. "Wed & Sun", "13 · 27 May", "3 Jun"
function getWhenLabel(offer: Offer): string | undefined {
  // Prefer DB valid_days (day-of-week, e.g. ["Wed","Sun"])
  if (offer.valid_days && offer.valid_days.length > 0) {
    const normalized = getNormalizedValidDays(offer.valid_days);
    if (normalized.length === 0) return undefined;

    const todayName = DAY_NAMES[new Date().getDay()];
    if (normalized.includes(todayName)) {
      return normalized.join(" & ");
    }

    const futureDates = getFutureDatesFromValidDays(normalized);
    if (futureDates.length === 0) {
      return normalized.join(" & ");
    }

    const shown = futureDates.slice(0, 2).map(formatDateLabel);
    return shown.join(" · ") + (futureDates.length > 2 ? " ···" : "");
  }
  // DB valid_from date
  if (offer.valid_from) {
    const d = startOfDay(parseLocalDate(offer.valid_from));
    const today = startOfDay(new Date());
    return d > today ? `Starts ${formatDateLabel(d)}` : `From ${formatDateLabel(d)}`;
  }
  if (!offer.conditions) return undefined;

  {
    const futureDates = extractSpecificDates(offer.conditions)
      .map((d) => startOfDay(d))
      .sort((a, b) => a.getTime() - b.getTime());
    if (futureDates.length === 0) return undefined;

    const today = startOfDay(new Date());
    const upcomingDates = futureDates.filter((d) => d > today);
    if (upcomingDates.length === 0) return undefined;

    const shown = upcomingDates.slice(0, 2).map(formatDateLabel);
    return shown.join(" · ") + (upcomingDates.length > 2 ? " ···" : "");
  }
}

// 'today'    — conditions mention today's date explicitly → show in Today tab
// 'upcoming' — conditions mention dates but none is today, at least one is future → Upcoming tab
// 'expired'  — all mentioned dates are past → hide from both tabs
// 'unknown'  — no parseable dates in conditions, or DB fields already handle it → default to Today
function getDateStatus(offer: Offer): "today" | "upcoming" | "expired" | "unknown" {
  const today = startOfDay(new Date());
  // Track whether the offer is currently within its validity window (valid_until
  // is set and not yet expired). Used as the fallback when no specific
  // day-of-week or date-list pattern is found — these are "anytime" deals.
  let currentlyActive = false;

  if (offer.valid_until) {
    const until = startOfDay(parseLocalDate(offer.valid_until));
    if (until < today) return "expired";
    currentlyActive = true;
  }

  if (offer.valid_from) {
    const from = startOfDay(parseLocalDate(offer.valid_from));
    if (from > today) return "upcoming";
  }

  if (offer.valid_days && offer.valid_days.length > 0) {
    const normalized = getNormalizedValidDays(offer.valid_days);
    const todayName = DAY_NAMES[today.getDay()];
    if (normalized.includes(todayName)) return "today";
    return "upcoming";
  }

  // No day-of-week pattern — check conditions text for specific calendar dates
  // Evergreen assumption: if an offer passed the quality filter but has no
  // machine-readable dates anywhere, it's still on the bank's live site →
  // treat as active today rather than hiding it.
  if (!offer.conditions) return "today";

  {
    const dates = extractSpecificDates(offer.conditions)
      .map((d) => startOfDay(d))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return "today";

    if (dates.some((d) => d.getTime() === today.getTime())) return "today";
    if (dates.some((d) => d > today)) return "upcoming";
    return "expired";
  }
}

export function CardOffersCard({ mode = "compact" }: CardOffersCardProps = {}) {
  const [result, setResult] = useState<OffersResult | null>(null);
  const [category, setCategory] = useState<OfferCategory>("All");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [feedbackSnapshot, setFeedbackSnapshot] = useState(() => readFeedbackStoreSnapshot());
  useEffect(() => {
    const syncFeedback = () => setFeedbackSnapshot(readFeedbackStoreSnapshot());
    return subscribeFeedbackStore(syncFeedback);
  }, []);
  const feedbackStore = JSON.parse(feedbackSnapshot) as FeedbackStore;

  useEffect(() => {
    fetch("/api/offers", { cache: "no-store" })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ ok: false, error: "Failed to load offers." }));
  }, []);

  const allFiltered = useMemo(
    () =>
      result?.ok
        ? result.offers
            .filter((o) => o.merchant && o.merchant.trim() !== "")
            .sort((a, b) => parseDiscount(b.discount) - parseDiscount(a.discount))
            .filter(
              (o) =>
                (category === "All" || o.category === category) &&
                (!search || o.merchant.toLowerCase().includes(search.toLowerCase())),
            )
        : [],
    [result, category, search],
  );

  // Precompute date status once per offer — extractSpecificDates is not cheap
  // and was previously called 3× per offer (today / unverified / upcoming filters).
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getDateStatus>>();
    for (const o of allFiltered) map.set(o.id, getDateStatus(o));
    return map;
  }, [allFiltered]);

  const feedbackKeyFor = (offer: Offer): string => `offer:${offer.id}`;

  const feedbackWeight = (offer: Offer): number => {
    const vote = feedbackStore[feedbackKeyFor(offer)] ?? feedbackStore[`offer:${offer.bank}:${offer.merchant}`];
    if (vote === "up") return 2;
    if (vote === "down") return -2;
    return 0;
  };

  const todayOffers = allFiltered
    .filter((o) => dateStatusMap.get(o.id) === "today")
    .sort((a, b) => {
      const feedbackDiff = feedbackWeight(b) - feedbackWeight(a);
      if (feedbackDiff !== 0) return feedbackDiff;
      return parseDiscount(b.discount) - parseDiscount(a.discount);
    });
  const unverifiedOffers = allFiltered
    .filter((o) => dateStatusMap.get(o.id) === "unknown")
    .sort((a, b) => {
      const feedbackDiff = feedbackWeight(b) - feedbackWeight(a);
      if (feedbackDiff !== 0) return feedbackDiff;
      return parseDiscount(b.discount) - parseDiscount(a.discount);
    });
  const upcomingOffers = allFiltered
    .filter((o) => dateStatusMap.get(o.id) === "upcoming")
    .sort((a, b) => {
      const aDate = getNextRelevantDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDate = getNextRelevantDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aDate !== bDate) return aDate - bDate;
      const feedbackDiff = feedbackWeight(b) - feedbackWeight(a);
      if (feedbackDiff !== 0) return feedbackDiff;
      return parseDiscount(b.discount) - parseDiscount(a.discount);
    });
  // 'expired' offers are hidden from both tabs
  const displayOffers = tab === "today" ? todayOffers : upcomingOffers;

  const topCategories: OfferCategory[] = result?.ok
    ? (["All", ...Object.entries(
        result.offers.reduce<Record<string, number>>((acc, o) => {
          acc[o.category] = (acc[o.category] ?? 0) + 1;
          return acc;
        }, {}),
      )
        .sort(([, a], [, b]) => b - a)
        .map(([cat]) => cat)] as OfferCategory[])
    : ["All"];

  const scrapedTime = result?.ok
    ? new Date(result.scrapedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const visibleOffers = mode === "page" ? displayOffers : displayOffers.slice(0, MAX_VISIBLE);
  const hiddenCount = mode === "page" ? 0 : displayOffers.length - visibleOffers.length;
  const activeOffer =
    visibleOffers.find((offer) => offer.id === activeOfferId) ??
    (tab === "today" ? unverifiedOffers.find((offer) => offer.id === activeOfferId) : undefined) ??
    visibleOffers[0] ??
    null;
  const activeWhenLabel = activeOffer && tab === "upcoming" ? getWhenLabel(activeOffer) : undefined;
  const heroOffer = tab === "today" && visibleOffers.length > 0 ? visibleOffers[0] : null;
  const listOffers = heroOffer ? visibleOffers.slice(1) : visibleOffers;
  const todayCollections = tab === "today" ? groupIntoCollections(listOffers, feedbackWeight) : [];
  const shellClassName =
    mode === "page"
      ? "relative flex flex-col rounded-[28px] border border-rule bg-card/90 p-7 shadow-[0_22px_60px_-38px_rgba(27,24,21,0.18)] backdrop-blur-sm"
      : "relative flex flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]";

  return (
    <section className={shellClassName}>
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section C
            </span>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            {tab === "today" ? "Today’s Offers" : "Upcoming Offers"}
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          {result?.ok ? `${displayOffers.length} ${tab === "today" ? "live" : "ahead"}` : "—"}
        </span>
      </header>

      {/* Today / Upcoming tabs */}
      <div className="mb-3 flex gap-1.5">
        {(["today", "upcoming"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
              tab === t
                ? "bg-ink text-paper"
                : "border border-rule text-ink-faint hover:border-ink/30 hover:text-ink"
            }`}
          >
            {t === "today"
              ? "Today"
              : `Upcoming${result?.ok && upcomingOffers.length > 0 ? ` · ${upcomingOffers.length}` : ""}`}
          </button>
        ))}
      </div>

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

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {topCategories.map((cat) => (
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

      {/* Loading */}
      {!result && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-paper-deep" />
          ))}
        </div>
      )}

      {result && !result.ok && (
        <div className="py-8 text-center">
          <p className="font-display text-[18px] italic text-ink-soft">
            Couldn&apos;t retrieve offers.
          </p>
          <p className="mt-2 max-w-[24ch] text-[12px] text-ink-faint">{result.error}</p>
        </div>
      )}

      {result?.ok && displayOffers.length === 0 && (tab !== "today" || unverifiedOffers.length === 0) && (
        <div className="py-8 text-center">
          <p className="font-display text-[18px] italic text-ink-soft">
            {tab === "today" ? "No confirmed offers today." : "No upcoming offers."}
          </p>
          {tab === "today" && upcomingOffers.length > 0 && (
            <button
              onClick={() => setTab("upcoming")}
              className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent hover:underline"
            >
              View {upcomingOffers.length} upcoming →
            </button>
          )}
        </div>
      )}

      {result?.ok && tab === "today" && (visibleOffers.length > 0 || unverifiedOffers.length > 0) && (
        <>
          {heroOffer && (
            <EditorialHero
              offer={heroOffer}
              voteWeight={feedbackWeight(heroOffer)}
              onActivate={setActiveOfferId}
            />
          )}
          {todayCollections.map((collection) => (
            <div key={collection.name} className="mb-4">
              {todayCollections.length > 1 && (() => {
                const cs = getCollectionStyle(collection.name);
                return (
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`font-display text-[11px] italic ${cs.text}`}>
                      {collection.icon} {collection.name}
                    </span>
                    <div className={`h-px flex-1 ${cs.rule}`} />
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-faint">
                      {collection.offers.length}
                    </span>
                  </div>
                );
              })()}
              <ul className="space-y-1.5">
                {collection.offers.map((o) => (
                  <OfferRow
                    key={o.id}
                    offer={o}
                    active={activeOffer?.id === o.id}
                    onActivate={setActiveOfferId}
                    voteWeight={feedbackWeight(o)}
                  />
                ))}
              </ul>
            </div>
          ))}

          {unverifiedOffers.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-display text-[11px] italic text-ink-faint">
                  ? Unverified dates
                </span>
                <div className="h-px flex-1 bg-rule/40" />
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-faint">
                  {unverifiedOffers.length}
                </span>
              </div>
              <p className="mb-2 text-[10px] leading-snug text-ink-faint">
                Valid dates couldn&apos;t be confirmed — check before using.
              </p>
              <ul className="space-y-1.5 opacity-70">
                {unverifiedOffers.slice(0, 5).map((o) => (
                  <OfferRow
                    key={o.id}
                    offer={o}
                    active={activeOffer?.id === o.id}
                    onActivate={setActiveOfferId}
                    voteWeight={feedbackWeight(o)}
                    dateUnverified
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {result?.ok && visibleOffers.length > 0 && tab === "upcoming" && (
        <ul className="space-y-1.5">
          {visibleOffers.map((o) => (
            <OfferRow
              key={o.id}
              offer={o}
              active={activeOffer?.id === o.id}
              onActivate={setActiveOfferId}
              whenLabel={getWhenLabel(o)}
              voteWeight={feedbackWeight(o)}
            />
          ))}
        </ul>
      )}

      {result?.ok && activeOffer && (
        <div className="mt-4 rounded-2xl border border-rule bg-paper-deep/45 p-4 shadow-[0_12px_30px_-24px_rgba(27,24,21,0.24)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                Deal preview
              </p>
              <h3 className="mt-1 truncate font-display text-[18px] leading-tight text-ink">
                {activeOffer.merchant}
              </h3>
              <p className="mt-1 flex flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                <span>{activeOffer.bank}</span>
                <span>·</span>
                <span>{activeOffer.category}</span>
                {activeWhenLabel && (
                  <>
                    <span>·</span>
                    <span className="text-accent">{activeWhenLabel}</span>
                  </>
                )}
              </p>
            </div>
            <span className="flex-none rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {summarizeBenefit(activeOffer)}
            </span>
          </div>

          <p className="mt-3 text-[13px] leading-snug text-ink-soft">
            {activeOffer.conditions ? cleanConditionsDisplay(activeOffer.conditions) : "No extra conditions recorded."}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
              {activeOffer.card_type ?? "Card"}
            </span>
            {activeOffer.raw_category && activeOffer.raw_category !== activeOffer.category && (
              <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                from {activeOffer.raw_category}
              </span>
            )}
            {activeOffer.category_confidence !== "high" && (
              <span className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
                {activeOffer.category_confidence} confidence
              </span>
            )}
          </div>

          {activeOffer.category_reason && (
            <p className="mt-2 text-[10px] leading-snug text-ink-faint">
              {activeOffer.category_reason}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-rule-soft pt-3">
            <Feedback id={feedbackKeyFor(activeOffer)} />
            <a
              href={activeOffer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent transition hover:underline"
            >
              See deal on {activeOffer.bank} →
            </a>
          </div>
        </div>
      )}

      {result?.ok && hiddenCount > 0 && (
        <a
          href="/offers"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rule py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint transition hover:border-ink/30 hover:text-ink"
        >
          {"See more offers ->"}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      )}

      <footer className="mt-4 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        {scrapedTime ? `Updated ${scrapedTime}` : "Checking offers…"}
      </footer>
    </section>
  );
}

function EditorialHero({
  offer,
  voteWeight,
  onActivate,
}: {
  offer: Offer;
  voteWeight: number;
  onActivate: (id: string) => void;
}) {
  const story = generateOfferStory(offer);
  const contextLabel = getContextualLabel(offer, voteWeight);

  return (
    <div
      className="mb-5 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/8 to-transparent p-4"
      onMouseEnter={() => onActivate(offer.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
              Editor&apos;s Pick
            </span>
            {contextLabel && (
              <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                {contextLabel}
              </span>
            )}
          </div>
          <h3 className="font-display text-[20px] leading-tight text-ink">{offer.merchant}</h3>
          <p className="mt-1 text-[12px] italic leading-snug text-ink-soft">{story}</p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
            {offer.bank} · {offer.category}
          </p>
        </div>
        <span className="flex-none rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
          {summarizeBenefit(offer)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-rule-soft pt-3">
        <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          {isFresh(offer) ? "Just added today" : isUrgent(offer) ? "Limited time" : "Top rated"}
        </span>
        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/cta font-mono text-[10px] uppercase tracking-[0.18em] text-accent transition hover:underline"
        >
          Explore this deal{" "}
          <span className="inline-block transition-transform group-hover/cta:translate-x-0.5">→</span>
        </a>
      </div>
    </div>
  );
}

function OfferRow({
  offer,
  whenLabel,
  active,
  onActivate,
  voteWeight,
  dateUnverified,
}: {
  offer: Offer;
  whenLabel?: string;
  active: boolean;
  onActivate: (id: string) => void;
  voteWeight: number;
  dateUnverified?: boolean;
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const urgent = isUrgent(offer);
  const fresh = isFresh(offer);
  const social = isSocialSource(offer.url);
  const story = generateOfferStory(offer);
  const contextLabel = getContextualLabel(offer, voteWeight);

  return (
    <li className={`group/offer relative ${active ? "z-10" : "hover:z-20"}`}>
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => onActivate(offer.id)}
        onFocus={() => onActivate(offer.id)}
        onClick={(e) => {
          if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            setMobileExpanded((v) => !v);
            onActivate(offer.id);
          }
        }}
        className={`group/link flex items-center gap-3 rounded-xl border px-2.5 py-2 transition focus:outline-none ${
          active
            ? "border-accent/25 bg-paper-deep/45 shadow-[0_12px_28px_-24px_rgba(27,24,21,0.25)]"
            : "border-transparent hover:bg-paper-deep/35 focus:bg-paper-deep/35"
        }`}
      >
        <div
          className={`w-0.5 flex-none self-stretch rounded-full transition ${
            urgent
              ? "animate-[urgencyPulse_2.4s_ease-in-out_infinite] bg-accent"
              : active
              ? "bg-accent"
              : "bg-accent/20 group-hover/link:bg-accent/50"
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[13px] font-medium text-ink">{offer.merchant}</p>
              {fresh && (
                <span className="flex-none rounded-sm bg-accent px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-paper">
                  New
                </span>
              )}
              {social && (
                <span className="flex-none rounded-sm border border-rule bg-ink/5 px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-ink-faint">
                  Social
                </span>
              )}
              {dateUnverified && (
                <span className="flex-none rounded-sm border border-rule/60 bg-ink/4 px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-ink-faint">
                  ?
                </span>
              )}
            </div>
            <span className="flex-none rounded-full border border-rule bg-card px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
              {summarizeBenefit(offer)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] italic leading-snug text-ink-faint">
            {story}
          </p>
          <div className="mt-1 flex items-center gap-2 overflow-hidden">
            <span className="flex-none font-mono text-[9px] uppercase tracking-wider text-ink-faint">
              {offer.bank}
            </span>
            <span className="flex-none rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-soft">
              {offer.category}
            </span>
            {contextLabel && (
              <span className="flex-none rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                {contextLabel}
              </span>
            )}
            {whenLabel && (
              <span className="flex-none rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                {whenLabel}
              </span>
            )}
          </div>
        </div>
      </a>

      <div className="hidden">
        <Feedback id={`offer:${offer.id}`} />
      </div>

      {/* Mobile tap-to-expand inline panel */}
      {mobileExpanded && (
        <div className="mt-1 rounded-lg border border-rule bg-paper-deep/40 p-3 md:hidden">
          {offer.conditions && (
            <p className="text-[12px] leading-snug text-ink-soft">
              {cleanConditionsDisplay(offer.conditions)}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-rule-soft pt-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
              {offer.card_type ?? "Card"}
            </span>
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent hover:underline"
            >
              See deal on {offer.bank} →
            </a>
          </div>
        </div>
      )}

      {offer.conditions && (
        <div
          role="tooltip"
          className="absolute left-0 right-0 top-full z-50 hidden pt-1 group-hover/offer:block"
        >
          <div className="rounded-lg border border-rule bg-card p-3 shadow-[0_10px_40px_-15px_rgba(27,24,21,0.25)]">
            <p className="text-[12.5px] leading-snug text-ink-soft">{cleanConditionsDisplay(offer.conditions)}</p>
            {(offer.raw_category !== offer.category || offer.category_confidence !== "high") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
                  {offer.category}
                </span>
                {offer.raw_category && offer.raw_category !== offer.category && (
                  <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                    from {offer.raw_category}
                  </span>
                )}
                {offer.category_confidence !== "high" && (
                  <span className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-faint">
                    {offer.category_confidence} confidence
                  </span>
                )}
              </div>
            )}
            {(offer.raw_category !== offer.category || offer.category_confidence !== "high") &&
              offer.category_reason && (
                <p className="mt-2 text-[10px] leading-snug text-ink-faint">{offer.category_reason}</p>
              )}
            <div className="mt-2 flex items-center justify-between border-t border-rule-soft pt-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                {offer.card_type ?? "Card"}
              </span>
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-accent hover:underline"
              >
                See deal on {offer.bank} →
              </a>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
