import { apiFetch } from "@/lib/api";

export type TransportJobStatus =
  | "CREATED" | "ASSIGNED" | "ACCEPTED" | "GOING_TO_PICKUP"
  | "ARRIVED_PICKUP" | "LOADED" | "IN_TRANSIT" | "ARRIVED_SITE"
  | "DELIVERED" | "COMPLETED" | "CANCELLED" | "FAILED";

export type TransportJob = {
  id: string;
  jobNo: string;
  status: TransportJobStatus;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledPickupAt: string | null;
  scheduledDeliveryAt: string | null;
  actualPickupAt: string | null;
  actualDeliveryAt: string | null;
  notes: string | null;
  createdAt: string;
  customerOrder?: { id: string; orderNo: string } | null;
  dropoffSite?: { siteName: string } | null;
};

export type PortalMe = {
  userId: string;
  role: string;
  displayName: string;
  pictureUrl: string | null;
  company: { id: string; name: string; type: string };
};

export const JOB_STATUS_LABEL: Record<TransportJobStatus, string> = {
  CREATED: "รอรับงาน",
  ASSIGNED: "ได้รับมอบหมาย",
  ACCEPTED: "รับงานแล้ว",
  GOING_TO_PICKUP: "กำลังไปรับสินค้า",
  ARRIVED_PICKUP: "ถึงจุดรับสินค้า",
  LOADED: "โหลดสินค้าแล้ว",
  IN_TRANSIT: "กำลังขนส่ง",
  ARRIVED_SITE: "ถึงหน้างาน",
  DELIVERED: "ส่งสำเร็จ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  FAILED: "ล้มเหลว",
};

export const NEXT_STATUS_LABEL: Partial<Record<TransportJobStatus, string>> = {
  ACCEPTED: "รับงาน",
  GOING_TO_PICKUP: "ออกเดินทาง",
  ARRIVED_PICKUP: "ถึงจุดรับ",
  LOADED: "โหลดสินค้าแล้ว",
  IN_TRANSIT: "ออกจากคลัง",
  ARRIVED_SITE: "ถึงหน้างาน",
  DELIVERED: "ส่งสำเร็จ",
};

export async function getPortalMe(): Promise<PortalMe> {
  return apiFetch<PortalMe>("/portal/me");
}

export async function listFleetJobs(params?: { status?: string }): Promise<{ jobs: TransportJob[] }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ jobs: TransportJob[] }>(`/fleet/jobs${query}`);
}

export async function getFleetJob(id: string): Promise<{ job: TransportJob; nextStatuses: TransportJobStatus[] }> {
  return apiFetch(`/fleet/jobs/${id}`);
}

export async function updateFleetJobStatus(id: string, toStatus: TransportJobStatus, note?: string) {
  return apiFetch(`/fleet/jobs/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ toStatus, note }),
  });
}
