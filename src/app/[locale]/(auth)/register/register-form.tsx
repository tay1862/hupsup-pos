"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { registerAction } from "./actions";
import { initialRegisterState, type RegisterState } from "./state";

const BUSINESS_TYPES = [
  { value: "RETAIL", labelKey: "businessTypeRetail" },
  { value: "RESTAURANT", labelKey: "businessTypeRestaurant" },
  { value: "SERVICE", labelKey: "businessTypeService" },
  { value: "MIXED", labelKey: "businessTypeMixed" },
] as const;

export function RegisterForm() {
  const t = useTranslations("Register");
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    initialRegisterState,
  );

  const errorKey = state.error;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-foreground/80 text-sm font-semibold">
          {t("orgSection")}
        </legend>
        <Field label={t("orgName")} htmlFor="orgName">
          <Input
            id="orgName"
            name="orgName"
            type="text"
            required
            minLength={2}
            placeholder={t("orgNamePlaceholder")}
          />
        </Field>
        <Field label={t("businessType")} htmlFor="businessType">
          <select
            id="businessType"
            name="businessType"
            required
            defaultValue="RETAIL"
            className="border-foreground/20 bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {BUSINESS_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("branchName")} htmlFor="branchName">
          <Input
            id="branchName"
            name="branchName"
            type="text"
            required
            placeholder={t("branchNamePlaceholder")}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-foreground/80 text-sm font-semibold">
          {t("ownerSection")}
        </legend>
        <Field label={t("ownerName")} htmlFor="ownerName">
          <Input
            id="ownerName"
            name="ownerName"
            type="text"
            required
            placeholder={t("ownerNamePlaceholder")}
            autoComplete="name"
          />
        </Field>
        <Field label={t("ownerEmail")} htmlFor="ownerEmail">
          <Input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            required
            placeholder={t("ownerEmailPlaceholder")}
            autoComplete="email"
            inputMode="email"
          />
        </Field>
        <Field label={t("ownerPassword")} htmlFor="ownerPassword">
          <Input
            id="ownerPassword"
            name="ownerPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
      </fieldset>

      {errorKey === "email_taken" ? (
        <p className="text-sm text-red-600" role="alert">
          {t("errors.emailTaken")}
        </p>
      ) : errorKey === "invalid_input" ? (
        <p className="text-sm text-red-600" role="alert">
          {t("errors.invalidInput")}
        </p>
      ) : errorKey === "internal" ? (
        <p className="text-sm text-red-600" role="alert">
          {t("errors.internal")}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
