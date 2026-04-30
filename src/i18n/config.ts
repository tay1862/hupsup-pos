/**
 * Centralized i18n configuration. Edit this to add languages.
 */

export const locales = ["th", "lo", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "th";

export const localeLabels: Record<Locale, string> = {
  th: "ไทย",
  lo: "ລາວ",
  en: "English",
};
