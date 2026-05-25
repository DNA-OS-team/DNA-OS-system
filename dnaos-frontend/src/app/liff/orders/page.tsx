"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useLiff } from "@/hooks/use-liff";
import { apiFetch } from "@/lib/api";
import type { CustomerOrder } from "@/features/customer-portal/customer-order-api";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง", SUBMITTED: "ส่งแล้ว", PRICING: "กำลังเสนอราคา",
  QUOTED: "ส่ง QT แล้ว", CONFIRMED: "ยืนยันแล้ว", PROCUREMENT: "จัดหาสินค้า",
  DISPATCHING: "กำลังจัดส่ง", PARTIALLY_DELIVERED: "ส่งบางส่วน",
  DELIVERED: "ส่งครบแล้ว", INVOICED: "ออก Invoice", PAID: "ชำระแล้ว", CANCELLED: "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  DISPATCHING: "bg-amber-100 text-amber-700",
  PARTIALLY_DELIVERED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function LiffOrdersPage() {
  const liff = useLiff();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (liff.status !== "ready") return;
    apiFetch<{ orders: CustomerOrder[] }>("/customer/orders")
      .then((r) => setOrders(r.orders))
      .finally(() => setLoading(false));
  }, [liff.status]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">คำสั่งซื้อของฉัน</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
          <ClipboardList className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link key={order.id} href={`/liff/orders/${order.id}`} className="block">
              <div className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 active:scale-[0.99] transition-transform">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardList className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{order.orderNo}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[order.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(order.createdAt)} · {order.itemCount} รายการ</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
