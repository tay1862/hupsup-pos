import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Register");
  const tAuth = await getTranslations("Auth");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <RegisterForm />
        <p className="text-foreground/70 text-center text-sm">
          {tAuth("haveAccount")}{" "}
          <Link
            href="/sign-in"
            className="text-foreground font-medium underline underline-offset-2 hover:opacity-80"
          >
            {tAuth("signInLink")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
