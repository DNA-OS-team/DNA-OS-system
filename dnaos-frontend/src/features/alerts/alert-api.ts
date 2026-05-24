import { apiFetch } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertType =
  | "NEW_ORDER" | "SUPPLIER_NOT_CONFIRMED" | "TRUCK_NOT_ASSIGNED" | "TRUCK_DELAYED"
  | "DOCUMENT_PENDING_APPROVAL" | "INVOICE_OVERDUE" | "PAYMENT_UNRECONCILED"
  | "LOW_MARGIN" | "CREDIT_LIMIT_EXCEEDED" | "DELIVERY_PROOF_MISSING"
  | "LINE_SEND_FAILED" | "PDF_GENERATION_FAILED";

export type AlertItem = {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  entityType: string | null;
  entityId: string | null;
  customerCompanyId: string | null;
  invoiceId: string | null;
  message: string;
  isRead: boolean;
  resolvedAt: string | null;
  resolvedByAdminId: string | null;
  createdAt: string;
};

export type AlertCounts = {
  critical: number;
  warning: number;
  info: number;
  total: number;
};

export async function listAlerts(params?: { severity?: AlertSeverity; alertType?: AlertType; take?: number }) {
  const qs = new URLSearchParams();
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.alertType) qs.set("alertType", params.alertType);
  if (params?.take) qs.set("take", String(params.take));
  const url = `/admin/alerts${qs.size ? `?${qs}` : ""}`;
  return apiFetch<{ alerts: AlertItem[] }>(url);
}

export async function getAlertCounts(): Promise<AlertCounts> {
  return apiFetch<AlertCounts>("/admin/alerts/counts");
}

export async function resolveAlert(alertId: string): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/admin/alerts/${alertId}/resolve`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "resolve ไม่สำเร็จ");
  }
  const data = await res.json() as { alert: AlertItem };
  return data.alert;
}

export async function markAlertRead(alertId: string): Promise<void> {
  await fetch(`${API_BASE}/admin/alerts/${alertId}/read`, {
    method: "PUT",
    credentials: "include",
  });
}
