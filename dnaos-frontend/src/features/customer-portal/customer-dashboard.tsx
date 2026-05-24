"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "./use-customer-auth";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { apiFetch } from "@/lib/api";
import type { CustomerOrderStatus } from "./customer-order-api";

type DashboardOrder = {
  id: string;
  orderNo: string;
  status: CustomerOrderStatus;
  createdAt: string;
  requestedDeliveryAt: string | null;
  project?: { title: string } | null;
  customerSite?: { siteName: string } | null;
  items: {
    id: string;
    description: string | null;
    quantity: string | number;
    unit: string;
    productVariant?: { name: string; product?: { name: string } | null } | null;
  }[];
};

type DashboardData = {
  orders: DashboardOrder[];
  counts: Partial<Record<CustomerOrderStatus, number>>;
};

const STATUS_LABEL: Partial<Record<CustomerOrderStatus, string>> = {
  DRAFT: "ร่าง",
  SUBMITTED: "รอดำเนินการ",
  PRICING: "กำลังเสนอราคา",
  QUOTED: "เสนอราคาแล้ว",
  CONFIRMED: "ยืนยันแล้ว",
  PROCUREMENT: "จัดหาสินค้า",
  DISPATCHING: "กำลังจัดส่ง",
  PARTIALLY_DELIVERED: "ส่งบางส่วน",
  DELIVERED: "ส่งครบแล้ว",
  INVOICED: "ออกใบแจ้งหนี้",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
};

const ACTIVE_STATUSES: CustomerOrderStatus[] = [
  "SUBMITTED", "PRICING", "QUOTED", "CONFIRMED", "PROCUREMENT", "DISPATCHING", "PARTIALLY_DELIVERED",
];

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border bg-card px-4 py-3 space-y-1 ${color}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OrderRow({ order }: { order: DashboardOrder }) {
  return (
    <Link href={`/customer/orders/${order.id}`}
      className="block rounded-2xl border bg-card hover:border-primary/40 active:scale-[0.98] transition-all overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-mono font-bold text-sm">{order.orderNo}</p>
          {order.project && (
            <p className="text-xs text-muted-foreground truncate">— {order.project.title}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Meta */}
      <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-b">
        {order.customerSite && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />{order.customerSite.siteName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />สั่ง {fmtDate(order.createdAt)}
        </span>
        {order.requestedDeliveryAt && (
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />ต้องการ {fmtDate(order.requestedDeliveryAt)}
          </span>
        )}
      </div>

      {/* Items */}
      {order.items.length > 0 && (
        <div className="divide-y">
          {order.items.slice(0, 5).map((item) => (
            <div key={item.id} className="px-4 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <Package className="size-3.5 text-muted-foreground shrink-0" />
                <p className="text-sm truncate">
                  {item.productVariant?.product?.name ?? item.description ?? "-"}
                </p>
                {item.productVariant?.name && (
                  <span className="text-xs text-muted-foreground shrink-0">({item.productVariant.name})</span>
                )}
              </div>
              <p className="text-sm tabular-nums shrink-0 font-medium">
                {Number(item.quantity).toLocaleString("th-TH")} <span className="text-muted-foreground font-normal">{item.unit}</span>
              </p>
            </div>
          ))}
          {order.items.length > 5 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
              และอีก {order.items.length - 5} รายการ
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

export function CustomerDashboard() {
  const auth = useCustomerAuth("/customer/dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    apiFetch<DashboardData>("/customer/dashboard")
      .then((d) => { if (mounted) setData(d); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>;
  }

  const activeCount = data
    ? ACTIVE_STATUSES.reduce((sum, s) => sum + (data.counts[s] ?? 0), 0)
    : 0;
  const deliveredCount = (data?.counts["DELIVERED"] ?? 0) + (data?.counts["PAID"] ?? 0);
  const totalCount = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-5 pt-2">
      {/* User header */}
      <div>
        <p className="font-bold text-lg">{auth.me.company.name}</p>
        <p className="text-sm text-muted-foreground">{auth.me.displayName}</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="ออร์เดอร์ทั้งหมด" value={totalCount} color="" />
          <StatCard label="กำลังดำเนินการ" value={activeCount} color="border-amber-200" />
          <StatCard label="ส่งแล้ว" value={deliveredCount} color="border-green-200" />
        </div>
      )}

      {/* Orders */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">คำสั่งซื้อล่าสุด</p>
        <Link href="/customer/orders" className="flex items-center gap-1 text-xs text-primary hover:underline">
          ดูทั้งหมด <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : !data || data.orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">ยังไม่มีคำสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
          {data.orders.length >= 20 && (
            <Link href="/customer/orders"
              className="flex items-center justify-center gap-1 text-sm text-primary py-2 hover:underline">
              ดูคำสั่งซื้อทั้งหมด <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}

      {/* Status legend */}
      {data && Object.keys(data.counts).length > 0 && (
        <div className="rounded-2xl border bg-card px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">สรุปตามสถานะ</p>
          <div className="space-y-1">
            {(Object.entries(data.counts) as [CustomerOrderStatus, number][])
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={status} />
                    <span className="text-muted-foreground">{STATUS_LABEL[status] ?? status}</span>
                  </div>
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
