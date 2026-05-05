export type CheckoutSubmitState = {
  status: "idle" | "error" | "success";
  error?: "invalid_input" | "underpaid" | "empty_cart" | "internal";
  receiptUrl?: string;
};

export const initialCheckoutState: CheckoutSubmitState = { status: "idle" };
