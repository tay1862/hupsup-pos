/**
 * Shared state shape for the register server action.
 *
 * Lives in a separate (non-"use server") file so the form can import the
 * initial value — `"use server"` modules may only export async functions.
 */
export type RegisterState = {
  error?: "invalid_input" | "email_taken" | "internal";
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialRegisterState: RegisterState = {};
