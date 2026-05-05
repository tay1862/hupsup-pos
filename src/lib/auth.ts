/**
 * Auth.js v5 configuration. Uses Credentials provider with bcrypt-hashed
 * passwords against the `users` table.
 *
 * The JWT carries the active organization context (orgId, role, branchId)
 * so server components can authorize requests without an extra DB hit on
 * every render. The membership is resolved at sign-in (Credentials.authorize)
 * and refreshed on each `update()` call.
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { memberships, users, type Role } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      orgId: string | null;
      role: Role | null;
      branchId: string | null;
    };
  }

  interface User {
    orgId?: string | null;
    role?: Role | null;
    branchId?: string | null;
  }
}

type TokenPayload = {
  sub?: string;
  orgId?: string | null;
  role?: Role | null;
  branchId?: string | null;
};

async function loadActiveMembership(userId: string) {
  const [m] = await db
    .select({
      orgId: memberships.orgId,
      role: memberships.role,
      branchId: memberships.branchId,
    })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.isActive, true)))
    .limit(1);
  return m ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const membership = await loadActiveMembership(user.id);

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          image: user.avatarUrl ?? undefined,
          orgId: membership?.orgId ?? null,
          role: membership?.role ?? null,
          branchId: membership?.branchId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const t = token as TokenPayload;
      if (user) {
        t.sub = user.id;
        t.orgId = user.orgId ?? null;
        t.role = user.role ?? null;
        t.branchId = user.branchId ?? null;
      } else if (trigger === "update" && t.sub) {
        const m = await loadActiveMembership(t.sub);
        t.orgId = m?.orgId ?? null;
        t.role = m?.role ?? null;
        t.branchId = m?.branchId ?? null;
      }
      return t;
    },
    session: ({ session, token }) => {
      const t = token as TokenPayload;
      if (t.sub) session.user.id = t.sub;
      session.user.orgId = t.orgId ?? null;
      session.user.role = t.role ?? null;
      session.user.branchId = t.branchId ?? null;
      return session;
    },
  },
});
