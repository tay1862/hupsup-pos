import { setRequestLocale, getTranslations } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Catalog.products");
  const session = await requireActiveSession();

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      sellPrice: products.sellPrice,
      currency: products.currency,
      stockOnHand: products.stockOnHand,
      trackStock: products.trackStock,
      isActive: products.isActive,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.orgId, session.orgId))
    .orderBy(asc(products.name));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Link href="/products/new">
          <Button>{t("addButton")}</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <p className="text-foreground/60 px-6 py-10 text-center text-sm">
              {t("empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-foreground/10 text-foreground/60 border-b text-left text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {t("columns.sku")}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {t("columns.name")}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {t("columns.category")}
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      {t("columns.sellPrice")}
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      {t("columns.stock")}
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      {t("columns.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-foreground/10 divide-y">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-3 font-mono text-xs">{row.sku}</td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            row.isActive
                              ? ""
                              : "text-foreground/40 line-through"
                          }
                        >
                          {row.name}
                        </span>
                      </td>
                      <td className="text-foreground/70 px-6 py-3">
                        {row.categoryName ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatMoney(row.sellPrice, row.currency)}
                      </td>
                      <td className="text-foreground/70 px-6 py-3 text-right">
                        {row.trackStock ? row.stockOnHand : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <Link
                            href={`/products/${row.id}/edit`}
                            className="hover:underline"
                          >
                            {t("actions.edit")}
                          </Link>
                          <DeleteProductButton id={row.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
