import { apiFetch } from "@/lib/api";
import type {
  CompanySummary,
  PartnerProductSubmission,
  PartnerProductSubmissionStatus,
  ProductVariantOption,
  SupplierInventory,
} from "./types";
import type {
  InventoryUpdateValues,
  PartnerProductSubmissionFormValues,
  ReviewSubmissionValues,
} from "./schemas";

export type SubmissionListFilters = {
  q?: string;
  status?: "all" | PartnerProductSubmissionStatus;
};

export type InventoryListFilters = {
  q?: string;
  lowStockOnly?: boolean;
};

export function getPartnerProductOptions() {
  return apiFetch<{
    suppliers: CompanySummary[];
    productVariants: ProductVariantOption[];
  }>("/admin/partner-products/options");
}

export function listPartnerProductSubmissions(filters: SubmissionListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return apiFetch<{ submissions: PartnerProductSubmission[] }>(
    `/admin/partner-products${query ? `?${query}` : ""}`
  );
}

export function createPartnerProductSubmission(
  input: PartnerProductSubmissionFormValues
) {
  return apiFetch<{ submission: PartnerProductSubmission }>(
    "/admin/partner-products",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        productVariantId: input.productVariantId || null,
        requestedCategoryName: input.requestedCategoryName || null,
        description: input.description || null,
        price: Number(input.price),
        stockQty: Number(input.stockQty),
        minQty: Number(input.minQty),
        serviceArea: input.serviceArea || null,
      }),
    }
  );
}

export function getPartnerProductSubmission(id: string) {
  return apiFetch<{ submission: PartnerProductSubmission }>(
    `/admin/partner-products/${id}`
  );
}

export function approvePartnerProductSubmission(
  id: string,
  input: ReviewSubmissionValues
) {
  return apiFetch<{ submission: PartnerProductSubmission }>(
    `/admin/partner-products/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function rejectPartnerProductSubmission(
  id: string,
  input: ReviewSubmissionValues
) {
  return apiFetch<{ submission: PartnerProductSubmission }>(
    `/admin/partner-products/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function listSupplierInventory(filters: InventoryListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.lowStockOnly) {
    params.set("lowStockOnly", "true");
  }

  const query = params.toString();

  return apiFetch<{ inventories: SupplierInventory[] }>(
    `/admin/supplier-inventory${query ? `?${query}` : ""}`
  );
}

export function updateSupplierInventory(
  supplierProductId: string,
  input: InventoryUpdateValues
) {
  return apiFetch<{ inventory: SupplierInventory }>(
    `/admin/supplier-inventory/${supplierProductId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        stockQty: Number(input.stockQty),
        lowStockThreshold: Number(input.lowStockThreshold),
        note: input.note || null,
      }),
    }
  );
}
