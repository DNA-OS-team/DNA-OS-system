const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type CollectionState =
  | "CURRENT" | "OVERDUE" | "WARNING" | "COLLECTION"
  | "PROMISED" | "PARTIAL" | "LEGAL" | "CLOSED";

export type CollectionNote = {
  id: string;
  customerCompanyId: string;
  note: string;
  collectionState: CollectionState;
  promisedPayDate: string | null;
  createdAt: string;
  createdByAdmin?: { id: string; username: string } | null;
};

export type DebtSnapshot = {
  id: string;
  customerCompanyId: string;
  collectionState: CollectionState;
  totalOutstanding: string;
  overdueAmount: string;
  daysOverdue: number;
  openInvoiceCount: number;
  firstContactAt: string | null;
  debtStartAt: string | null;
  lastRefreshedAt: string;
  customerCompany?: { id: string; name: string } | null;
  collectionNotes?: CollectionNote[];
  _count?: { collectionNotes: number };
};

export type DebtInvoice = {
  id: string;
  invoiceNo: string;
  invoiceStatus: string;
  dueDate: string | null;
  totalAmount: string;
  paidAmount: string;
  customerOrder?: { id: string; orderNo: string } | null;
  items?: { id: string; description: string; quantity: string; unit: string; unitPrice: string; totalPrice: string }[];
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

export function listDebts(params?: { state?: CollectionState; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.state) qs.set("state", params.state);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiFetch<{ debts: DebtSnapshot[] }>(`/admin/debt${query ? `?${query}` : ""}`);
}

export function getDebtDetail(customerCompanyId: string) {
  return apiFetch<{ snapshot: DebtSnapshot | null; invoices: DebtInvoice[] }>(
    `/admin/debt/${customerCompanyId}`
  );
}

export function recordFirstContact(customerCompanyId: string, note?: string) {
  return apiFetch<{ snapshot: DebtSnapshot }>(
    `/admin/debt/${customerCompanyId}/first-contact`,
    { method: "POST", body: JSON.stringify({ note: note ?? "บันทึกการติดต่อลูกค้าครั้งแรก" }) }
  );
}

export function addCollectionNote(customerCompanyId: string, input: { note: string; promisedPayDate?: string | null }) {
  return apiFetch<{ note: CollectionNote }>(
    `/admin/debt/${customerCompanyId}/notes`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function transitionState(customerCompanyId: string, toState: CollectionState, note?: string) {
  return apiFetch<{ snapshot: DebtSnapshot }>(
    `/admin/debt/${customerCompanyId}/state`,
    { method: "PUT", body: JSON.stringify({ toState, note }) }
  );
}

export function refreshDebt(customerCompanyId: string) {
  return apiFetch<{ snapshot: DebtSnapshot }>(
    `/admin/debt/${customerCompanyId}/refresh`,
    { method: "POST" }
  );
}

export function triggerAutoInvoice(orderId: string) {
  return apiFetch<{ invoice: { id: string; invoiceNo: string } }>(
    `/admin/debt/auto-invoice/${orderId}`,
    { method: "POST" }
  );
}
