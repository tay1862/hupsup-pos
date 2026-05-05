/**
 * Server-side session helpers for protected routes.
 */

import { redirect } from "next/navigation";
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
 */
export async function requireActiveSession(): Promise<ActiveSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!session.user.orgId || !session.user.role) {
    // Logged in but never finished registration — bounce to register flow.
    redirect("/register");
  }
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    orgId: session.user.orgId,
    role: session.user.role,
    branchId: session.user.branchId,
  };
}
