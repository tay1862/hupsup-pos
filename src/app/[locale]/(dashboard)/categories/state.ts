export type CategoryFormState = {
  error?: "invalid_input" | "name_taken" | "internal";
  fieldErrors?: {
    name?: string;
    description?: string;
  };
};

export const initialCategoryFormState: CategoryFormState = {};
