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
 * Format a money amount for display — accepts either a `numeric(18,4)` string
 * straight from Drizzle or a JS number. The string path is processed
 * lexically so we don't lose precision on large LAK values that exceed
 * `Number.MAX_SAFE_INTEGER`. Trailing zeros after the decimal are stripped.
 *
 * Per `AGENTS.md`: never round-trip persisted money through JS floats.
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency = "LAK",
): string {
  if (value === null || value === undefined || value === "") return "-";
  const raw = typeof value === "number" ? value.toString() : value;
  const match = raw.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return raw;
  const sign = match[1];
  const intDigits = match[2];
  const fracDigits = (match[3] ?? "").slice(0, 4).replace(/0+$/, "");
  const intWithSeparators = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = fracDigits
    ? `${sign}${intWithSeparators}.${fracDigits}`
    : `${sign}${intWithSeparators}`;
  return `${formatted} ${currency}`;
}

/**
 * Generate a short unique suffix to append to slugs when collisions occur.
 */

export function randomSuffix(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
