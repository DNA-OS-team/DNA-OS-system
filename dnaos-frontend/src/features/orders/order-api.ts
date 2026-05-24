import { apiFetch } from "@/lib/api";
import type {
  CustomerOrder,
  CustomerOrderOptions,
  CustomerOrderStatus,
} from "./types";
import type { OrderFormValues } from "./schemas";

export type OrderListFilters = {
  q?: string;
  status?: "all" | CustomerOrderStatus;
};

export function getOrderOptions() {
  return apiFetch<CustomerOrderOptions>("/admin/orders/options");
}

export function listOrders(filters: OrderListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return apiFetch<{ orders: CustomerOrder[] }>(
    `/admin/orders${query ? `?${query}` : ""}`
  );
}

export function createOrder(input: OrderFormValues) {
  return apiFetch<{ order: CustomerOrder }>("/admin/orders", {
    method: "POST",
    body: JSON.stringify(sanitizeOrderInput(input)),
  });
}

export function getOrder(orderId: string) {
  return apiFetch<{ order: CustomerOrder }>(`/admin/orders/${orderId}`);
}

export function updateOrder(orderId: string, input: OrderFormValues) {
  return apiFetch<{ order: CustomerOrder }>(`/admin/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(sanitizeOrderInput(input)),
  });
}

function sanitizeOrderInput(input: OrderFormValues) {
  return {
    ...input,
    requestedDeliveryAt: input.requestedDeliveryAt
      ? new Date(input.requestedDeliveryAt).toISOString()
      : null,
    deliveryNote: input.deliveryNote || null,
    items: input.items.map((item) => ({
      ...item,
      description: item.description || null,
      quantity: Number(item.quantity),
    })),
  };
}
