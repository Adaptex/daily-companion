import { offers, type Offer } from "@/data/offers";

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];

export type GroupedOffers = {
  today: DayKey;
  todayLong: string;
  totalActive: number;
  byCategory: { category: Offer["category"]; offers: Offer[] }[];
};

export function getTodayOffers(now: Date = new Date()): GroupedOffers {
  const today = DAY_KEYS[now.getDay()];
  const todayLong = now.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  const active = offers.filter((o) => {
    if (o.validUntil && Date.parse(o.validUntil) < now.getTime()) return false;
    if (!o.validDays || o.validDays.length === 0) return true;
    return o.validDays.includes(today);
  });

  // Group by category, preserve a curated category order.
  const order: Offer["category"][] = [
    "Groceries",
    "Dining",
    "Pharmacy",
    "Fuel",
    "Online",
    "Travel",
  ];
  const byCategory = order
    .map((category) => ({
      category,
      offers: active.filter((o) => o.category === category),
    }))
    .filter((g) => g.offers.length > 0);

  return {
    today,
    todayLong,
    totalActive: active.length,
    byCategory,
  };
}
