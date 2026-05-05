"use client";

import { useTranslations } from "next-intl";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ id }: { id: string }) {
  const t = useTranslations("Catalog.categories");

  return (
    <form
      action={deleteCategoryAction}
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
