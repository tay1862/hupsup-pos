import { setRequestLocale, getTranslations } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, organizations } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { newProductDefaults } from "../state";
import { createProductAction } from "../actions";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Catalog.products.form");
  const session = await requireActiveSession();

  const [org] = await db
    .select({ baseCurrency: organizations.baseCurrency })
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.orgId, session.orgId))
    .orderBy(asc(categories.name));

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
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <ProductForm
            mode="create"
            action={createProductAction}
            categories={cats}
            defaults={newProductDefaults(org?.baseCurrency ?? "LAK")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
