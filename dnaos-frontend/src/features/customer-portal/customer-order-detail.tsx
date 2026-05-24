"use client";

import { ArrowLeft, CalendarDays, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { useCustomerAuth } from "./use-customer-auth";
import { getCustomerOrder, type CustomerOrder } from "./customer-order-api";

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CustomerOrderDetail({ orderId }: { orderId: string }) {
  const auth = useCustomerAuth(`/customer/orders/${orderId}`);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    getCustomerOrder(orderId)
      .then((r) => { if (mounted) setOrder(r.order); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status, orderId]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-2 space-y-4">
        <Link href="/customer/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> กลับ
        </Link>
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-muted-foreground">{error ?? "ไม่พบคำสั่งซื้อ"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Back */}
      <Link href="/customer/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> คำสั่งซื้อทั้งหมด
      </Link>

      {/* Order header */}
      <div className="rounded-2xl border bg-card px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">หมายเลขคำสั่งซื้อ</p>
            <p className="font-mono font-bold text-lg">{order.orderNo}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="divide-y text-sm">
          {order.project && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">โปรเจกต์</span>
              <span className="font-medium text-right">{order.project.title}</span>
            </div>
          )}
          {order.customerSite && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                <span>สถานที่ส่ง</span>
              </div>
              <span className="font-medium">{order.customerSite.siteName}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              <span>วันที่สร้าง</span>
            </div>
            <span>{fmtDate(order.createdAt)}</span>
          </div>
          {order.requestedDeliveryAt && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>ต้องการส่งภายใน</span>
              </div>
              <span className="font-medium">{fmtDate(order.requestedDeliveryAt)}</span>
            </div>
          )}
          {order.deliveryNote && (
            <div className="py-2">
              <p className="text-muted-foreground mb-1">หมายเหตุ</p>
              <p className="text-sm">{order.deliveryNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">รายการสินค้า ({order.items.length})</span>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productVariant?.product?.name ?? item.description ?? "-"}
                    </p>
                    {item.productVariant?.name && (
                      <p className="text-xs text-muted-foreground">{item.productVariant.name}</p>
                    )}
                  </div>
                  <div className="text-sm text-right shrink-0 tabular-nums">
                    <span className="font-medium">{Number(item.quantity).toLocaleString("th-TH")}</span>
                    <span className="text-muted-foreground ml-1">{item.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
