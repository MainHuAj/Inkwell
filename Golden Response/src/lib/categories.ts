// Fixed, curated set of categories. Authors pick exactly one when publishing.
// Edit this list and re-run the seed to change the available categories.
export const CATEGORIES = [
  { name: "Tech", slug: "tech" },
  { name: "Life", slug: "life" },
  { name: "Culture", slug: "culture" },
  { name: "Science", slug: "science" },
  { name: "Business", slug: "business" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
