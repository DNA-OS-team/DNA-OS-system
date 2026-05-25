"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { CustomerOrder } from "@/features/customer-portal/customer-order-api";

const TIMELINE: { status: string; label: string }[] = [
  { status: "SUBMITTED", label: "ส่งคำสั่งซื้อแล้ว" },
  { status: "CONFIRMED", label: "ยืนยันคำสั่งซื้อ" },
  { status: "DISPATCHING", label: "กำลังจัดส่ง" },
  { status: "PARTIALLY_DELIVERED", label: "ส่งบางส่วน" },
  { status: "DELIVERED", label: "ส่งครบแล้ว" },
  { status: "INVOICED", label: "ออก Invoice แล้ว" },
  { status: "PAID", label: "ชำระเงินแล้ว" },
];

const STATUS_ORDER = [
  "DRAFT","SUBMITTED","PRICING","QUOTED","CONFIRMED",
  "PROCUREMENT","DISPATCHING","PARTIALLY_DELIVERED",
  "DELIVERED","INVOICED","PAID","CANCELLED",
];

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function fmtPrice(n: string | number) {
  return Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function LiffOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ order: CustomerOrder }>(`/customer/orders/${id}`)
      .then((r) => setOrder(r.order))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">ไม่พบคำสั่งซื้อ</p>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-screen space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full border">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground">คำสั่งซื้อ</p>
          <h1 className="font-mono text-base font-bold">{order.orderNo}</h1>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">สถานะการจัดส่ง</p>
          <div className="space-y-0">
            {TIMELINE.map((step, idx) => {
              const stepIdx = STATUS_ORDER.indexOf(step.status);
              const done = currentIdx >= stepIdx;
              const current = STATUS_ORDER[currentIdx] === step.status;
              return (
                <div key={step.status} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 className={`size-5 ${current ? "text-primary" : "text-primary/50"}`} />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/30" />
                    )}
                    {idx < TIMELINE.length - 1 && (
                      <div className={`w-0.5 h-5 ${done ? "bg-primary/30" : "bg-muted"}`} />
                    )}
                  </div>
                  <p className={`pb-5 text-sm ${current ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {step.label}
                    {current && <span className="ml-2 text-xs font-normal">← ตอนนี้</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="font-semibold text-destructive">คำสั่งซื้อถูกยกเลิก</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-2xl border bg-card p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">วันที่สั่ง</span>
          <span>{fmtDate(order.createdAt)}</span>
        </div>
        {order.requestedDeliveryAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">ต้องการวันที่</span>
            <span>{fmtDate(order.requestedDeliveryAt)}</span>
          </div>
        )}
        {order.customerSite && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">ไซต์งาน</span>
            <span>{order.customerSite.siteName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">รายการสินค้า</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {item.productVariant?.product?.name ?? item.description ?? "สินค้า"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.productVariant?.name} · {fmtPrice(item.quantity)} {item.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
