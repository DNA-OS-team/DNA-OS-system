const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "VOID";
export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CHEQUE" | "CREDIT_CARD" | "OTHER";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  sortOrder: number;
};

export type Payment = {
  id: string;
  invoiceId: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: string;
  paidAt: string;
  referenceNo: string | null;
  bankRef: string | null;
  slipUrl: string | null;
  notes: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  invoiceStatus: InvoiceStatus;
  customerCompanyId: string;
  customerOrderId: string | null;
  projectId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  referenceNo: string | null;
  recipientAddress: string | null;
  notes: string | null;
  vatRate: string;
  subtotal: string;
  vatAmount: string;
  totalAmount: string;
  paidAmount: string;
  receiptNo: string | null;
  receiptIssuedAt: string | null;
  createdAt: string;
  customerCompany?: { id: string; name: string; taxId?: string | null; address?: string | null } | null;
  customerOrder?: { id: string; orderNo: string } | null;
  project?: { id: string; projectNo: string; title: string } | null;
  items?: InvoiceItem[];
  payments?: Payment[];
  _count?: { items: number; payments: number };
};

export type CreateInvoiceInput = {
  customerCompanyId: string;
  customerOrderId?: string | null;
  projectId?: string | null;
  dueDate?: string | null;
  referenceNo?: string | null;
  recipientAddress?: string | null;
  notes?: string | null;
  vatRate?: number;
  items: { description: string; quantity: number; unit: string; unitPrice: number }[];
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

export function listInvoices(params?: { status?: InvoiceStatus; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiFetch<{ invoices: Invoice[] }>(`/admin/invoices${query ? `?${query}` : ""}`);
}

export function createInvoice(input: CreateInvoiceInput) {
  return apiFetch<{ invoice: Invoice }>("/admin/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getInvoice(id: string) {
  return apiFetch<{ invoice: Invoice }>(`/admin/invoices/${id}`);
}

export function sendInvoice(id: string) {
  return apiFetch<{ invoice: Invoice }>(`/admin/invoices/${id}/send`, { method: "POST" });
}

export function voidInvoice(id: string) {
  return apiFetch<{ invoice: Invoice }>(`/admin/invoices/${id}/void`, { method: "POST" });
}

export function recordPayment(
  invoiceId: string,
  input: {
    paymentMethod: PaymentMethod;
    amount: number;
    paidAt: string;
    referenceNo?: string | null;
    bankRef?: string | null;
    slipUrl?: string | null;
    notes?: string | null;
  }
) {
  return apiFetch<{ payment: Payment }>(`/admin/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmPayment(invoiceId: string, paymentId: string) {
  return apiFetch<{ invoice: Invoice }>(
    `/admin/invoices/${invoiceId}/payments/${paymentId}/confirm`,
    { method: "POST" }
  );
}

export function rejectPayment(invoiceId: string, paymentId: string) {
  return apiFetch<{ invoice: Invoice }>(
    `/admin/invoices/${invoiceId}/payments/${paymentId}/reject`,
    { method: "POST" }
  );
}
