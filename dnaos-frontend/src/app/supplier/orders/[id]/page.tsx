import type { Metadata } from "next";
import { SupplierPODetail } from "@/features/supplier-portal/supplier-po-detail";

export const metadata: Metadata = { title: "รายละเอียดใบสั่งซื้อ | DNA OS" };

export default async function SupplierPODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierPODetail poId={id} />;
}
