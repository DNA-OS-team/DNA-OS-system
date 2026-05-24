import type { ProductVariant } from "@/features/products/types";

export type CompanySummary = {
  id: string;
  name: string;
  type: "SUPPLIER" | "CUSTOMER" | "CORE" | "FLEET";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export type PartnerProductSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type InventoryMovementType =
  | "INITIAL"
  | "ADJUST"
  | "RESERVE"
  | "RELEASE"
  | "FULFILL"
  | "CANCEL";

export type ProductVariantOption = ProductVariant & {
  product?: {
    id: string;
    name: string;
    categoryId: string;
    defaultUnit: string;
    category?: {
      id: string;
      name: string;
    };
  };
};

export type PartnerProductSubmission = {
  id: string;
  supplierCompanyId: string;
  productVariantId: string | null;
  supplierProductId: string | null;
  requestedProductName: string;
  requestedCategoryName: string | null;
  description: string | null;
  unit: string;
  price: string | number;
  stockQty: string | number;
  minQty: string | number;
  serviceArea: string | null;
  status: PartnerProductSubmissionStatus;
  adminReviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  supplierCompany?: CompanySummary;
  productVariant?: ProductVariantOption | null;
  supplierProduct?: SupplierProduct | null;
  reviewer?: {
    id: string;
    name: string;
    username: string;
  } | null;
};

export type SupplierProduct = {
  id: string;
  supplierCompanyId: string;
  productVariantId: string;
  sku: string | null;
  price: string | number;
  minQty: string | number;
  serviceArea: string | null;
  leadTimeHours: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  supplierCompany?: CompanySummary;
  productVariant?: ProductVariantOption;
  inventoryMovements?: SupplierInventoryMovement[];
};

export type SupplierInventory = {
  id: string;
  supplierProductId: string;
  stockQty: string | number;
  reservedQty: string | number;
  availableQty: string | number;
  unit: string;
  lowStockThreshold: string | number;
  updatedBy: string | null;
  updatedAt: string;
  supplierProduct?: SupplierProduct;
};

export type SupplierInventoryMovement = {
  id: string;
  supplierProductId: string;
  movementType: InventoryMovementType;
  qty: string | number;
  beforeQty: string | number;
  afterQty: string | number;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};
