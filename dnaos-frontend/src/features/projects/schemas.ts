import { z } from "zod";

export const projectFormSchema = z.object({
  customerCompanyId: z.string().uuid("Customer is required"),
  customerSiteId: z.string().uuid("Customer site is required"),
  title: z.string().trim().min(1, "Project title is required"),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
});

export const documentGroupFormSchema = z.object({
  title: z.string().trim().min(1, "Document group title is required"),
  rootOrderNo: z.string().trim().optional(),
  status: z.enum(["OPEN", "CLOSED", "ARCHIVED"]),
});

export const documentReferenceFormSchema = z
  .object({
    documentId: z.string().trim().optional(),
    documentType: z.enum(["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"]).optional(),
    relatedDocumentId: z.string().trim().min(1, "Related document is required"),
    relationType: z.enum([
      "SOURCE",
      "PARENT",
      "CHILD",
      "GENERATED_FROM",
      "PAID_BY",
      "SETTLED_BY",
    ]),
  })
  .refine((value) => Boolean(value.documentId || value.documentType), {
    message: "Document ID or document type is required",
    path: ["documentId"],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type DocumentGroupFormValues = z.infer<typeof documentGroupFormSchema>;
export type DocumentReferenceFormValues = z.infer<typeof documentReferenceFormSchema>;
