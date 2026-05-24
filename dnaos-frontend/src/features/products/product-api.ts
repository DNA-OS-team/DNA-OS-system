import { apiFetch } from "@/lib/api";
import type { Product, ProductCategory, ProductVariant } from "./types";
import type {
  CategoryFormValues,
  ProductFormValues,
  VariantFormValues,
} from "./schemas";

export type ProductListFilters = {
  q?: string;
  categoryId?: string;
  isActive?: "all" | "true" | "false";
};

export function listCategories() {
  return apiFetch<{ categories: ProductCategory[] }>("/admin/products/categories");
}

export function createCategory(input: CategoryFormValues) {
  return apiFetch<{ category: ProductCategory }>("/admin/products/categories", {
    method: "POST",
    body: JSON.stringify(sanitizeCategoryInput(input)),
  });
}

export function updateCategory(categoryId: string, input: CategoryFormValues) {
  return apiFetch<{ category: ProductCategory }>(
    `/admin/products/categories/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(sanitizeCategoryInput(input)),
    }
  );
}

export function listProducts(filters: ProductListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters.isActive && filters.isActive !== "all") {
    params.set("isActive", filters.isActive);
  }

  const query = params.toString();

  return apiFetch<{ products: Product[] }>(
    `/admin/products${query ? `?${query}` : ""}`
  );
}

export function getProduct(productId: string) {
  return apiFetch<{ product: Product }>(`/admin/products/${productId}`);
}

export function createProduct(input: ProductFormValues) {
  return apiFetch<{ product: Product }>("/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(productId: string, input: ProductFormValues) {
  return apiFetch<{ product: Product }>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listVariants(productId: string) {
  return apiFetch<{ product: Product; variants: ProductVariant[] }>(
    `/admin/products/${productId}/variants`
  );
}

export function createVariant(productId: string, input: VariantFormValues) {
  return apiFetch<{ variant: ProductVariant }>(
    `/admin/products/${productId}/variants`,
    {
      method: "POST",
      body: JSON.stringify(sanitizeVariantInput(input)),
    }
  );
}

export function updateVariant(
  productId: string,
  variantId: string,
  input: VariantFormValues
) {
  return apiFetch<{ variant: ProductVariant }>(
    `/admin/products/${productId}/variants/${variantId}`,
    {
      method: "PATCH",
      body: JSON.stringify(sanitizeVariantInput(input)),
    }
  );
}

function sanitizeCategoryInput(input: CategoryFormValues) {
  return {
    ...input,
    sortOrder: Number(input.sortOrder),
  };
}

function sanitizeVariantInput(input: VariantFormValues) {
  return {
    name: input.name,
    unit: input.unit,
    specs: input.specsJson ? JSON.parse(input.specsJson) : {},
    isActive: input.isActive,
  };
}
