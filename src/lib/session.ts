/**
 * Server-side session helpers for protected routes.
 */

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "./auth";
import type { Role } from "@/db/schema";

export type ActiveSession = {
  userId: string;
  email: string | null;
  name: string | null;
  orgId: string;
  role: Role;
  branchId: string | null;
};

/**
 * Require an authenticated session with an active organization membership.
 * Redirects to /sign-in (or /register if logged in but org-less) otherwise.
 *
 * Uses the locale-aware `redirect` from `@/i18n/navigation` so a user on
 * `/lo/dashboard` is bounced to `/lo/sign-in`, not `/sign-in`.
 */
export async function requireActiveSession(): Promise<ActiveSession> {
  const session = await auth();
  const locale = await getLocale();
  const user = session?.user;
  if (!user?.id) {
    redirect({ href: "/sign-in", locale });
    // `redirect` throws, but its return type isn't `never`, so narrow manually.
    throw new Error("unreachable");
  }
  if (!user.orgId || !user.role) {
    // Logged in but never finished registration — bounce to register flow.
    redirect({ href: "/register", locale });
    throw new Error("unreachable");
  }
  return {
    userId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    orgId: user.orgId,
    role: user.role,
    branchId: user.branchId,
  };
}
