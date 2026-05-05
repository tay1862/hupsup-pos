"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  add,
  compare,
  multiply,
  subtract,
  toLak,
  toMoneyString,
  toNumber,
} from "@/lib/money";
import { formatMoney } from "@/lib/utils";
import { checkoutAction } from "./actions";
import type { CartLine, PosProduct } from "./types";

type PaymentMethod =
  | "CASH"
  | "BCEL_QR"
  | "LDB_QR"
  | "JDB_QR"
  | "BANK_TRANSFER"
  | "OTHER";

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "BCEL_QR",
  "LDB_QR",
  "JDB_QR",
  "BANK_TRANSFER",
  "OTHER",
];

export function PosShell({
  products,
  defaultExchangeRate,
}: {
  products: PosProduct[];
  defaultExchangeRate: string;
}) {
  const t = useTranslations("Pos");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">(
    "all",
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paidLak, setPaidLak] = useState("0");
  const [paidThb, setPaidThb] = useState("0");
  const [exchangeRate, setExchangeRate] = useState(defaultExchangeRate);
  const [discountLak, setDiscountLak] = useState("0");
  const [note, setNote] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.categoryId && p.categoryName) {
        map.set(p.categoryId, p.categoryName);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategoryId !== "all" && p.categoryId !== activeCategoryId) {
        return false;
      }
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
    });
  }, [products, search, activeCategoryId]);

  const subtotal = useMemo(
    () =>
      cart.reduce((acc, l) => add(acc, multiply(l.unitPriceLak, l.qty)), "0"),
    [cart],
  );
  const total = useMemo(() => {
    const t = subtract(subtotal, discountLak || "0");
    return compare(t, "0") < 0 ? "0" : t;
  }, [subtotal, discountLak]);
  const tendered = useMemo(
    () => add(paidLak || "0", multiply(paidThb || "0", exchangeRate || "0")),
    [paidLak, paidThb, exchangeRate],
  );
  const change = useMemo(() => {
    const c = subtract(tendered, total);
    return compare(c, "0") < 0 ? "0" : c;
  }, [tendered, total]);

  const addToCart = (product: PosProduct) => {
    setCart((current) => {
      const existing = current.find((l) => l.productId === product.id);
      if (existing) {
        return current.map((l) =>
          l.productId === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      const unitPriceLak = toLak(
        product.sellPrice,
        product.currency,
        exchangeRate || "0",
      );
      return [
        ...current,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitLabel: product.unitLabel,
          unitPriceSrc: product.sellPrice,
          currency: product.currency,
          unitPriceLak,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((current) => current.filter((l) => l.productId !== productId));
      return;
    }
    setCart((current) =>
      current.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  };

  const removeLine = (productId: string) => {
    setCart((current) => current.filter((l) => l.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaidLak("0");
    setPaidThb("0");
    setDiscountLak("0");
    setNote("");
    setErrorKey(null);
  };

  const submitCheckout = () => {
    setErrorKey(null);
    if (cart.length === 0) {
      setErrorKey("empty_cart");
      return;
    }
    if (compare(tendered, total) < 0) {
      setErrorKey("underpaid");
      return;
    }
    startTransition(async () => {
      const result = await checkoutAction({
        paymentMethod,
        paidLak: toMoneyString(toNumber(paidLak || "0")),
        paidThb: toMoneyString(toNumber(paidThb || "0")),
        exchangeRateThbToLak: toMoneyString(toNumber(exchangeRate || "0")),
        discountLak: toMoneyString(toNumber(discountLak || "0")),
        note: note.trim() || undefined,
        lines: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
      });
      if (result.status === "success" && result.receiptUrl) {
        clearCart();
        router.push(result.receiptUrl);
        return;
      }
      setErrorKey(result.error ?? "internal");
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategoryId("all")}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeCategoryId === "all"
                  ? "bg-foreground text-background"
                  : "border-foreground/20 hover:bg-foreground/5"
              }`}
            >
              {t("allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeCategoryId === cat.id
                    ? "bg-foreground text-background"
                    : "border-foreground/20 hover:bg-foreground/5"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <p className="text-foreground/60 rounded-md border border-dashed px-6 py-12 text-center text-sm">
            {t("noProducts")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                className="border-foreground/10 hover:border-foreground/40 bg-background flex flex-col items-start gap-1 rounded-md border px-3 py-3 text-left transition-colors"
              >
                <span className="text-foreground/50 font-mono text-xs">
                  {product.sku}
                </span>
                <span className="line-clamp-2 text-sm font-medium">
                  {product.name}
                </span>
                <span className="text-foreground/70 text-xs">
                  {formatMoney(product.sellPrice, product.currency)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="border-foreground/10 bg-background flex flex-col rounded-lg border">
        <header className="border-foreground/10 flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{t("cartTitle")}</h2>
          {cart.length > 0 ? (
            <button
              type="button"
              onClick={clearCart}
              className="text-foreground/60 text-xs hover:underline"
            >
              {t("clearCart")}
            </button>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="text-foreground/60 py-6 text-center text-sm">
              {t("cartEmpty")}
            </p>
          ) : (
            <ul className="divide-foreground/10 divide-y">
              {cart.map((line) => (
                <li key={line.productId} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{line.name}</p>
                      <p className="text-foreground/60 text-xs">
                        {formatMoney(line.unitPriceLak, "LAK")} ·{" "}
                        {line.unitLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.productId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {t("removeLine")}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateQty(line.productId, line.qty - 1)}
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        value={line.qty}
                        min={0}
                        step={1}
                        onChange={(e) =>
                          updateQty(line.productId, Number(e.target.value))
                        }
                        className="h-8 w-16 text-center"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateQty(line.productId, line.qty + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <span className="text-sm font-medium">
                      {formatMoney(
                        multiply(line.unitPriceLak, line.qty),
                        "LAK",
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-foreground/10 flex flex-col gap-3 border-t px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("exchangeRate")} htmlFor="exchangeRate">
              <Input
                id="exchangeRate"
                type="text"
                inputMode="decimal"
                value={exchangeRate}
                onChange={(event) => setExchangeRate(event.target.value)}
              />
            </Field>
            <Field label={t("discount")} htmlFor="discountLak">
              <Input
                id="discountLak"
                type="text"
                inputMode="decimal"
                value={discountLak}
                onChange={(event) => setDiscountLak(event.target.value)}
              />
            </Field>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("subtotal")}</span>
              <span>{formatMoney(subtotal, "LAK")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("discount")}</span>
              <span>−{formatMoney(discountLak || "0", "LAK")}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>{t("total")}</span>
              <span>{formatMoney(total, "LAK")}</span>
            </div>
          </div>

          <Field label={t("paymentMethod")} htmlFor="paymentMethod">
            <Select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {t(`paymentMethods.${method}`)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label={t("paidLak")} htmlFor="paidLak">
              <Input
                id="paidLak"
                type="text"
                inputMode="decimal"
                value={paidLak}
                onChange={(event) => setPaidLak(event.target.value)}
              />
            </Field>
            <Field label={t("paidThb")} htmlFor="paidThb">
              <Input
                id="paidThb"
                type="text"
                inputMode="decimal"
                value={paidThb}
                onChange={(event) => setPaidThb(event.target.value)}
              />
            </Field>
          </div>

          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">{t("tendered")}</span>
              <span>{formatMoney(tendered, "LAK")}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("change")}</span>
              <span>{formatMoney(change, "LAK")}</span>
            </div>
          </div>

          <Field label={t("note")} htmlFor="note">
            <Textarea
              id="note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>

          {errorKey ? (
            <p className="text-sm text-red-600" role="alert">
              {t(`errors.${errorKey}`)}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={submitCheckout}
            disabled={isPending || cart.length === 0}
          >
            {isPending ? t("checkingOut") : t("checkout")}
          </Button>
        </div>
      </aside>
    </div>
  );
}
