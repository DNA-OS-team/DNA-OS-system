import { z } from "zod";

export const partnerProductSubmissionFormSchema = z.object({
  supplierCompanyId: z.string().uuid("Supplier is required"),
  productVariantId: z.string().trim().optional(),
  requestedProductName: z.string().trim().min(1, "Product name is required"),
  requestedCategoryName: z.string().trim().optional(),
  description: z.string().trim().optional(),
  unit: z.string().trim().min(1, "Unit is required"),
  price: z.string().trim().refine((value) => Number(value) >= 0, {
    message: "Price must be 0 or more",
  }),
  stockQty: z.string().trim().refine((value) => Number(value) >= 0, {
    message: "Stock quantity must be 0 or more",
  }),
  minQty: z.string().trim().refine((value) => Number(value) >= 0, {
    message: "Minimum quantity must be 0 or more",
  }),
  serviceArea: z.string().trim().optional(),
});

export const reviewSubmissionSchema = z.object({
  adminReviewNote: z.string().trim().optional(),
});

export const inventoryUpdateSchema = z.object({
  stockQty: z.string().trim().refine((value) => Number(value) >= 0, {
    message: "Stock quantity must be 0 or more",
  }),
  lowStockThreshold: z.string().trim().refine((value) => Number(value) >= 0, {
    message: "Low stock threshold must be 0 or more",
  }),
  note: z.string().trim().optional(),
});

export type PartnerProductSubmissionFormValues = z.infer<
  typeof partnerProductSubmissionFormSchema
>;
export type ReviewSubmissionValues = z.infer<typeof reviewSubmissionSchema>;
export type InventoryUpdateValues = z.infer<typeof inventoryUpdateSchema>;
