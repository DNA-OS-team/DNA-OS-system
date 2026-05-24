import { apiFetch } from "@/lib/api";
import type { PortalMe } from "@/features/fleet-portal/fleet-api";

export type PoStatus =
  | "DRAFT" | "ACKNOWLEDGED" | "CONFIRMED" | "PARTIALLY_FULFILLED"
  | "FULFILLED" | "BILLED" | "PAID" | "CANCELLED" | "REJECTED";

export type SupplierPO = {
  id: string;
  poNo?: string;
  status: PoStatus;
  subtotal: string | number;
  vatAmount: string | number;
  totalAmount: string | number;
  createdAt: string;
  supplierRespondedAt: string | null;
  supplierResponseNote: string | null;
  customerOrder?: {
    id: string;
    orderNo: string;
    project?: { title: string } | null;
    customerCompany?: { name: string } | null;
    customerSite?: { siteName: string } | null;
  } | null;
  items?: {
    id: string;
    description: string | null;
    quantity: string | number;
    unit: string;
    unitCost: string | number;
    totalCost: string | number;
    productVariant?: { name: string; product?: { name: string } | null } | null;
  }[];
};

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  DRAFT: "ร่าง",
  ACKNOWLEDGED: "รับทราบแล้ว",
  CONFIRMED: "ยืนยันแล้ว",
  PARTIALLY_FULFILLED: "ส่งบางส่วน",
  FULFILLED: "ส่งครบแล้ว",
  BILLED: "ออกบิลแล้ว",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
  REJECTED: "ปฏิเสธ",
};

export async function getSupplierMe(): Promise<PortalMe> {
  return apiFetch<PortalMe>("/portal/me");
}

export type SupplierOwnProduct = {
  id: string;
  sku: string | null;
  price: string | number;
  minQty: string | number;
  isAvailable: boolean;
  serviceArea: string | null;
  stockQty: string | number | null;
  productVariant: {
    id: string;
    name: string;
    unit: string;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      category: string;
    };
  };
};

export type AvailableVariant = {
  id: string;
  name: string;
  unit: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    category: string;
  };
};

export type CreateSupplierProductInput = {
  productVariantId: string;
  price: number;
  sku?: string;
  minQty?: number;
  serviceArea?: string;
  leadTimeHours?: number;
  isAvailable?: boolean;
};

export async function listSupplierProducts(): Promise<{ products: SupplierOwnProduct[] }> {
  return apiFetch<{ products: SupplierOwnProduct[] }>("/supplier/products");
}

export async function listAvailableVariants(): Promise<{ variants: AvailableVariant[] }> {
  return apiFetch<{ variants: AvailableVariant[] }>("/supplier/products/available-variants");
}

export async function createSupplierProduct(input: CreateSupplierProductInput): Promise<{ product: SupplierOwnProduct }> {
  return apiFetch<{ product: SupplierOwnProduct }>("/supplier/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listSupplierPOs(): Promise<{ supplierPurchaseOrders: SupplierPO[] }> {
  return apiFetch("/partner/purchase-orders");
}

export async function getSupplierPO(id: string): Promise<{ supplierPurchaseOrder: SupplierPO }> {
  return apiFetch(`/partner/purchase-orders/${id}`);
}

export async function confirmSupplierPO(id: string, note?: string) {
  return apiFetch(`/partner/purchase-orders/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectSupplierPO(id: string, note?: string) {
  return apiFetch(`/partner/purchase-orders/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
