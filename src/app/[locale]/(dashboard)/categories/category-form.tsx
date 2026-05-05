"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCategoryAction } from "./actions";
import { initialCategoryFormState } from "./state";

export function CategoryForm() {
  const t = useTranslations("Catalog.categories");
  const tErr = useTranslations("Catalog.categories.errors");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createCategoryAction,
    initialCategoryFormState,
  );

  useEffect(() => {
    if (!isPending && state && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  const errorMessage =
    state.error === "name_taken"
      ? tErr("nameTaken")
      : state.error === "invalid_input"
        ? tErr("invalidInput")
        : state.error === "internal"
          ? tErr("internal")
          : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field label={t("name")} htmlFor="cat-name">
        <Input
          id="cat-name"
          name="name"
          type="text"
          placeholder={t("namePlaceholder")}
          required
        />
      </Field>
      <Field label={t("description")} htmlFor="cat-description">
        <Textarea id="cat-description" name="description" rows={2} />
      </Field>
      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
