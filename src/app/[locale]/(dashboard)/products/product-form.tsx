"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  initialProductFormState,
  type ProductFormDefaults,
  type ProductFormState,
} from "./state";

type Action = (
  prev: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

type CategoryOption = { id: string; name: string };

export function ProductForm({
  action,
  defaults,
  categories,
  mode,
}: {
  action: Action;
  defaults: ProductFormDefaults;
  categories: CategoryOption[];
  mode: "create" | "edit";
}) {
  const t = useTranslations("Catalog.products.form");
  const tErr = useTranslations("Catalog.products.form.errors");
  const [state, formAction, isPending] = useActionState(
    action,
    initialProductFormState,
  );

  const errorMessage =
    state.error === "sku_taken"
      ? tErr("skuTaken")
      : state.error === "barcode_taken"
        ? tErr("barcodeTaken")
        : state.error === "invalid_input"
          ? tErr("invalidInput")
          : state.error === "not_found"
            ? tErr("notFound")
            : state.error === "internal"
              ? tErr("internal")
              : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("sku")} htmlFor="sku" hint={t("skuHint")}>
          <Input
            id="sku"
            name="sku"
            type="text"
            defaultValue={defaults.sku}
            required
            maxLength={64}
          />
        </Field>
        <Field label={t("barcode")} htmlFor="barcode">
          <Input
            id="barcode"
            name="barcode"
            type="text"
            defaultValue={defaults.barcode}
            maxLength={64}
          />
        </Field>
      </div>

      <Field label={t("name")} htmlFor="name">
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t("namePlaceholder")}
          defaultValue={defaults.name}
          required
          maxLength={200}
        />
      </Field>

      <Field label={t("description")} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("category")} htmlFor="categoryId">
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={defaults.categoryId}
          >
            <option value="">{t("categoryNone")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("unitLabel")} htmlFor="unitLabel">
          <Input
            id="unitLabel"
            name="unitLabel"
            type="text"
            placeholder={t("unitPlaceholder")}
            defaultValue={defaults.unitLabel}
            required
            maxLength={32}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("currency")} htmlFor="currency">
          <Select
            id="currency"
            name="currency"
            defaultValue={defaults.currency}
          >
            <option value="LAK">LAK</option>
            <option value="THB">THB</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
        <Field label={t("costPrice")} htmlFor="costPrice">
          <Input
            id="costPrice"
            name="costPrice"
            type="text"
            inputMode="decimal"
            defaultValue={defaults.costPrice}
            required
          />
        </Field>
        <Field label={t("sellPrice")} htmlFor="sellPrice">
          <Input
            id="sellPrice"
            name="sellPrice"
            type="text"
            inputMode="decimal"
            defaultValue={defaults.sellPrice}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="border-foreground/20 flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
          <span>{t("trackStock")}</span>
          <input
            type="checkbox"
            name="trackStock"
            defaultChecked={defaults.trackStock}
          />
        </label>
        <Field label={t("stockOnHand")} htmlFor="stockOnHand">
          <Input
            id="stockOnHand"
            name="stockOnHand"
            type="text"
            inputMode="decimal"
            defaultValue={defaults.stockOnHand}
          />
        </Field>
      </div>

      <label className="border-foreground/20 flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
        <span>{t("isActive")}</span>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaults.isActive}
        />
      </label>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t("submitting")
            : mode === "create"
              ? t("submitCreate")
              : t("submitUpdate")}
        </Button>
      </div>
    </form>
  );
}
