import { setRequestLocale, getTranslations } from "next-intl/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  branches,
  organizations,
  transactionItems,
  transactions,
  users,
} from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Receipt");
  const session = await requireActiveSession();

  const [tx] = await db
    .select({
      id: transactions.id,
      receiptNo: transactions.receiptNo,
      status: transactions.status,
      paymentMethod: transactions.paymentMethod,
      subtotalLak: transactions.subtotalLak,
      discountLak: transactions.discountLak,
      totalLak: transactions.totalLak,
      paidLak: transactions.paidLak,
      paidThb: transactions.paidThb,
      exchangeRateThbToLak: transactions.exchangeRateThbToLak,
      changeLak: transactions.changeLak,
      note: transactions.note,
      createdAt: transactions.createdAt,
      orgName: organizations.name,
      branchName: branches.name,
      cashierName: users.name,
    })
    .from(transactions)
    .leftJoin(organizations, eq(transactions.orgId, organizations.id))
    .leftJoin(branches, eq(transactions.branchId, branches.id))
    .leftJoin(users, eq(transactions.cashierId, users.id))
    .where(and(eq(transactions.id, id), eq(transactions.orgId, session.orgId)))
    .limit(1);

  if (!tx) notFound();

  const items = await db
    .select({
      sku: transactionItems.sku,
      name: transactionItems.name,
      unitLabel: transactionItems.unitLabel,
      qty: transactionItems.qty,
      unitPriceLak: transactionItems.unitPriceLak,
      lineTotalLak: transactionItems.lineTotalLak,
    })
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, tx.id))
    .orderBy(asc(transactionItems.sortOrder));

  const tPm = await getTranslations("Pos.paymentMethods");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 print:max-w-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/pos"
          className="text-foreground/60 hover:text-foreground text-sm"
        >
          {t("backToPos")}
        </Link>
        <PrintButton label={t("print")} />
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardBody className="space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold">{tx.orgName}</h1>
            <p className="text-foreground/70 text-sm">{tx.branchName}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-foreground/60 text-xs">{t("receiptNo")}</p>
              <p className="font-mono">{tx.receiptNo}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground/60 text-xs">{t("date")}</p>
              <p>{tx.createdAt.toLocaleString(locale)}</p>
            </div>
            <div>
              <p className="text-foreground/60 text-xs">{t("cashier")}</p>
              <p>{tx.cashierName ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground/60 text-xs">{t("paymentMethod")}</p>
              <p>{tPm(tx.paymentMethod)}</p>
            </div>
          </div>

          <div className="border-foreground/20 border-t pt-3">
            <table className="w-full text-sm">
              <thead className="text-foreground/60 text-left text-xs uppercase">
                <tr>
                  <th className="pb-2 font-medium">{t("item")}</th>
                  <th className="pb-2 text-right font-medium">{t("qty")}</th>
                  <th className="pb-2 text-right font-medium">{t("price")}</th>
                  <th className="pb-2 text-right font-medium">{t("line")}</th>
                </tr>
              </thead>
              <tbody className="divide-foreground/10 divide-y">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5">
                      <p className="font-medium">{it.name}</p>
                      <p className="text-foreground/60 text-xs">
                        {it.sku} · {it.unitLabel}
                      </p>
                    </td>
                    <td className="py-1.5 text-right">{it.qty}</td>
                    <td className="py-1.5 text-right">
                      {formatMoney(it.unitPriceLak, "LAK")}
                    </td>
                    <td className="py-1.5 text-right">
                      {formatMoney(it.lineTotalLak, "LAK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-foreground/20 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("subtotal")}</span>
              <span>{formatMoney(tx.subtotalLak, "LAK")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("discount")}</span>
              <span>−{formatMoney(tx.discountLak, "LAK")}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>{t("total")}</span>
              <span>{formatMoney(tx.totalLak, "LAK")}</span>
            </div>
          </div>

          <div className="border-foreground/20 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("paidLak")}</span>
              <span>{formatMoney(tx.paidLak, "LAK")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("paidThb")}</span>
              <span>
                {formatMoney(tx.paidThb, "THB")}{" "}
                <span className="text-foreground/60 text-xs">
                  @ {tx.exchangeRateThbToLak}
                </span>
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("change")}</span>
              <span>{formatMoney(tx.changeLak, "LAK")}</span>
            </div>
          </div>

          {tx.note ? (
            <p className="text-foreground/60 border-foreground/20 border-t pt-3 text-xs">
              {t("note")}: {tx.note}
            </p>
          ) : null}

          <p className="text-foreground/50 pt-2 text-center text-xs">
            {t("thankYou")}
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2 print:hidden">
        <Link href="/pos">
          <Button variant="primary">{t("newSale")}</Button>
        </Link>
      </div>
    </div>
  );
}
