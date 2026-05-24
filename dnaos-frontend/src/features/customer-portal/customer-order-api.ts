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
  company: {
    id: string;
    name: string;
    taxId: string | null;
  };
};

export async function getCustomerMe(): Promise<CustomerMe> {
  return apiFetch<CustomerMe>("/customer/me");
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
