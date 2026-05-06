"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import type { ProductFormState } from "./state";

const decimalString = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d{1,4})?$/, "must be a number with up to 4 decimals");

const baseSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  barcode: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  name: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  unitLabel: z.string().trim().min(1).max(32),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/),
  costPrice: decimalString,
  sellPrice: decimalString,
  trackStock: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  stockOnHand: decimalString,
  isActive: z.preprocess((v) => v === "on" || v === true, z.boolean()),
});

function parseFormData(formData: FormData) {
  return baseSchema.safeParse({
    sku: formData.get("sku"),
    barcode: formData.get("barcode") ?? "",
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    unitLabel: formData.get("unitLabel"),
    currency: formData.get("currency"),
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    trackStock: formData.get("trackStock"),
    stockOnHand: formData.get("stockOnHand") ?? "0",
    isActive: formData.get("isActive"),
  });
}

function validationStateFromError(
  error: z.ZodError<z.infer<typeof baseSchema>>,
): ProductFormState {
  const fieldErrors: ProductFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      fieldErrors[key as keyof NonNullable<ProductFormState["fieldErrors"]>] =
        issue.message;
    }
  }
  return { error: "invalid_input", fieldErrors };
}

async function ensureCategoryInOrg(
  orgId: string,
  categoryId: string | undefined,
) {
  if (!categoryId) return null;
  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.orgId, orgId)))
    .limit(1);
  return cat?.id ?? null;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireActiveSession();
  const parsed = parseFormData(formData);
  if (!parsed.success) return validationStateFromError(parsed.error);
  const data = parsed.data;

  const [skuClash] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.orgId, session.orgId), eq(products.sku, data.sku)))
    .limit(1);
  if (skuClash) return { error: "sku_taken" };

  if (data.barcode) {
    const [barClash] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.orgId, session.orgId),
          eq(products.barcode, data.barcode),
        ),
      )
      .limit(1);
    if (barClash) return { error: "barcode_taken" };
  }

  const categoryId = await ensureCategoryInOrg(session.orgId, data.categoryId);

  try {
    await db.insert(products).values({
      orgId: session.orgId,
      categoryId,
      sku: data.sku,
      barcode: data.barcode ?? null,
      name: data.name,
      description: data.description ?? null,
      unitLabel: data.unitLabel,
      currency: data.currency,
      costPrice: data.costPrice,
      sellPrice: data.sellPrice,
      trackStock: data.trackStock,
      stockOnHand: data.stockOnHand,
      isActive: data.isActive,
    });
  } catch (err) {
    console.error("[products.create] failed", err);
    return { error: "internal" };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireActiveSession();
  const parsed = parseFormData(formData);
  if (!parsed.success) return validationStateFromError(parsed.error);
  const data = parsed.data;

  const [current] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.orgId, session.orgId)))
    .limit(1);
  if (!current) return { error: "not_found" };

  const [skuClash] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.orgId, session.orgId),
        eq(products.sku, data.sku),
        ne(products.id, productId),
      ),
    )
    .limit(1);
  if (skuClash) return { error: "sku_taken" };

  if (data.barcode) {
    const [barClash] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.orgId, session.orgId),
          eq(products.barcode, data.barcode),
          ne(products.id, productId),
        ),
      )
      .limit(1);
    if (barClash) return { error: "barcode_taken" };
  }

  const categoryId = await ensureCategoryInOrg(session.orgId, data.categoryId);

  try {
    await db
      .update(products)
      .set({
        categoryId,
        sku: data.sku,
        barcode: data.barcode ?? null,
        name: data.name,
        description: data.description ?? null,
        unitLabel: data.unitLabel,
        currency: data.currency,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        trackStock: data.trackStock,
        stockOnHand: data.stockOnHand,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(eq(products.id, productId), eq(products.orgId, session.orgId)),
      );
  } catch (err) {
    console.error("[products.update] failed", err);
    return { error: "internal" };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
  redirect("/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const session = await requireActiveSession();
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.orgId, session.orgId)));

  revalidatePath("/products");
}
