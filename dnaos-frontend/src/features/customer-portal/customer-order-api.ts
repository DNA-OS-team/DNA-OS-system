import { apiFetch } from "@/lib/api";

export type CustomerOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PRICING"
  | "QUOTED"
  | "CONFIRMED"
  | "PROCUREMENT"
  | "DISPATCHING"
  | "PARTIALLY_DELIVERED"
  | "DELIVERED"
  | "INVOICED"
  | "PAID"
  | "CANCELLED";

export type CustomerOrderItem = {
  id: string;
  description: string | null;
  quantity: string | number;
  unit: string;
  productVariant?: {
    id: string;
    name: string;
    product?: { id: string; name: string };
  } | null;
};

export type CustomerOrder = {
  id: string;
  orderNo: string;
  status: CustomerOrderStatus;
  createdAt: string;
  requestedDeliveryAt: string | null;
  deliveryNote: string | null;
  itemCount: number;
  project?: { id: string; projectNo: string; title: string } | null;
  customerSite?: { id: string; siteName: string } | null;
  items?: CustomerOrderItem[];
};

export type CustomerMe = {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  contactName: string | null;
  phone: string | null;
  company: {
    id: string;
    name: string;
    taxId: string | null;
  };
};

export type CustomerSite = {
  id: string;
  siteName: string;
  address: string;
  province: string;
  gpsLat: string | null;
  gpsLng: string | null;
};

export async function getCustomerMe(): Promise<CustomerMe> {
  return apiFetch<CustomerMe>("/customer/me");
}

export async function updateCustomerProfile(data: { contactName?: string | null; phone?: string | null }) {
  return apiFetch("/customer/me", { method: "PATCH", body: JSON.stringify(data) });
}

export async function listCustomerSites(): Promise<{ sites: CustomerSite[] }> {
  return apiFetch<{ sites: CustomerSite[] }>("/customer/sites");
}

export async function createCustomerSite(data: {
  siteName: string;
  address: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  gpsLat?: number | null;
  gpsLng?: number | null;
}): Promise<{ site: CustomerSite }> {
  return apiFetch<{ site: CustomerSite }>("/customer/sites", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteCustomerSite(id: string) {
  return apiFetch(`/customer/sites/${id}`, { method: "DELETE" });
}

export async function listCustomerOrders(params?: {
  status?: CustomerOrderStatus | "all";
  q?: string;
}): Promise<{ orders: CustomerOrder[] }> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ orders: CustomerOrder[] }>(`/customer/orders${query}`);
}

export async function getCustomerOrder(id: string): Promise<{ order: CustomerOrder }> {
  return apiFetch<{ order: CustomerOrder }>(`/customer/orders/${id}`);
}

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductVariantOption = {
  variantId: string;
  variantName: string;
  unit: string;
  price: number;
};

export type CustomerProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string;
  pricePerTon: number | null;
  pricePerCubic: number | null;
  variants: ProductVariantOption[];
};

export async function listCustomerProducts(): Promise<{ products: CustomerProduct[] }> {
  return apiFetch<{ products: CustomerProduct[] }>("/customer/products");
}

// ─── Order Requests ──────────────────────────────────────────────────────────

export type OrderRequestItem = {
  productVariantId: string;
  quantity: number;
  unit: string;
};

export type OrderRequestPayload = {
  items: OrderRequestItem[];
  deliveryAddress: string;
  requestedDeliveryAt?: string | null;
  note?: string | null;
};

export async function createOrderRequest(payload: OrderRequestPayload): Promise<{ ok: boolean; reqNo: string; id: string }> {
  return apiFetch("/customer/orders/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type CustomerOrderRequest = {
  id: string;
  reqNo: string;
  status: "PENDING" | "PROCESSING" | "CONFIRMED" | "CANCELLED";
  deliveryAddress: string;
  requestedDeliveryAt: string | null;
  note: string | null;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unit: string;
    productVariant: { id: string; name: string; product: { name: string } };
  }[];
};

export async function listOrderRequests(): Promise<{ requests: CustomerOrderRequest[] }> {
  return apiFetch<{ requests: CustomerOrderRequest[] }>("/customer/orders/requests");
}
