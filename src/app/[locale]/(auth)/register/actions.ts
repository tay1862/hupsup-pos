"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  memberships,
  organizations,
  users,
  type BusinessType,
} from "@/db/schema";
import { signIn } from "@/lib/auth";
import { randomSuffix, slugify } from "@/lib/utils";
import type { RegisterState } from "./state";

const schema = z.object({
  orgName: z.string().trim().min(2).max(120),
  businessType: z.enum(["RETAIL", "RESTAURANT", "SERVICE", "MIXED"]),
  branchName: z.string().trim().min(1).max(120),
  ownerName: z.string().trim().min(1).max(120),
  ownerEmail: z.string().trim().toLowerCase().email().max(254),
  ownerPassword: z.string().min(8).max(128),
});

async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix(4)}`;
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${base}-${randomSuffix(8)}`;
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = schema.safeParse({
    orgName: formData.get("orgName"),
    businessType: formData.get("businessType"),
    branchName: formData.get("branchName"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        fieldErrors[key as keyof z.infer<typeof schema>] = issue.message;
      }
    }
    return { error: "invalid_input", fieldErrors };
  }

  const data = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.ownerEmail))
    .limit(1);
  if (existing) {
    return { error: "email_taken" };
  }

  const passwordHash = await bcrypt.hash(data.ownerPassword, 10);
  const slug = await uniqueOrgSlug(data.orgName);
  const businessType = data.businessType as BusinessType;

  try {
    await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.orgName,
          slug,
          businessType,
        })
        .returning({ id: organizations.id });

      const [branch] = await tx
        .insert(branches)
        .values({
          orgId: org.id,
          name: data.branchName,
          code: "MAIN",
        })
        .returning({ id: branches.id });

      const [user] = await tx
        .insert(users)
        .values({
          name: data.ownerName,
          email: data.ownerEmail,
          passwordHash,
        })
        .returning({ id: users.id });

      await tx.insert(memberships).values({
        userId: user.id,
        orgId: org.id,
        branchId: branch.id,
        role: "OWNER",
      });
    });
  } catch (err) {
    console.error("[register] transaction failed", err);
    return { error: "internal" };
  }

  // Sign the new owner in immediately so they land on /dashboard authenticated.
  await signIn("credentials", {
    email: data.ownerEmail,
    password: data.ownerPassword,
    redirectTo: "/dashboard",
  });
  return {};
}
