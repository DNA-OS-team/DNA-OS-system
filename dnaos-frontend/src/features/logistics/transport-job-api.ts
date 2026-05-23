import { apiFetch } from "@/lib/api";
import type { FleetCompany, TransportJob, TransportJobStatus } from "./types";

export function listTransportJobs(params?: {
  status?: TransportJobStatus;
  orderId?: string;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.orderId) search.set("orderId", params.orderId);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return apiFetch<{ jobs: TransportJob[]; total: number }>(
    `/admin/logistics/jobs${qs ? `?${qs}` : ""}`
  );
}

export function getTransportJob(jobId: string) {
  return apiFetch<{ job: TransportJob; nextStatuses: TransportJobStatus[] }>(
    `/admin/logistics/jobs/${jobId}`
  );
}

export function createTransportJob(body: {
  orderId: string;
  supplierPurchaseOrderId?: string;
  pickupAddress: string;
  fleetCompanyId?: string;
  scheduledPickupAt?: string;
  scheduledDeliveryAt?: string;
  transportCost?: number;
  customerDeliveryFee?: number;
  notes?: string;
}) {
  return apiFetch<{ job: TransportJob }>("/admin/logistics/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function assignFleetToJob(jobId: string, fleetCompanyId: string) {
  return apiFetch<{ job: TransportJob }>(
    `/admin/logistics/jobs/${jobId}/assign`,
    {
      method: "POST",
      body: JSON.stringify({ fleetCompanyId }),
    }
  );
}

export function updateTransportJobStatus(
  jobId: string,
  toStatus: TransportJobStatus,
  note?: string
) {
  return apiFetch<{ job: TransportJob }>(
    `/admin/logistics/jobs/${jobId}/status`,
    {
      method: "POST",
      body: JSON.stringify({ toStatus, note }),
    }
  );
}

export function listFleetCompanies() {
  return apiFetch<{ companies: FleetCompany[] }>(
    "/admin/logistics/fleet-companies"
  );
}

export function getOrderTransportJobs(orderId: string) {
  return apiFetch<{ jobs: TransportJob[]; total: number }>(
    `/admin/logistics/jobs?orderId=${orderId}`
  );
}
