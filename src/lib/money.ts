/**
 * Money helpers for HupSup POS.
 *
 * Money is always passed around as **strings** (or `Decimal`-shaped numerics)
 * — never as JS numbers — so we don't lose precision in the front-end before
 * it lands in the `numeric(18,4)` columns. The helpers below normalise input
 * (user-typed numbers, DB numerics) and produce stringified results.
 *
 * NOTE: `Number(value)` is used for arithmetic only when adding/multiplying
 * already-validated decimal strings whose magnitude fits safely inside
 * Number.MAX_SAFE_INTEGER (i.e. up to ~9 × 10^15 cents). For Phase 1 POS
 * receipts (a few hundred items, prices in LAK up to 10^9) this is more than
 * safe; if we later need higher precision we can swap in `decimal.js`.
 */

const DEC = /^-?\d+(\.\d{1,4})?$/;

export function isValidDecimal(value: unknown): value is string {
  return typeof value === "string" && DEC.test(value);
}

/**
 * Round a number to 4 decimal places using banker-safe arithmetic
 * (multiply, round, divide) and return a string with no trailing zeros
 * beyond the meaningful digits.
 */
export function toMoneyString(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const scaled = Math.round(value * 10_000);
  const sign = scaled < 0 ? "-" : "";
  const abs = Math.abs(scaled);
  const intPart = Math.trunc(abs / 10_000).toString();
  const fracPart = (abs % 10_000)
    .toString()
    .padStart(4, "0")
    .replace(/0+$/, "");
  return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
}

export function multiply(a: string | number, b: string | number): string {
  return toMoneyString(Number(a) * Number(b));
}

export function add(a: string | number, b: string | number): string {
  return toMoneyString(Number(a) + Number(b));
}

export function subtract(a: string | number, b: string | number): string {
  return toMoneyString(Number(a) - Number(b));
}

export function compare(a: string | number, b: string | number): number {
  const diff = Number(a) - Number(b);
  if (diff > 0) return 1;
  if (diff < 0) return -1;
  return 0;
}

export function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * Convert a price expressed in `srcCurrency` into the equivalent LAK amount
 * using the per-bill rate (1 THB = X LAK). Other currencies (e.g. USD) fall
 * back to a 1:1 mapping for now and will need their own rate column in a
 * later sprint. LAK input is returned unchanged.
 */
export function toLak(
  amount: string | number,
  srcCurrency: string,
  thbToLak: string | number,
): string {
  if (srcCurrency === "LAK") return toMoneyString(Number(amount));
  if (srcCurrency === "THB")
    return toMoneyString(Number(amount) * Number(thbToLak));
  // USD or anything else — treat the rate as already-LAK for now.
  return toMoneyString(Number(amount));
}
