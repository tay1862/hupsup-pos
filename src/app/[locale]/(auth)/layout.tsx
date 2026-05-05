import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-foreground/10 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            HupSup POS
          </Link>
          <LocaleSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
