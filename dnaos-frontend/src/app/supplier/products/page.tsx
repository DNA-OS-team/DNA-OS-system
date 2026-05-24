import type { Metadata } from "next";
import { SupplierProductList } from "@/features/supplier-portal/supplier-product-list";

export const metadata: Metadata = { title: "สินค้าของฉัน | DNA OS" };

export default function SupplierProductsPage() {
  return <SupplierProductList />;
}
