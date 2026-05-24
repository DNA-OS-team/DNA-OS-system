import type { Metadata } from "next";
import { CustomerOrderDetail } from "@/features/customer-portal/customer-order-detail";

export const metadata: Metadata = {
  title: "รายละเอียดคำสั่งซื้อ | DNA OS",
};

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerOrderDetail orderId={id} />;
}
