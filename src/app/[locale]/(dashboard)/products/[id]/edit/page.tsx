import { setRequestLocale, getTranslations } from "next-intl/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "../../actions";
import type { ProductFormDefaults, ProductFormState } from "../../state";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Catalog.products.form");
  const session = await requireActiveSession();

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.orgId, session.orgId)))
    .limit(1);

  if (!product) notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.orgId, session.orgId))
    .orderBy(asc(categories.name));

  const defaults: ProductFormDefaults = {
    sku: product.sku,
    barcode: product.barcode ?? "",
    name: product.name,
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    unitLabel: product.unitLabel,
    currency: product.currency,
    costPrice: product.costPrice,
    sellPrice: product.sellPrice,
    trackStock: product.trackStock,
    stockOnHand: product.stockOnHand,
    isActive: product.isActive,
  };

  const boundAction = async (
    prev: ProductFormState,
    formData: FormData,
  ): Promise<ProductFormState> => {
    "use server";
    return updateProductAction(id, prev, formData);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/products"
        className="text-foreground/60 hover:text-foreground text-sm"
      >
        {t("back")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <ProductForm
            mode="edit"
            action={boundAction}
            categories={cats}
            defaults={defaults}
          />
        </CardBody>
      </Card>
    </div>
  );
}
