import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("signInTitle")}</CardTitle>
        <CardDescription>{t("signInSubtitle")}</CardDescription>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <SignInForm />
        <p className="text-foreground/70 text-center text-sm">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-foreground font-medium underline underline-offset-2 hover:opacity-80"
          >
            {t("registerLink")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
