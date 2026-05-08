export const CATEGORY_PRIORITY = [
  "Politics",
  "Crypto",
  "Sports",
  "Finance",
  "Tech",
  "World",
  "Pop Culture",
  "Climate",
  "Science",
] as const;

export type Category = (typeof CATEGORY_PRIORITY)[number];

const SYNONYMS: Record<string, Category> = {
  Geopolitics: "World",
  Economy: "Finance",
  Economics: "Finance",
  Business: "Finance",
  Financials: "Finance",
  Stocks: "Finance",
  Markets: "Finance",
  Election: "Politics",
  Elections: "Politics",
  Bitcoin: "Crypto",
  Ethereum: "Crypto",
  "Climate and Weather": "Climate",
  "Science and Technology": "Tech",
  Entertainment: "Pop Culture",
};

export function pickCategory(tags: { label?: string }[] | undefined): string | null {
  if (!tags?.length) return null;
  const labels = new Set(
    tags
      .map((t) => t.label)
      .filter((l): l is string => Boolean(l))
      .map((l) => SYNONYMS[l] ?? l),
  );
  for (const cat of CATEGORY_PRIORITY) {
    if (labels.has(cat)) return cat;
  }
  return null;
}
