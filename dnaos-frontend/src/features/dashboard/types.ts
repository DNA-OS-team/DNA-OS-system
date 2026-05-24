export type AlertCounts = {
  critical: number;
  warning: number;
  info: number;
  total: number;
};

export type DashboardMetricSet = {
  customers: number;
  suppliers: number;
  products: number;
  projects: number;
  documentGroups: number;
  pendingPartnerProducts: number;
  lowStockItems: number;
  // Executive
  grossMarginPct?: number | null;
  revenueLast30d?: number;
  // Operations
  newOrders: number;
  pendingPOs: number;
  trucksNotAssigned: number;
  // Finance
  unpaidInvoices: number;
  overdueInvoices: number;
  paymentUnreconciled?: number;
  totalOutstanding: number;
  supplierPayable: number;
  fleetPayable: number;
  // Alerts
  alerts?: AlertCounts;
};

export type RecentAlert = {
  id: string;
  alertType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type DashboardPartnerProduct = {
  id: string;
  requestedProductName: string;
  requestedCategoryName: string | null;
  unit: string;
  price: string | number;
  stockQty: string | number;
  createdAt: string;
  supplierCompany?: {
    id: string;
    name: string;
  };
  productVariant?: {
    id: string;
    name: string;
    product?: {
      id: string;
      name: string;
    };
  } | null;
};

export type DashboardInventoryItem = {
  id: string;
  supplierProductId: string;
  availableQty: string | number;
  lowStockThreshold: string | number;
  unit: string;
  updatedAt: string;
  supplierProduct?: {
    id: string;
    supplierCompany?: {
      id: string;
      name: string;
    };
    productVariant?: {
      id: string;
      name: string;
      product?: {
        id: string;
        name: string;
      };
    };
  };
};

export type DashboardProject = {
  id: string;
  projectNo: string;
  title: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  customerCompany?: {
    id: string;
    name: string;
  };
  customerSite?: {
    id: string;
    siteName: string;
  };
};

export type AdminDashboardData = {
  metrics: DashboardMetricSet;
  recentAlerts: RecentAlert[];
  pendingPartnerProducts: DashboardPartnerProduct[];
  lowStockItems: DashboardInventoryItem[];
  recentProjects: DashboardProject[];
};
