import type { Metadata } from "next";
import { SupplierPOList } from "@/features/supplier-portal/supplier-po-list";

export const metadata: Metadata = { title: "ใบสั่งซื้อ | DNA OS" };

export default function SupplierOrdersPage() {
  return <SupplierPOList />;
}
