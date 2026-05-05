"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={t("email")} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
        />
      </Field>
      <Field label={t("password")} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
        />
      </Field>
      {state.error === "invalid_credentials" ? (
        <p className="text-sm text-red-600" role="alert">
          {t("invalidCredentials")}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
