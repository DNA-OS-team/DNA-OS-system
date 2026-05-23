import type { Customer, CustomerSite } from "@/features/customers/types";
import type { DocumentGroup, Project } from "@/features/projects/types";

export type TransportJobStatus =
  | "CREATED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "GOING_TO_PICKUP"
  | "ARRIVED_PICKUP"
  | "LOADED"
  | "IN_TRANSIT"
  | "ARRIVED_SITE"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type TransportJobItem = {
  id: string;
  transportJobId: string;
  productVariantId: string | null;
  description: string;
  quantity: string | number;
  unit: string;
  sortOrder: number;
  createdAt: string;
};

export type TransportJobStatusHistory = {
  id: string;
  transportJobId: string;
  fromStatus: TransportJobStatus | null;
  toStatus: TransportJobStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type TransportJob = {
  id: string;
  jobNo: string;
  documentGroupId: string;
  customerOrderId: string;
  supplierPurchaseOrderId: string | null;
  fleetCompanyId: string | null;
  dropoffSiteId: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  status: TransportJobStatus;
  scheduledPickupAt: string | null;
  scheduledDeliveryAt: string | null;
  actualPickupAt: string | null;
  actualDeliveryAt: string | null;
  transportCost: string | number;
  customerDeliveryFee: string | number;
  fleetResponseNote: string | null;
  assignedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documentGroup?: DocumentGroup & { project?: Project };
  customerOrder?: {
    id: string;
    orderNo: string;
    customerCompany?: Customer;
    customerSite?: CustomerSite;
  };
  fleetCompany?: { id: string; name: string } | null;
  dropoffSite?: CustomerSite | null;
  items?: TransportJobItem[];
  statusHistory?: TransportJobStatusHistory[];
};

export type FleetCompany = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};
