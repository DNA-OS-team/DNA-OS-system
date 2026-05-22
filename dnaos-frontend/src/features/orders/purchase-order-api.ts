import { apiFetch } from "@/lib/api";
import type { SupplierPoStatus, SupplierPurchaseOrder } from "./types";

export type SupplierPurchaseOrderFilters = {
  q?: string;
  status?: "all" | SupplierPoStatus;
};

export function getOrderSupplierPurchaseOrders(orderId: string) {
  return apiFetch<{ supplierPurchaseOrders: SupplierPurchaseOrder[] }>(
    `/admin/orders/${orderId}/purchase-orders`
  );
}

export function createOrderSupplierPurchaseOrders(orderId: string) {
  return apiFetch<{ supplierPurchaseOrders: SupplierPurchaseOrder[] }>(
    `/admin/orders/${orderId}/purchase-orders`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

export function listSupplierPurchaseOrders(
  filters: SupplierPurchaseOrderFilters = {}
) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return apiFetch<{ supplierPurchaseOrders: SupplierPurchaseOrder[] }>(
    `/admin/procurement/purchase-orders${query ? `?${query}` : ""}`
  );
}
