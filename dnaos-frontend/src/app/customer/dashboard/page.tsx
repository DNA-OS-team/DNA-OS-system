import type { Metadata } from "next";
import { CustomerDashboard } from "@/features/customer-portal/customer-dashboard";

export const metadata: Metadata = { title: "ภาพรวม | DNA OS" };

export default function CustomerDashboardPage() {
  return <CustomerDashboard />;
}
