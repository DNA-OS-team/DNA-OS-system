export type Customer = {
  id: string;
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  type: "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  siteCount?: number;
  customerCreditProfile?: CustomerCreditProfile | null;
  lineDisplayName?: string | null;
  linePictureUrl?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

export type CustomerOrderStatus =
  | "DRAFT" | "SUBMITTED" | "PRICING" | "QUOTED" | "CONFIRMED"
  | "PROCUREMENT" | "DISPATCHING" | "PARTIALLY_DELIVERED" | "DELIVERED"
  | "INVOICED" | "PAID" | "CANCELLED";

export type OrderRequestStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "CANCELLED";

export type CustomerOrderSummary = {
  id: string;
  orderNo: string;
  status: CustomerOrderStatus;
  requestedDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productVariant: { name: string; unit: string; product: { name: string } } | null;
  }>;
};

export type CustomerOrderRequestSummary = {
  id: string;
  reqNo: string;
  status: OrderRequestStatus;
  deliveryAddress: string;
  requestedDeliveryAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unit: string;
    productVariant: { name: string; product: { name: string } } | null;
  }>;
};

export type CustomerSite = {
  id: string;
  customerCompanyId: string;
  siteName: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  gpsLat: string | number | null;
  gpsLng: string | number | null;
  contactName: string | null;
  contactPhone: string | null;
  deliveryNote: string | null;
  accessRestriction: string | null;
  preferredDeliveryTime: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCreditProfile = {
  id: string;
  customerCompanyId: string;
  creditLimit: string | number;
  creditTermDays: number;
  currentOutstanding: string | number;
  overdueAmount: string | number;
  creditStatus: "NORMAL" | "WATCH" | "HOLD" | "BLOCKED";
  paymentBehaviorScore: number;
  updatedAt: string;
};
