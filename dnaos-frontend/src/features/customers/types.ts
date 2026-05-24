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
