import { apiFetch } from "@/lib/api";
import type { PricingSnapshot } from "./types";

export function getOrderPricing(orderId: string) {
  return apiFetch<{ pricingSnapshot: PricingSnapshot | null }>(
    `/admin/orders/${orderId}/pricing`
  );
}

export function runOrderPricing(orderId: string) {
  return apiFetch<{ pricingSnapshot: PricingSnapshot }>(
    `/admin/orders/${orderId}/pricing/run`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}
