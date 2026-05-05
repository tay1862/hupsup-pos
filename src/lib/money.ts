/**
 * Money helpers for HupSup POS.
 *
 * Money is always passed around as **strings** (or `Decimal`-shaped numerics)
 * — never as JS numbers — so we don't lose precision in the front-end before
 * it lands in the `numeric(18,4)` columns. The helpers below normalise input
 * (user-typed numbers, DB numerics) and produce stringified results.
 *
 * Internally we work with `BigInt` integer-scaled values (×10000 = 4 decimal
 * places) for all arithmetic, so addition / subtraction / multiplication are
 * exact and no JS floating-point math touches the value. The boundary in
 * (numeric input, decimal string from DB) and out (string for display +
 * persistence) is the only place we serialise.
 */
const SCALE = BigInt(10_000);
const HALF_SCALE = BigInt(5_000);
const ZERO = BigInt(0);

const DEC = /^-?\d+(\.\d{1,4})?$/;
const ANY_DEC = /^-?\d+(\.\d+)?$/;

export function isValidDecimal(value: unknown): value is string {
  return typeof value === "string" && DEC.test(value);
}

/**
 * Parse a decimal string or integer-like number into a BigInt scaled by 10000.
 * Truncates fractional digits beyond the 4th place (the column precision).
 * Non-finite numbers and malformed strings parse to 0n.
 */
function parseScaled(value: string | number): bigint {
  const raw =
    typeof value === "number"
      ? Number.isFinite(value)
        ? // toString never uses exponent for the magnitudes we deal with
          // (LAK ≤ 10^12, qty ≤ 10^6) and avoids float artifacts for integers
          // and short fixed-point inputs typed by the cashier.
          value.toString()
        : "0"
      : value.trim();
  if (!ANY_DEC.test(raw)) return ZERO;
  const negative = raw.startsWith("-");
  const body = negative ? raw.slice(1) : raw;
  const [intPart, fracPart = ""] = body.split(".");
  const fracPadded = (fracPart + "0000").slice(0, 4);
  const scaled = BigInt(intPart) * SCALE + BigInt(fracPadded);
  return negative ? -scaled : scaled;
}

function scaledToString(scaled: bigint): string {
  const negative = scaled < ZERO;
  const abs = negative ? -scaled : scaled;
  const intPart = (abs / SCALE).toString();
  const fracDigits = (abs % SCALE)
    .toString()
    .padStart(4, "0")
    .replace(/0+$/, "");
  const sign = negative ? "-" : "";
  return fracDigits ? `${sign}${intPart}.${fracDigits}` : `${sign}${intPart}`;
}

/**
 * Round a value to 4 decimal places and return a string with no trailing
 * zeros beyond the meaningful digits. Accepts a string (preferred) or a
 * number; numeric input rounds half-away-from-zero at the 4th decimal.
 */
export function toMoneyString(value: number | string): string {
  return scaledToString(parseScaled(value));
}

/** Multiply two decimal values with banker's rounding to 4 decimals. */
export function multiply(a: string | number, b: string | number): string {
  const sa = parseScaled(a);
  const sb = parseScaled(b);
  // (a/SCALE) * (b/SCALE) = (a*b) / SCALE^2 → re-scale by /SCALE to get back
  // to "value × SCALE" representation, with half-away-from-zero rounding.
  const product = sa * sb;
  const negative = product < ZERO;
  const abs = negative ? -product : product;
  const rounded = (abs + HALF_SCALE) / SCALE;
  return scaledToString(negative ? -rounded : rounded);
}

export function add(a: string | number, b: string | number): string {
  return scaledToString(parseScaled(a) + parseScaled(b));
}

export function subtract(a: string | number, b: string | number): string {
  return scaledToString(parseScaled(a) - parseScaled(b));
}

export function compare(a: string | number, b: string | number): number {
  const diff = parseScaled(a) - parseScaled(b);
  if (diff > ZERO) return 1;
  if (diff < ZERO) return -1;
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
  if (srcCurrency === "LAK") return toMoneyString(amount);
  if (srcCurrency === "THB") return multiply(amount, thbToLak);
  return toMoneyString(amount);
}
