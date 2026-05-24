import type { Metadata } from "next";
import { CustomerProductList } from "@/features/customer-portal/customer-product-list";

export const metadata: Metadata = { title: "สินค้า | DNA OS" };

export default function CustomerProductsPage() {
  return <CustomerProductList />;
}
