"use client";

import { useTranslations } from "next-intl";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ id }: { id: string }) {
  const t = useTranslations("Catalog.products.actions");
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirm(t("deleteConfirm"))) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-600 hover:underline">
        {t("delete")}
      </button>
    </form>
  );
}
