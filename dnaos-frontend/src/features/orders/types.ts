import type { Customer, CustomerSite } from "@/features/customers/types";
import type { DocumentGroup, Project } from "@/features/projects/types";
import type { ProductVariantOption } from "@/features/partner-products/types";

export type CustomerOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PRICING"
  | "QUOTED"
  | "CONFIRMED"
  | "CANCELLED";

export type CustomerOrderItem = {
  id: string;
  customerOrderId: string;
  productVariantId: string;
  description: string | null;
  quantity: string | number;
  unit: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  productVariant?: ProductVariantOption;
};

export type CustomerOrder = {
  id: string;
  orderNo: string;
  projectId: string;
  documentGroupId: string;
  customerCompanyId: string;
  customerSiteId: string;
  status: CustomerOrderStatus;
  requestedDeliveryAt: string | null;
  deliveryNote: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  documentGroup?: DocumentGroup;
  customerCompany?: Customer;
  customerSite?: CustomerSite;
  items?: CustomerOrderItem[];
  itemCount?: number;
};

export type CustomerOrderProjectOption = Project & {
  customerCompany?: Customer;
  customerSite?: CustomerSite;
};

export type CustomerOrderOptions = {
  projects: CustomerOrderProjectOption[];
  productVariants: ProductVariantOption[];
};

export type PricingSnapshotStatus = "CALCULATED" | "NEEDS_REVIEW";

export type PricingSupplierCompany = {
  id: string;
  name: string;
};

export type PricingSupplierProduct = {
  id: string;
  sku: string | null;
  price: string | number;
  isAvailable: boolean;
  supplierCompany?: PricingSupplierCompany;
};

export type PricingSnapshotItem = {
  id: string;
  pricingSnapshotId: string;
  customerOrderItemId: string;
  productVariantId: string;
  supplierProductId: string | null;
  supplierCompanyId: string | null;
  quantity: string | number;
  unit: string;
  supplierUnitCost: string | number;
  supplierTotalCost: string | number;
  sellUnitPrice: string | number;
  sellTotalPrice: string | number;
  marginAmount: string | number;
  marginPercent: string | number;
  isAvailable: boolean;
  hasEnoughStock: boolean;
  warning: string | null;
  createdAt: string;
  customerOrderItem?: CustomerOrderItem;
  productVariant?: ProductVariantOption;
  supplierProduct?: PricingSupplierProduct | null;
  supplierCompany?: PricingSupplierCompany | null;
};

export type PricingSnapshot = {
  id: string;
  customerOrderId: string;
  status: PricingSnapshotStatus;
  totalSupplierCost: string | number;
  totalSellPrice: string | number;
  totalMargin: string | number;
  marginPercent: string | number;
  createdAt: string;
  items: PricingSnapshotItem[];
};

export type BoqStatus = "DRAFT" | "FINALIZED" | "CANCELLED";

export type BoqItem = {
  id: string;
  boqId: string;
  customerOrderItemId: string;
  productVariantId: string;
  description: string | null;
  quantity: string | number;
  unit: string;
  supplierUnitCost: string | number;
  supplierTotalCost: string | number;
  sellUnitPrice: string | number;
  sellTotalPrice: string | number;
  marginAmount: string | number;
  marginPercent: string | number;
  sortOrder: number;
  createdAt: string;
  customerOrderItem?: CustomerOrderItem;
  productVariant?: ProductVariantOption;
};

export type Boq = {
  id: string;
  boqNo: string;
  documentGroupId: string;
  customerOrderId: string;
  customerCompanyId: string;
  pricingSnapshotId: string;
  status: BoqStatus;
  subtotal: string | number;
  vatRate: string | number;
  vatAmount: string | number;
  totalAmount: string | number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: BoqItem[];
};
