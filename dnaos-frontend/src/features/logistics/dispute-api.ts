const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type DisputeType =
  | "SHORT_DELIVERY" | "WRONG_MATERIAL" | "LATE_DELIVERY" | "DAMAGED_MATERIAL"
  | "PRICE_DISPUTE" | "PAYMENT_DISPUTE" | "CUSTOMER_REJECTED" | "TRANSPORT_FAILED" | "OTHER";

export type DisputeStatus =
  | "OPEN" | "INVESTIGATING" | "WAITING_PARTNER" | "WAITING_CUSTOMER"
  | "RESOLVED" | "REJECTED" | "CLOSED";

export type DeliveryProofType =
  | "PHOTO_BEFORE_LOADING" | "PHOTO_AFTER_LOADING" | "PHOTO_AT_SITE"
  | "SCALE_TICKET" | "DELIVERY_NOTE" | "CUSTOMER_SIGNATURE" | "GPS_LOCATION" | "OTHER";

export type DeliveryProof = {
  id: string;
  transportJobId: string;
  proofType: DeliveryProofType;
  fileUrl: string | null;
  note: string | null;
  createdAt: string;
};

export type Dispute = {
  id: string;
  disputeNo: string;
  customerOrderId: string | null;
  transportJobId: string | null;
  supplierPoId: string | null;
  disputeType: DisputeType;
  status: DisputeStatus;
  description: string;
  resolutionNote: string | null;
  financialImpact: string | null;
  createdAt: string;
  updatedAt: string;
  customerOrder?: { id: string; orderNo: string } | null;
  transportJob?: { id: string; jobNo: string } | null;
  supplierPo?: { id: string; poNo: string } | null;
  openedBy?: { id: string; name: string } | null;
  closedBy?: { id: string; name: string } | null;
  statusHistory?: {
    id: string;
    fromStatus: DisputeStatus | null;
    toStatus: DisputeStatus;
    note: string | null;
    changedBy: string | null;
    createdAt: string;
  }[];
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

// --- Delivery Proof ---
export function listDeliveryProofs(jobId: string) {
  return apiFetch<{ proofs: DeliveryProof[]; hasRequiredProofs: boolean }>(
    `/admin/logistics/jobs/${jobId}/proofs`
  );
}

export function addDeliveryProof(
  jobId: string,
  input: { proofType: DeliveryProofType; fileUrl?: string; note?: string }
) {
  return apiFetch<{ proof: DeliveryProof }>(`/admin/logistics/jobs/${jobId}/proofs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteDeliveryProof(jobId: string, proofId: string) {
  return apiFetch<void>(`/admin/logistics/jobs/${jobId}/proofs/${proofId}`, {
    method: "DELETE",
  });
}

// --- Disputes ---
export function listDisputes(params?: { status?: DisputeStatus; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiFetch<{ disputes: Dispute[] }>(`/admin/disputes${query ? `?${query}` : ""}`);
}

export function createDispute(input: {
  customerOrderId?: string | null;
  transportJobId?: string | null;
  supplierPoId?: string | null;
  disputeType: DisputeType;
  description: string;
  financialImpact?: number | null;
}) {
  return apiFetch<{ dispute: Dispute }>("/admin/disputes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDispute(id: string) {
  return apiFetch<{ dispute: Dispute }>(`/admin/disputes/${id}`);
}

export function updateDisputeStatus(
  id: string,
  input: { toStatus: DisputeStatus; note?: string; resolutionNote?: string }
) {
  return apiFetch<{ dispute: Dispute }>(`/admin/disputes/${id}/status`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
