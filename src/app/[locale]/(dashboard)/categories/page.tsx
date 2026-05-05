import { setRequestLocale, getTranslations } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./category-row";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Catalog.categories");
  const session = await requireActiveSession();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.orgId, session.orgId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <p className="text-foreground/60 px-6 py-8 text-sm">
                {t("empty")}
              </p>
            ) : (
              <ul className="divide-foreground/10 divide-y">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-3 px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.name}</p>
                      {row.description ? (
                        <p className="text-foreground/60 text-xs">
                          {row.description}
                        </p>
                      ) : null}
                    </div>
                    <DeleteCategoryButton id={row.id} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("addTitle")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardBody>
            <CategoryForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
