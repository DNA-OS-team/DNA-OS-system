import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  taxId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  bankName: z.string().trim().optional(),
  bankAccountNo: z.string().trim().optional(),
});

export const customerSiteFormSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  address: z.string().trim().min(1, "Address is required"),
  province: z.string().trim().optional(),
  district: z.string().trim().optional(),
  subdistrict: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  gpsLat: z.string().trim().optional(),
  gpsLng: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  deliveryNote: z.string().trim().optional(),
  accessRestriction: z.string().trim().optional(),
  preferredDeliveryTime: z.string().trim().optional(),
  isActive: z.boolean(),
});

export const customerCreditFormSchema = z.object({
  creditLimit: nonNegativeNumberText("Credit limit must be 0 or more"),
  creditTermDays: nonNegativeIntegerText("Credit term must be 0 or more"),
  currentOutstanding: nonNegativeNumberText("Current outstanding must be 0 or more"),
  overdueAmount: nonNegativeNumberText("Overdue amount must be 0 or more"),
  creditStatus: z.enum(["NORMAL", "WATCH", "HOLD", "BLOCKED"]),
  paymentBehaviorScore: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100, {
      message: "Payment behavior score must be between 0 and 100",
    }),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type CustomerSiteFormValues = z.infer<typeof customerSiteFormSchema>;
export type CustomerCreditFormValues = z.infer<typeof customerCreditFormSchema>;

function nonNegativeNumberText(message: string) {
  return z
    .string()
    .trim()
    .refine((value) => value !== "" && Number(value) >= 0, { message });
}

function nonNegativeIntegerText(message: string) {
  return z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, {
      message,
    });
}
