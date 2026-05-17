import { OFFER_CATEGORIES, type OfferCategory as CanonicalOfferCategory } from "@/lib/offer-taxonomy";

export type BankConfig = {
  name: string;
  url: string;
  enabled: boolean;
  note?: string;
  /**
   * Regex source string that matches per-offer detail page paths inside the
   * listing page HTML (e.g. "/cards/card-offers/offer-details/\\d+").
   * Used by normalizeOfferPipeline to discover individual offer URLs.
   */
  offerDetailUrlPattern?: string;
  /** Base URL prepended to relative paths found by offerDetailUrlPattern. */
  offerDetailUrlBase?: string;
};

export const BANKS: BankConfig[] = [
  {
    name: "NDB",
    url: "https://www.ndbbank.com/cards/card-offers",
    enabled: true,
    offerDetailUrlPattern: "/cards/card-offers/offer-details/\\d+",
    offerDetailUrlBase: "https://www.ndbbank.com",
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
    url: "https://www.peoplesbank.lk/installments/?cardType=credit_card",
    enabled: true,
  },
  {
    name: "Seylan",
    url: "https://www.seylan.lk/promotions",
    enabled: true,
  },
  {
    name: "DFCC",
    url: "https://www.dfcc.lk/dfcc-card-offers/today-promotions",
    enabled: true,
  },
];

export { OFFER_CATEGORIES };
export type OfferCategory = CanonicalOfferCategory | "All";
