import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().optional(),
  sortOrder: z.string().trim().refine((value) => Number.isInteger(Number(value)), {
    message: "Sort order must be an integer",
  }),
});

export const productFormSchema = z.object({
  categoryId: z.string().uuid("Category is required"),
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().optional(),
  defaultUnit: z.string().trim().min(1, "Default unit is required"),
  isActive: z.boolean(),
});

export const variantFormSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required"),
  unit: z.string().trim().min(1, "Variant unit is required"),
  specsJson: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "Specs must be valid JSON"),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;
