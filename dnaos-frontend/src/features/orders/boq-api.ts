import { apiFetch } from "@/lib/api";
import type { Boq } from "./types";

export function getOrderBoqs(orderId: string) {
  return apiFetch<{ boqs: Boq[] }>(`/admin/orders/${orderId}/boq`);
}

export function createOrderBoq(orderId: string) {
  return apiFetch<{ boq: Boq }>(`/admin/orders/${orderId}/boq`, {
    method: "POST",
    body: JSON.stringify({})
  });
}
