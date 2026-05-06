import { setRequestLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { db } from "@/db";
import { branches, organizations } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tApp = await getTranslations("App");
  const session = await requireActiveSession();
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  const branch = session.branchId
    ? (
        await db
          .select({ name: branches.name })
          .from(branches)
          .where(eq(branches.id, session.branchId))
          .limit(1)
      )[0]
    : undefined;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-foreground/10 border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-base font-semibold">
              {tApp("name")}
            </Link>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/70 text-sm">
              {org?.name ?? "—"}
              {branch?.name ? ` · ${branch.name}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <DashboardNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

async function DashboardNav() {
  const t = await getTranslations("Dashboard");
  const items = [
    { href: "/dashboard", label: t("navOverview") },
    { href: "/products", label: t("navProducts") },
    { href: "/categories", label: t("navCategories") },
    { href: "/pos", label: t("navPos") },
    { href: "/reports", label: t("navReports") },
    { href: "/settings", label: t("navSettings") },
  ];
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-foreground/80 hover:bg-foreground/5 rounded-md px-3 py-2"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
