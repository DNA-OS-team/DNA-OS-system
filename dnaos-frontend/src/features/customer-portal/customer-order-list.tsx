"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { useCustomerAuth } from "./use-customer-auth";
import {
  listCustomerOrders,
  type CustomerOrder,
  type CustomerOrderStatus,
} from "./customer-order-api";

const STATUS_OPTIONS: Array<{ value: CustomerOrderStatus | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SUBMITTED", label: "ส่งแล้ว" },
  { value: "QUOTED", label: "ส่ง QT แล้ว" },
  { value: "CONFIRMED", label: "ยืนยันแล้ว" },
  { value: "DISPATCHING", label: "กำลังจัดส่ง" },
  { value: "DELIVERED", label: "ส่งครบ" },
  { value: "INVOICED", label: "ออก Invoice แล้ว" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <Link href={`/customer/orders/${order.id}`} className="block group">
      <div className="rounded-2xl border bg-card px-4 py-4 transition-all hover:shadow-md active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <ClipboardList className="size-4 text-primary" />
              </div>
              <span className="font-mono font-semibold text-sm">{order.orderNo}</span>
            </div>
            {order.project && (
              <p className="text-xs text-muted-foreground truncate pl-10">
                {order.project.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <OrderStatusBadge status={order.status} />
            <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground pl-10">
          {order.customerSite && (
            <div className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{order.customerSite.siteName}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <ClipboardList className="size-3 shrink-0" />
            <span>{order.itemCount} รายการ</span>
          </div>
          {order.requestedDeliveryAt && (
            <div className="flex items-center gap-1">
              <CalendarDays className="size-3 shrink-0" />
              <span>ต้องการ {fmtDate(order.requestedDeliveryAt)}</span>
            </div>
          )}
        </div>

        <div className="mt-2 pl-10 text-xs text-muted-foreground/70">
          สร้างเมื่อ {fmtDate(order.createdAt)}
        </div>
      </div>
    </Link>
  );
}

export function CustomerOrderList() {
  const auth = useCustomerAuth("/customer/orders");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CustomerOrderStatus | "all">("all");

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    const t = window.setTimeout(() => {
      setIsLoading(true);
      listCustomerOrders({ status: status !== "all" ? status : undefined, q: q.trim() || undefined })
        .then((r) => { if (mounted) setOrders(r.orders); })
        .catch(() => {})
        .finally(() => { if (mounted) setIsLoading(false); });
    }, 250);
    return () => { mounted = false; window.clearTimeout(t); };
  }, [auth.status, q, status]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  const me = auth.me;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">สวัสดี,</p>
        <h1 className="text-xl font-bold tracking-tight">{me.displayName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{me.company.name}</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-xl"
            placeholder="ค้นหาเลข Order..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as CustomerOrderStatus | "all")}>
          <SelectTrigger className="h-10 rounded-xl w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl border bg-card animate-pulse" />
            ))}
          </>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ClipboardList className="size-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {status !== "all" ? "ลองเปลี่ยนตัวกรองสถานะ" : "คำสั่งซื้อของคุณจะแสดงที่นี่"}
            </p>
          </div>
        )}

        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {!isLoading && orders.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pb-4">
          {orders.length} รายการ
        </p>
      )}
    </div>
  );
}
