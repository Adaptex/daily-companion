export const OFFER_CATEGORIES = [
  "Supermarket",
  "Dining",
  "Pharmacy",
  "Fuel",
  "Travel",
  "Online",
  "Health",
  "Education",
  "Insurance",
  "Shopping",
  "Entertainment",
  "Other",
] as const;

export type OfferCategory = (typeof OFFER_CATEGORIES)[number];

export type OfferCategoryConfidence = "high" | "medium" | "low";

export type OfferClassificationInput = {
  bank?: string;
  merchant?: string;
  category?: string;
  discount?: string;
  conditions?: string;
  url?: string;
};

export type OfferClassification = {
  category: OfferCategory;
  rawCategory: string;
  categoryConfidence: OfferCategoryConfidence;
  categoryReason: string;
  categorySignals: string[];
};

type Rule = {
  category: OfferCategory;
  source: "raw" | "merchant" | "conditions" | "combined";
  terms: string[];
  weight: number;
  reason: string;
};

const RAW_CATEGORY_ALIASES: Record<string, OfferCategory> = {
  groceries: "Supermarket",
  supermarket: "Supermarket",
  "online shopping": "Online",
  online: "Online",
  dining: "Dining",
  pharmacy: "Pharmacy",
  fuel: "Fuel",
  travel: "Travel",
  health: "Health",
  healthcare: "Health",
  education: "Education",
  educational: "Education",
  insurance: "Insurance",
  assurance: "Insurance",
  takaful: "Insurance",
  shopping: "Shopping",
  "fashion jewellery": "Shopping",
  "fashion and jewellery": "Shopping",
  "fashion & jewellery": "Shopping",
  clothing: "Shopping",
  apparel: "Shopping",
  garment: "Shopping",
  garments: "Shopping",
  textile: "Shopping",
  textiles: "Shopping",
  entertainment: "Entertainment",
  leisure: "Entertainment",
  lifestyle: "Shopping",
  automobile: "Fuel",
  other: "Other",
};

const RULES: Rule[] = [
  {
    category: "Supermarket",
    source: "merchant",
    terms: [
      "supermarket",
      "grocery",
      "grocer",
      "food city",
      "keells",
      "glomark",
      "cargills",
      "spar",
      "laugfs",
      "arpico",
      "coop",
    ],
    weight: 1.7,
    reason: "merchant matches a supermarket chain or grocery term",
  },
  {
    category: "Supermarket",
    source: "conditions",
    terms: [
      "supermarket",
      "grocery",
      "grocer",
      "food city",
      "keells",
      "glomark",
      "cargills",
      "spar",
      "laugfs",
      "arpico",
      "coop",
    ],
    weight: 1.2,
    reason: "conditions mention a supermarket chain or grocery term",
  },
  {
    category: "Pharmacy",
    source: "combined",
    terms: ["pharmacy", "pharma", "chemist", "medicine", "drug"],
    weight: 1.6,
    reason: "offer text mentions a pharmacy or medicine signal",
  },
  {
    category: "Dining",
    source: "combined",
    terms: [
      "restaurant",
      "cafe",
      "cafe ",
      "coffee",
      "dine",
      "dining",
      "buffet",
      "bistro",
      "lounge",
      "bar",
      "brunch",
      "lunch",
      "dinner",
      "pizza",
      "burger",
      "eatery",
      "food court",
      "takeaway",
    ],
    weight: 1.45,
    reason: "offer text looks like a dining promotion",
  },
  {
    category: "Travel",
    source: "combined",
    terms: [
      "travel",
      "tour",
      "tourism",
      "hotel",
      "resort",
      "beach",
      "booking",
      "room booking",
      "room bookings",
      "accommodation",
      "stay",
      "stay at",
      "bed and breakfast",
      "half board",
      "full board",
      "reservation",
      "reservations",
      "airline",
      "airways",
      "flight",
      "vacation",
      "holiday",
      "cruise",
      "leisure",
      "villa",
      "villas",
      "safari",
      "retreat",
      "lodge",
      "inn",
      "boutique",
      "camp",
      "bungalow",
      "hill",
      "rock",
      "kanda",
      "visa destination",
      "guest house",
      "oak ray",
      "araliya",
      "fitsair",
      "qatar airways",
      "escapes",
      "duty free",
      "dufry",
      "glenrock",
      "walawwa",
      "marriott",
      "crazy jets",
      "foreign currency",
      "visa concierge",
      "concierge program",
      "attractions",
      "korea",
      "hong kong",
      "malaysia",
    ],
    weight: 1.45,
    reason: "offer text looks like a travel promotion",
  },
  {
    category: "Education",
    source: "combined",
    terms: [
      "academy",
      "campus",
      "school",
      "college",
      "institute",
      "university",
      "education",
      "educational",
      "course",
      "courses",
      "tuition",
      "training",
      "student",
      "academic",
      "slim",
      "icbt",
      "acbt",
      "sliit",
      "iit",
      "anc",
      "cima",
      "acca",
      "british council",
      "bristol institute",
      "bms campus",
      "next campus",
      "achievers international campus",
      "colombo international campus",
      "myfees",
      "cgpsl",
      "talkative parents",
      "siem",
    ],
    weight: 1.55,
    reason: "offer text looks like an education or training promotion",
  },
  {
    category: "Insurance",
    source: "combined",
    terms: [
      "insurance",
      "assurance",
      "takaful",
      "policy",
      "policies",
      "premium",
      "insurer",
      "insurance payments",
      "aia",
      "slic",
      "ceylinco",
      "janashakthi",
      "fairfirst",
      "allianz",
      "sanasa",
      "orient",
      "mbsl",
      "continental",
      "lolc",
      "union assurance",
      "amana takaful",
      "insureme",
    ],
    weight: 1.55,
    reason: "offer text looks like an insurance promotion",
  },
  {
    category: "Health",
    source: "combined",
    terms: [
      "health",
      "healthcare",
      "hospital",
      "clinic",
      "medical",
      "wellness",
      "spa",
      "dental",
      "dentist",
      "optical",
      "vision",
      "hearing",
      "sunglass",
      "sunglasses",
      "spectacle",
      "lab",
      "doctor",
      "biodent",
      "joseph fraser",
    ],
    weight: 1.35,
    reason: "offer text looks like a health promotion",
  },
  {
    category: "Fuel",
    source: "combined",
    terms: [
      "fuel",
      "petrol",
      "diesel",
      "gas station",
      "service station",
      "garage",
      "tyre",
      "auto",
      "automobile",
      "motor",
    ],
    weight: 1.35,
    reason: "offer text looks like a fuel or vehicle promotion",
  },
  {
    category: "Online",
    source: "combined",
    terms: ["online", "ecommerce", "e commerce", "web", "app", "digital", "marketplace", "pickme", "pickme pass", "dhl"],
    weight: 1.35,
    reason: "offer text looks like an online promotion",
  },
  {
    category: "Shopping",
    source: "combined",
    terms: [
      "shopping",
      "retail",
      "store",
      "mall",
      "fashion",
      "jewellery",
      "jewelry",
      "jeweller",
      "jewellers",
      "jeweler",
      "jewelers",
      "electronics",
      "appliance",
      "furniture",
      "home",
      "merchant",
      "department",
      "stationery",
      "hardware",
      "bookshop",
      "book shop",
      "book centre",
      "book center",
      "solar",
      "showroom",
      "showrooms",
      "bikes",
      "bike",
      "outdoor",
      "stereo",
      "stereos",
      "lubricant",
      "lubricants",
      "energy",
      "technology",
      "technologies",
      "toy mart",
      "power world",
      "be dapper",
      "be desi",
      "energywise",
      "wimaladharma",
      "tudo.lk",
      "chatham luxury watches",
      "fhiit",
      "futureworld",
      "future world",
      "global vinyl",
      "suyamas",
      "e rosha",
      "cworks",
      "custom wheels",
      "watches",
      "wheels",
      "traders",
      "atlas",
      "axillia",
      "sarasavi",
      "singer",
      "damro",
      "abans",
      "softlogic",
      "celltronics",
      "singhagiri",
      "riotop",
      "kids club",
      "seetha holdings",
      "singapore center",
      "dinapala",
      "dinapala group",
      "codegen sustainable solutions",
      "sunrise asia tech",
      "puwakaramba",
      "m d gunasena",
      "md gunasena",
      "semage",
      "semage co",
      "namal balachandra",
      "queen kuweni",
      "hemas consumer brands",
      "clothing",
      "apparel",
      "garment",
      "garments",
      "textile",
      "textiles",
    ],
    weight: 1.2,
    reason: "offer text looks like a retail or shopping promotion",
  },
  {
    category: "Entertainment",
    source: "combined",
    terms: ["entertainment", "movie", "cinema", "theatre", "concert", "gaming", "event", "amusement", "sport", "sports", "rugby", "football"],
    weight: 1.2,
    reason: "offer text looks like entertainment",
  },
];

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(text: string, term: string): boolean {
  if (!text || !term) return false;
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\s)${escaped}(?:s|es)?(?:$|\\s)`);
  return pattern.test(text);
}

function applyRule(text: string, rule: Rule): boolean {
  return rule.terms.some((term) => hasTerm(text, normalizeText(term)));
}

function confidenceFromScores(
  topScore: number,
  secondScore: number,
  matchedRawCategory: boolean,
): OfferCategoryConfidence {
  if (topScore >= 2.2 && (topScore - secondScore >= 0.7 || matchedRawCategory)) {
    return "high";
  }
  if (topScore >= 1.2) return "medium";
  return "low";
}

export function classifyOfferCategory(input: OfferClassificationInput): OfferClassification {
  const rawCategory = (input.category ?? "Other").trim();
  const rawCategoryKey = normalizeText(rawCategory);
  const merchantText = normalizeText(input.merchant);
  const detailText = normalizeText([input.discount, input.conditions].filter(Boolean).join(" "));
  const combinedText = normalizeText([input.bank, input.merchant, input.discount, input.conditions, input.url].filter(Boolean).join(" "));

  const scores = new Map<OfferCategory, number>();
  const signalsByCategory = new Map<OfferCategory, string[]>();

  const addScore = (category: OfferCategory, weight: number, signal: string): void => {
    scores.set(category, (scores.get(category) ?? 0) + weight);
    const existing = signalsByCategory.get(category) ?? [];
    if (!existing.includes(signal)) {
      signalsByCategory.set(category, [...existing, signal]);
    }
  };

  const aliasCategory = RAW_CATEGORY_ALIASES[rawCategoryKey];
  if (aliasCategory && aliasCategory !== "Other") {
    addScore(aliasCategory, 0.8, `raw category "${rawCategory}" -> ${aliasCategory}`);
  }

  for (const rule of RULES) {
    const sourceText =
      rule.source === "raw"
        ? rawCategoryKey
        : rule.source === "merchant"
          ? merchantText
          : rule.source === "conditions"
            ? detailText
            : combinedText;

    if (applyRule(sourceText, rule)) {
      addScore(rule.category, rule.weight, rule.reason);
    }
  }

  // A supermarket merchant should stay a supermarket even if a bank labels it as groceries.
  if (rawCategoryKey === "groceries" || rawCategoryKey === "supermarket") {
    addScore("Supermarket", 0.45, `bank label normalized from ${rawCategory}`);
  }

  if (scores.size === 0) {
    addScore(aliasCategory ?? "Other", 0.1, `fallback category "${rawCategory || "Other"}"`);
  }

  const ranking = Array.from(scores.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return OFFER_CATEGORIES.indexOf(a[0]) - OFFER_CATEGORIES.indexOf(b[0]);
  });

  const [category, topScore] = ranking[0];
  const secondScore = ranking[1]?.[1] ?? 0;
  const matchedRawCategory = Boolean(aliasCategory) && aliasCategory === category;
  const confidence = confidenceFromScores(topScore, secondScore, matchedRawCategory);
  const categorySignals = signalsByCategory.get(category) ?? [];
  const reason = categorySignals.slice(0, 3).join("; ");

  return {
    category,
    rawCategory,
    categoryConfidence: confidence,
    categoryReason: reason,
    categorySignals,
  };
}
