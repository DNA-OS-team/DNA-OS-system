import type { Metadata } from "next";
import { CustomerOrderList } from "@/features/customer-portal/customer-order-list";

export const metadata: Metadata = {
  title: "คำสั่งซื้อของฉัน | DNA OS",
};

export default function CustomerOrdersPage() {
  return <CustomerOrderList />;
}
