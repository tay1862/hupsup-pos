"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary" size="sm">
        {t("signOut")}
      </Button>
    </form>
  );
}
