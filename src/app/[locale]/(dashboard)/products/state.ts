export type ProductFormFieldErrors = Partial<
  Record<
    | "sku"
    | "barcode"
    | "name"
    | "description"
    | "categoryId"
    | "unitLabel"
    | "currency"
    | "costPrice"
    | "sellPrice"
    | "stockOnHand",
    string
  >
>;

export type ProductFormState = {
  error?:
    | "invalid_input"
    | "sku_taken"
    | "barcode_taken"
    | "internal"
    | "not_found";
  fieldErrors?: ProductFormFieldErrors;
};

export const initialProductFormState: ProductFormState = {};

export type ProductFormDefaults = {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  unitLabel: string;
  currency: string;
  costPrice: string;
  sellPrice: string;
  trackStock: boolean;
  stockOnHand: string;
  isActive: boolean;
};

export const newProductDefaults = (currency: string): ProductFormDefaults => ({
  sku: "",
  barcode: "",
  name: "",
  description: "",
  categoryId: "",
  unitLabel: "piece",
  currency,
  costPrice: "0",
  sellPrice: "0",
  trackStock: false,
  stockOnHand: "0",
  isActive: true,
});
