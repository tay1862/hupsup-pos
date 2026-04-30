"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const [isPending, startTransition] = useTransition();

  return (
    <label className="text-foreground/70 inline-flex items-center gap-2 text-sm">
      <span className="sr-only sm:not-sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
        className="bg-background border-foreground/20 rounded-md border px-2 py-1 text-sm"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
