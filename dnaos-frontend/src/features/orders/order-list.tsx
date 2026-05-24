"use client";

import { Building2, CalendarDays, ClipboardList, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { listOrders } from "./order-api";
import type { CustomerOrder, CustomerOrderStatus } from "./types";

const STATUS_OPTIONS: Array<{ value: "all" | CustomerOrderStatus; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SUBMITTED", label: "ส่งแล้ว" },
  { value: "PRICING", label: "กำหนดราคา" },
  { value: "QUOTED", label: "ส่ง QT แล้ว" },
  { value: "CONFIRMED", label: "ยืนยันแล้ว" },
  { value: "PROCUREMENT", label: "จัดซื้อ" },
  { value: "DISPATCHING", label: "กำลังส่ง" },
  { value: "DELIVERED", label: "ส่งครบ" },
  { value: "INVOICED", label: "ออก Invoice แล้ว" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrderList() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CustomerOrderStatus>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      setIsLoading(true);
      listOrders({ q: query, status })
        .then((r) => { if (active) setOrders(r.orders); })
        .catch(() => {})
        .finally(() => { if (active) setIsLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(t); };
  }, [query, status]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คำสั่งซื้อ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">จัดการคำสั่งซื้อ BOQ และใบเสนอราคา</p>
        </div>
        <Link className={buttonVariants()} href="/admin/orders/new">
          <Plus className="size-4" />
          สร้างคำสั่งซื้อใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="ค้นหาเลข Order หรือชื่อลูกค้า..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | CustomerOrderStatus)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">เลข Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ลูกค้า / ไซต์</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่สร้าง</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">รายการ</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">กำลังโหลด...</td></tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <ClipboardList className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">ไม่พบคำสั่งซื้อ</p>
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <ClipboardList className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-mono font-medium text-sm">{order.orderNo}</div>
                      <div className="text-xs text-muted-foreground">{order.project?.projectNo ?? "-"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{order.customerCompany?.name ?? "-"}</span>
                  </div>
                  {order.customerSite?.siteName && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3 text-muted-foreground/60 shrink-0" />
                      <span className="text-xs text-muted-foreground">{order.customerSite.siteName}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {formatDate(order.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="tabular-nums font-medium">{order.itemCount ?? 0}</span>
                  <span className="text-muted-foreground text-xs ml-1">รายการ</span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/admin/orders/${order.id}`}>
                    เปิด
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && orders.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">
            {orders.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
}
