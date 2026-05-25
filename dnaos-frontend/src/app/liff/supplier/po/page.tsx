"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";

type SupplierPO = {
  id: string;
  poNo: string;
  status: string;
  createdAt: string;
  items: { description: string; quantity: number; unit: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  SENT: "รอยืนยัน",
  ACKNOWLEDGED: "รับทราบแล้ว",
  CONFIRMED: "ยืนยันแล้ว",
  PARTIALLY_FULFILLED: "ส่งบางส่วน",
  FULFILLED: "ส่งครบแล้ว",
  BILLED: "ออกบิลแล้ว",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
  REJECTED: "ปฏิเสธแล้ว",
};

const STATUS_COLOR: Record<string, string> = {
  SENT: "bg-amber-100 text-amber-700",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  PARTIALLY_FULFILLED: "bg-orange-100 text-orange-700",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function SupplierPoListPage() {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [pos, setPos] = useState<SupplierPO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ pos: SupplierPO[] }>(`/liff/supplier/po?filter=${filter}`)
      .then((r) => setPos(r.pos))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">ใบสั่งซื้อ (PO)</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "pending" ? "รอดำเนินการ" : "ทั้งหมด"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : pos.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
          <ClipboardList className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ไม่มี PO ในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pos.map((po) => (
            <Link key={po.id} href={`/liff/supplier/po/${po.id}`} className="block">
              <div className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 active:scale-[0.99] transition-transform">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardList className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{po.poNo}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[po.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[po.status] ?? po.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(po.createdAt)} · {po.items.length} รายการ
                  </p>
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
