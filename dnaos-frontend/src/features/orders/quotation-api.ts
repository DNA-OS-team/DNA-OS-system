import { apiFetch } from "@/lib/api";
import type { Quotation } from "./types";

export function getOrderQuotations(orderId: string) {
  return apiFetch<{ quotations: Quotation[] }>(`/admin/orders/${orderId}/quotation`);
}

export function createOrderQuotation(orderId: string) {
  return apiFetch<{ quotation: Quotation }>(`/admin/orders/${orderId}/quotation`, {
    method: "POST",
    body: JSON.stringify({})
  });
}
