import { z } from "zod";

export const orderItemFormSchema = z.object({
  productVariantId: z.string().uuid("Product variant is required"),
  description: z.string().trim().optional(),
  quantity: z.string().trim().refine((value) => Number(value) > 0, {
    message: "Quantity must be greater than 0",
  }),
  unit: z.string().trim().min(1, "Unit is required"),
});

export const orderFormSchema = z.object({
  projectId: z.string().uuid("Project is required"),
  customerCompanyId: z.string().uuid("Customer is required"),
  customerSiteId: z.string().uuid("Customer site is required"),
  status: z.enum(["DRAFT", "SUBMITTED", "PRICING", "QUOTED", "CONFIRMED", "PROCUREMENT", "DISPATCHING", "PARTIALLY_DELIVERED", "DELIVERED", "INVOICED", "PAID", "CANCELLED"]),
  requestedDeliveryAt: z.string().trim().optional(),
  deliveryNote: z.string().trim().optional(),
  items: z.array(orderItemFormSchema).min(1, "At least one order item is required"),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemFormSchema>;
