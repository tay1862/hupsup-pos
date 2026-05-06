import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  const tApp = await getTranslations("App");
  const tNav = await getTranslations("Nav");

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <span className="text-lg font-semibold">{tApp("name")}</span>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-foreground/70 hover:text-foreground hidden text-sm sm:inline"
            >
              {tNav("signIn")}
            </Link>
            <Link
              href="/register"
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              {tNav("register")}
            </Link>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="text-foreground/70 max-w-2xl text-base sm:text-lg">
          {t("heroSubtitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="bg-foreground text-background rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            {t("ctaPrimary")}
          </Link>
          <a
            href="#features"
            className="border-foreground/20 hover:bg-foreground/5 rounded-md border px-5 py-2.5 text-sm font-medium"
          >
            {t("ctaSecondary")}
          </a>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4"
      >
        {(["offline", "multiCurrency", "verticals", "selfHost"] as const).map(
          (key) => (
            <article
              key={key}
              className="border-foreground/10 rounded-lg border p-5"
            >
              <h3 className="mb-2 text-base font-semibold">
                {t(`features.${key}.title`)}
              </h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                {t(`features.${key}.desc`)}
              </p>
            </article>
          ),
        )}
      </section>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="text-foreground/60 mx-auto max-w-6xl px-6 py-6 text-sm">
          © {new Date().getFullYear()} HupSup POS
        </div>
      </footer>
    </main>
  );
}
