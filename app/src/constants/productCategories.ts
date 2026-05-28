export const PRODUCT_CATEGORIES = [
  'men',
  'women',
  'kids',
  'towels',
  'socks',
  'thermals',
  'others',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const categoryLabel = (cat: string) =>
  cat.charAt(0).toUpperCase() + cat.slice(1);
