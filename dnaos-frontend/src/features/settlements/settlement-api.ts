const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type SettlementPartnerType = "SUPPLIER" | "FLEET";
export type SettlementStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PAYMENT_ORDERED" | "PAID" | "CANCELLED";
export type SettlementItemRefType = "PURCHASE_ORDER" | "TRANSPORT_JOB";

export type SettlementItem = {
  id: string;
  settlementBatchId: string;
  refType: SettlementItemRefType;
  refId: string;
  description: string;
  grossAmount: string;
  whtRate: string;
  whtAmount: string;
  netAmount: string;
  sortOrder: number;
};

export type SettlementBatch = {
  id: string;
  batchNo: string;
  partnerCompanyId: string;
  partnerType: SettlementPartnerType;
  status: SettlementStatus;
  periodFrom: string;
  periodTo: string;
  grossAmount: string;
  whtAmount: string;
  netAmount: string;
  paymentDueAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  partnerCompany?: { id: string; name: string; bankName?: string | null; bankAccountNo?: string | null; isIndividual?: boolean } | null;
  createdByAdmin?: { id: string; username: string } | null;
  approvedByAdmin?: { id: string; username: string } | null;
  items?: SettlementItem[];
  _count?: { items: number };
};

export type SettlementPreview = {
  items: {
    refType: SettlementItemRefType;
    refId: string;
    description: string;
    grossAmount: number;
    whtRate: number;
    whtAmount: number;
    netAmount: number;
  }[];
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function listSettlements(params?: { status?: SettlementStatus; partnerType?: SettlementPartnerType; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.partnerType) qs.set("partnerType", params.partnerType);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiFetch<{ settlements: SettlementBatch[] }>(`/admin/settlements${query ? `?${query}` : ""}`);
}

export function previewSettlement(partnerCompanyId: string, partnerType: SettlementPartnerType) {
  return apiFetch<{ preview: SettlementPreview }>(
    `/admin/settlements/preview?partnerCompanyId=${partnerCompanyId}&partnerType=${partnerType}`
  );
}

export function getSettlement(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}`);
}

export function createSettlement(input: {
  partnerCompanyId: string;
  partnerType: SettlementPartnerType;
  periodFrom: string;
  periodTo: string;
  notes?: string;
}) {
  return apiFetch<{ settlement: SettlementBatch }>("/admin/settlements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitSettlement(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}/submit`, { method: "POST" });
}

export function approveSettlement(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}/approve`, { method: "POST" });
}

export function createPV(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}/pv`, { method: "POST" });
}

export function markPaid(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}/paid`, { method: "POST" });
}

export function cancelSettlement(id: string) {
  return apiFetch<{ settlement: SettlementBatch }>(`/admin/settlements/${id}/cancel`, { method: "POST" });
}
