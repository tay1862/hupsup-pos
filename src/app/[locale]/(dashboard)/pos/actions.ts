"use server";

import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, transactionItems, transactions } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import { add, compare, multiply, subtract, toLak } from "@/lib/money";
import type { CheckoutSubmitState } from "./state";

// Money values arriving from the wire are always non-negative — discounts,
// tendered cash, and exchange rates have no business being negative. The
// regex enforces that on the server so a hand-crafted payload can't bypass
// the underpaid check by sending e.g. a negative paidLak.
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/);

const lineSchema = z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
});

const checkoutSchema = z.object({
  paymentMethod: z.enum([
    "CASH",
    "BCEL_QR",
    "LDB_QR",
    "JDB_QR",
    "BANK_TRANSFER",
    "OTHER",
  ]),
  paidLak: decimal,
  paidThb: decimal,
  exchangeRateThbToLak: decimal,
  discountLak: decimal,
  note: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  lines: z.array(lineSchema).min(1),
});

function generateReceiptNo(): string {
  const now = new Date();
  const y = now.getUTCFullYear().toString().slice(-2);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `R${y}${m}${d}-${rand}`;
}

export async function checkoutAction(
  payload: unknown,
): Promise<CheckoutSubmitState> {
  const session = await requireActiveSession();
  const branchId = session.branchId;
  if (!branchId) {
    return { status: "error", error: "internal" };
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", error: "invalid_input" };
  }
  const data = parsed.data;
  if (data.lines.length === 0) {
    return { status: "error", error: "empty_cart" };
  }

  const productIds = data.lines.map((l) => l.productId);
  const found = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      unitLabel: products.unitLabel,
      currency: products.currency,
      sellPrice: products.sellPrice,
    })
    .from(products)
    .where(
      and(eq(products.orgId, session.orgId), inArray(products.id, productIds)),
    );

  const byId = new Map(found.map((p) => [p.id, p]));
  if (byId.size !== new Set(productIds).size) {
    return { status: "error", error: "invalid_input" };
  }

  const itemRows = data.lines.map((line, index) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error("product missing after validation");
    const unitPriceLak = toLak(
      product.sellPrice,
      product.currency,
      data.exchangeRateThbToLak,
    );
    const lineTotalLak = multiply(unitPriceLak, line.qty.toString());
    return {
      sortOrder: index,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitLabel: product.unitLabel,
      qty: line.qty.toString(),
      unitPriceLak,
      lineTotalLak,
    };
  });

  const subtotalLak = itemRows.reduce(
    (acc, row) => add(acc, row.lineTotalLak),
    "0",
  );
  // Clamp total to zero when discount exceeds subtotal — mirrors the client
  // (`pos-shell.tsx`) so the receipt and changeLak stay coherent. Without
  // this, a discount > subtotal stores a negative total and inflates change.
  const totalLakRaw = subtract(subtotalLak, data.discountLak);
  const totalLak = compare(totalLakRaw, "0") < 0 ? "0" : totalLakRaw;
  const tenderedLak = add(
    data.paidLak,
    multiply(data.paidThb, data.exchangeRateThbToLak),
  );
  if (compare(tenderedLak, totalLak) < 0) {
    return { status: "error", error: "underpaid" };
  }
  const changeLak = subtract(tenderedLak, totalLak);

  const receiptNo = generateReceiptNo();

  let transactionId: string;
  try {
    transactionId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(transactions)
        .values({
          orgId: session.orgId,
          branchId,
          cashierId: session.userId,
          receiptNo,
          status: "COMPLETED",
          paymentMethod: data.paymentMethod,
          subtotalLak,
          discountLak: data.discountLak,
          totalLak,
          paidLak: data.paidLak,
          paidThb: data.paidThb,
          exchangeRateThbToLak: data.exchangeRateThbToLak,
          changeLak,
          note: data.note ?? null,
        })
        .returning({ id: transactions.id });
      const newId = row.id;

      await tx.insert(transactionItems).values(
        itemRows.map((item) => ({
          transactionId: newId,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          unitLabel: item.unitLabel,
          qty: item.qty,
          unitPriceLak: item.unitPriceLak,
          lineTotalLak: item.lineTotalLak,
          sortOrder: item.sortOrder,
        })),
      );
      return newId;
    });
  } catch (err) {
    console.error("[pos.checkout] failed", err);
    return { status: "error", error: "internal" };
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  return {
    status: "success",
    receiptUrl: `/pos/receipt/${transactionId}`,
  };
}
