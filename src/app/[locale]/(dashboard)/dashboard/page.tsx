import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, organizations } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const session = await requireActiveSession();

  const [org] = await db
    .select({
      name: organizations.name,
      baseCurrency: organizations.baseCurrency,
    })
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  const branch = session.branchId
    ? (
        await db
          .select({ name: branches.name, code: branches.code })
          .from(branches)
          .where(eq(branches.id, session.branchId))
          .limit(1)
      )[0]
    : undefined;

  const roleLabel = t(`roles.${session.role}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("welcome", { name: session.name ?? "" })}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("orgLabel")}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-base font-medium">{org?.name ?? "—"}</p>
            <p className="text-foreground/60 text-xs">
              {org?.baseCurrency ?? ""}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("branchLabel")}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-base font-medium">{branch?.name ?? "—"}</p>
            <p className="text-foreground/60 text-xs">{branch?.code ?? ""}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("roleLabel")}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-base font-medium">{roleLabel}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <p className="text-foreground/70 text-sm">{t("comingSoon")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
