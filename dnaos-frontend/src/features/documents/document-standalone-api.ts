const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type DocumentTypeCode = "ORD" | "BOQ" | "QT" | "PO" | "INV" | "RCP" | "PV" | "PMT";

export type CreateOption = {
  id: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
};

export type PartnerOption = CreateOption & { type: string };

export type ProjectOption = {
  id: string;
  projectNo: string;
  title: string;
  customerCompanyId: string;
};

export type OrderOption = {
  id: string;
  orderNo: string;
  customerCompanyId: string;
  status: string;
};

export type DocumentCreateOptions = {
  customers: CreateOption[];
  partners: PartnerOption[];
  projects: ProjectOption[];
  orders: OrderOption[];
};

export type StandaloneDocumentItem = {
  id: string;
  documentId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  sortOrder: number;
};

export type StandaloneDocument = {
  id: string;
  documentNo: string;
  documentType: DocumentTypeCode;
  documentDate: string;
  customerCompanyId: string | null;
  partnerCompanyId: string | null;
  projectId: string | null;
  customerOrderId: string | null;
  referenceNo: string | null;
  recipientAddress: string | null;
  notes: string | null;
  vatRate: string;
  subtotal: string;
  vatAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  customerCompany?: { id: string; name: string; taxId?: string | null; address?: string | null } | null;
  partnerCompany?: { id: string; name: string; taxId?: string | null } | null;
  project?: { id: string; projectNo: string; title: string } | null;
  customerOrder?: { id: string; orderNo: string } | null;
  items?: StandaloneDocumentItem[];
  _count?: { items: number };
};

export type CreateStandaloneDocumentInput = {
  documentType: DocumentTypeCode;
  documentDate: string;
  customerCompanyId?: string | null;
  partnerCompanyId?: string | null;
  projectId?: string | null;
  customerOrderId?: string | null;
  referenceNo?: string | null;
  recipientAddress?: string | null;
  notes?: string | null;
  vatRate: number;
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }[];
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getDocumentCreateOptions() {
  return apiFetch<DocumentCreateOptions>("/admin/documents/create-options");
}

export function createStandaloneDocument(input: CreateStandaloneDocumentInput) {
  return apiFetch<{ document: StandaloneDocument }>("/admin/documents/standalone", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listStandaloneDocuments(params?: { documentType?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.documentType) qs.set("documentType", params.documentType);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString();
  return apiFetch<{ documents: StandaloneDocument[] }>(
    `/admin/documents/standalone${query ? `?${query}` : ""}`
  );
}

export function getStandaloneDocument(id: string) {
  return apiFetch<{ document: StandaloneDocument }>(`/admin/documents/standalone/${id}`);
}
