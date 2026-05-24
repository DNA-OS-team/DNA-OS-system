import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerOrderForm } from "@/features/customer-portal/customer-order-form";

export const metadata: Metadata = { title: "สั่งซื้อสินค้า | DNA OS" };

export default function CustomerNewOrderPage() {
  return (
    <Suspense>
      <CustomerOrderForm />
    </Suspense>
  );
}
