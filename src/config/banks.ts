export type BankConfig = {
  name: string;
  url: string;
  enabled: boolean;
  note?: string;
};

export const BANKS: BankConfig[] = [
  {
    name: "NDB",
    url: "https://www.ndbbank.com/cards/card-offers",
    enabled: true,
  },
  {
    name: "Commercial Bank",
    url: "https://www.combank.lk/rewards-promotions",
    enabled: true,
  },
  {
    name: "HNB",
    url: "https://www.hnb.lk/personal/promotions/card-promotion/card-offers?category=The+Club",
    enabled: true,
    note: "HNB Club member — scrape Club-tier offers",
  },
  {
    name: "Sampath",
    url: "https://www.sampath.lk/sampath-cards/credit-card-offer",
    enabled: true,
  },
  {
    name: "BOC",
    url: "https://www.boc.lk/personal-banking/card-offers",
    enabled: true,
  },
  {
    name: "People's Bank",
    url: "https://www.peoplesbank.lk/special-offers/",
    enabled: true,
  },
  {
    name: "Seylan",
    url: "https://www.seylan.lk/promotions",
    enabled: true,
  },
  {
    name: "DFCC",
    url: "https://www.dfcc.lk/dfcc-card-offers",
    enabled: true,
  },
];

export const OFFER_CATEGORIES = [
  "All",
  "Groceries",
  "Dining",
  "Pharmacy",
  "Fuel",
  "Online",
  "Travel",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type OfferCategory = (typeof OFFER_CATEGORIES)[number];
