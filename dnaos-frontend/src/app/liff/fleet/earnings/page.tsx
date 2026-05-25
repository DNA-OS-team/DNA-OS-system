"use client";

import { useEffect, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type SettlementItem = {
  id: string;
  description: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
};

type SettlementBatch = {
  id: string;
  batchNo: string;
  status: string;
  periodFrom: string;
  periodTo: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  paidAt: string | null;
  paymentDueAt: string | null;
  items: SettlementItem[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  PAYMENT_ORDERED: "สั่งโอนแล้ว",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAYMENT_ORDERED: "bg-indigo-100 text-indigo-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function fmtBaht(n: number) {
  return Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function FleetEarningsPage() {
  const [batches, setBatches] = useState<SettlementBatch[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ batches: SettlementBatch[]; totalPaid: number; totalPending: number }>("/liff/fleet/earnings")
      .then((r) => {
        setBatches(r.batches);
        setTotalPaid(r.totalPaid);
        setTotalPending(r.totalPending);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">รายได้ของฉัน</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
          <p className="text-xs text-emerald-700 font-medium">ได้รับแล้ว</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">฿{fmtBaht(totalPaid)}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-medium">รอรับเงิน</p>
          <p className="text-lg font-bold text-amber-700 mt-1">฿{fmtBaht(totalPending)}</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
          <Banknote className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-2xl border bg-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === batch.id ? null : batch.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Banknote className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{batch.batchNo}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[batch.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[batch.status] ?? batch.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(batch.periodFrom)} – {fmtDate(batch.periodTo)}
                  </p>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">฿{fmtBaht(Number(batch.netAmount))}</p>
              </button>

              {expanded === batch.id && (
                <div className="border-t px-4 py-3 space-y-3">
                  <div className="space-y-1.5">
                    {batch.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate flex-1 mr-2">{item.description}</span>
                        <span className="font-medium shrink-0">฿{fmtBaht(Number(item.netAmount))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ยอดรวม</span>
                      <span>฿{fmtBaht(Number(batch.grossAmount))}</span>
                    </div>
                    {Number(batch.whtAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">หัก ณ ที่จ่าย</span>
                        <span className="text-red-600">-฿{fmtBaht(Number(batch.whtAmount))}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1">
                      <span>รับสุทธิ</span>
                      <span className="text-primary">฿{fmtBaht(Number(batch.netAmount))}</span>
                    </div>
                  </div>
                  {batch.paidAt && (
                    <p className="text-xs text-emerald-600">โอนเงินแล้ว {fmtDate(batch.paidAt)}</p>
                  )}
                  {batch.paymentDueAt && batch.status !== "PAID" && (
                    <p className="text-xs text-muted-foreground">กำหนดชำระ {fmtDate(batch.paymentDueAt)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
