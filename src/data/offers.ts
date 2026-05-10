// Seed card-offer data for Sri Lankan banks.
// SOURCE: hand-curated from publicly listed bank offer pages.
// MAINTENANCE: verify quarterly against each bank's official offers page.
// Last verified: 2026-05-10

export type Offer = {
  bank: "NDB" | "Commercial Bank" | "HNB" | "Sampath";
  cardType?: "Credit" | "Debit" | "Both";
  category: "Groceries" | "Dining" | "Pharmacy" | "Online" | "Fuel" | "Travel";
  merchant: string;
  discount: string;
  /** Days of the week the offer is active. Omit = all days. */
  validDays?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  /** ISO date the offer expires. Omit = ongoing. */
  validUntil?: string;
  conditions?: string;
  url: string;
};

export const offers: Offer[] = [
  {
    bank: "NDB",
    cardType: "Credit",
    category: "Groceries",
    merchant: "Keells Super",
    discount: "10% off",
    validDays: ["Wed"],
    conditions: "Bills above LKR 5,000. Excludes liquor & dairy.",
    url: "https://www.ndbbank.com/personal/cards/offers",
  },
  {
    bank: "Commercial Bank",
    cardType: "Credit",
    category: "Groceries",
    merchant: "Cargills Food City",
    discount: "12% off",
    validDays: ["Tue", "Thu"],
    conditions: "Min spend LKR 4,000. Once per card per day.",
    url: "https://www.combank.lk/cards/offers",
  },
  {
    bank: "HNB",
    cardType: "Both",
    category: "Groceries",
    merchant: "Arpico Supercentre",
    discount: "8% off",
    validDays: ["Sat", "Sun"],
    conditions: "Weekends only. Min spend LKR 3,500.",
    url: "https://www.hnb.net/cards-offers",
  },
  {
    bank: "Sampath",
    cardType: "Credit",
    category: "Groceries",
    merchant: "Glomark",
    discount: "15% off",
    validDays: ["Fri"],
    conditions: "Friday flash. Bills above LKR 6,000.",
    url: "https://www.sampath.lk/cards/offers",
  },
  {
    bank: "NDB",
    cardType: "Credit",
    category: "Dining",
    merchant: "Cinnamon Grand restaurants",
    discount: "20% off à la carte",
    conditions: "Lunch and dinner. Excludes promotions.",
    url: "https://www.ndbbank.com/personal/cards/offers",
  },
  {
    bank: "Commercial Bank",
    cardType: "Both",
    category: "Dining",
    merchant: "Pizza Hut Sri Lanka",
    discount: "25% off",
    validDays: ["Mon", "Tue", "Wed"],
    conditions: "Dine-in & delivery. Order via app.",
    url: "https://www.combank.lk/cards/offers",
  },
  {
    bank: "HNB",
    cardType: "Credit",
    category: "Dining",
    merchant: "The Mango Tree",
    discount: "15% off",
    validDays: ["Thu", "Fri"],
    conditions: "Bills above LKR 8,000.",
    url: "https://www.hnb.net/cards-offers",
  },
  {
    bank: "Sampath",
    cardType: "Credit",
    category: "Pharmacy",
    merchant: "Healthguard Pharmacy",
    discount: "5% off",
    conditions: "All days. Excludes prescription items.",
    url: "https://www.sampath.lk/cards/offers",
  },
  {
    bank: "Commercial Bank",
    cardType: "Credit",
    category: "Online",
    merchant: "Daraz",
    discount: "Up to 18% off",
    validDays: ["Fri", "Sat", "Sun"],
    conditions: "Selected items. EMI options available.",
    url: "https://www.combank.lk/cards/offers",
  },
  {
    bank: "NDB",
    cardType: "Both",
    category: "Fuel",
    merchant: "Lanka IOC",
    discount: "2% cashback",
    conditions: "Per litre. Capped at LKR 1,500/month.",
    url: "https://www.ndbbank.com/personal/cards/offers",
  },
  {
    bank: "HNB",
    cardType: "Credit",
    category: "Travel",
    merchant: "SriLankan Airlines",
    discount: "0% interest, 12 months",
    conditions: "Min ticket value LKR 80,000.",
    url: "https://www.hnb.net/cards-offers",
  },
  {
    bank: "Sampath",
    cardType: "Credit",
    category: "Online",
    merchant: "Kapruka",
    discount: "10% off",
    validDays: ["Sun"],
    conditions: "Sunday only. Excludes electronics.",
    url: "https://www.sampath.lk/cards/offers",
  },
];
