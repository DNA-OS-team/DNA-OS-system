export type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  defaultUnit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
  variantCount?: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  unit: string;
  specs: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
