"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export type SignInState = {
  error?: "invalid_credentials" | "invalid_input" | "internal";
};

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "invalid_input" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "invalid_credentials" };
    }
    // NEXT_REDIRECT is thrown internally by signIn on success; bubble it up.
    throw err;
  }
}
