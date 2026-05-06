"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireActiveSession } from "@/lib/session";
import type { CategoryFormState } from "./state";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requireActiveSession();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: CategoryFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        fieldErrors[key as "name" | "description"] = issue.message;
      }
    }
    return { error: "invalid_input", fieldErrors };
  }

  const data = parsed.data;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(eq(categories.orgId, session.orgId), eq(categories.name, data.name)),
    )
    .limit(1);
  if (existing) {
    return { error: "name_taken" };
  }

  try {
    await db.insert(categories).values({
      orgId: session.orgId,
      name: data.name,
      description: data.description ?? null,
    });
  } catch (err) {
    console.error("[categories.create] failed", err);
    return { error: "internal" };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  return {};
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const session = await requireActiveSession();
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.orgId, session.orgId)));

  revalidatePath("/categories");
  revalidatePath("/products");
}
