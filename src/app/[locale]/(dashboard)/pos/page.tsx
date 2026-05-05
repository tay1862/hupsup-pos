import { setRequestLocale, getTranslations } from "next-intl/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { PosShell } from "./pos-shell";
import type { PosProduct } from "./types";

export default async function PosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pos");
  const session = await requireActiveSession();

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      unitLabel: products.unitLabel,
      currency: products.currency,
      sellPrice: products.sellPrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      trackStock: products.trackStock,
      stockOnHand: products.stockOnHand,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.orgId, session.orgId), eq(products.isActive, true)))
    .orderBy(asc(products.name));

  const list: PosProduct[] = rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    unitLabel: r.unitLabel,
    currency: r.currency,
    sellPrice: r.sellPrice,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    trackStock: r.trackStock,
    stockOnHand: r.stockOnHand,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60 mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <PosShell products={list} defaultExchangeRate="450" />
    </div>
  );
}
