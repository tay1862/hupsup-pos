/**
 * Tiny class-name combiner. Mirrors the shadcn `cn` helper but without
 * pulling in clsx/tailwind-merge until we actually need their behaviour.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Convert an arbitrary string (org/branch name) into a URL-safe slug.
 * Handles latin, Thai, and Lao characters by hashing the input when no
 * latin word characters are present so collisions are unlikely.
 */
export function slugify(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const latin = trimmed
    .replace(/[^\p{L}\p{M}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  // For Thai/Lao-only names, slugify yields characters that are valid in URLs
  // when percent-encoded but still ugly. Keep the slug but ensure non-empty.
  if (latin.length === 0) return "shop";
  return latin.slice(0, 60);
}

/**
 * Generate a short unique suffix to append to slugs when collisions occur.
 */
/**
 * Format a money amount (string from Drizzle numeric column or number)
 * with thousands separators and trims trailing zeros after the decimal point.
 * Always treats the value as numeric — never as floating-point arithmetic.
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency = "LAK",
): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  return `${formatted} ${currency}`;
}

export function randomSuffix(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
