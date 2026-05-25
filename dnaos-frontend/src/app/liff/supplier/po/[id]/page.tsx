"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type POItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

type SupplierPO = {
  id: string;
  poNo: string;
  status: string;
  createdAt: string;
  supplierResponseNote: string | null;
  items: POItem[];
  customerOrder: { orderNo: string; customerCompany: { name: string } };
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "รอยืนยัน",
  ACKNOWLEDGED: "รับทราบแล้ว",
  CONFIRMED: "ยืนยันแล้ว",
  PARTIALLY_FULFILLED: "ส่งบางส่วน",
  FULFILLED: "ส่งครบแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

const STATUS_COLOR: Record<string, string> = {
  SENT: "bg-amber-100 text-amber-700",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function fmt(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

export default function SupplierPoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [po, setPo] = useState<SupplierPO | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ po: SupplierPO }>(`/liff/supplier/po/${id}`)
      .then((r) => setPo(r.po))
      .catch(() => setError("ไม่พบ PO"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch<{ po: SupplierPO }>(`/liff/supplier/po/${id}/confirm`, { method: "POST" });
      setPo(r.po);
    } catch {
      setError("ยืนยัน PO ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch<{ po: SupplierPO }>(`/liff/supplier/po/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason }),
      });
      setPo(r.po);
      setShowReject(false);
    } catch {
      setError("ปฏิเสธ PO ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(status: "ACKNOWLEDGED" | "PARTIALLY_FULFILLED") {
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch<{ po: SupplierPO }>(`/liff/supplier/po/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setPo(r.po);
    } catch {
      setError("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-destructive">{error ?? "ไม่พบ PO"}</p>
      </div>
    );
  }

  const canAct = ["SENT", "ACKNOWLEDGED"].includes(po.status);
  const total = po.items.reduce((s, i) => s + Number(i.totalPrice), 0);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <p className="font-mono text-sm font-bold">{po.poNo}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(po.createdAt)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[po.status] ?? "bg-muted text-muted-foreground"}`}>
          {STATUS_LABEL[po.status] ?? po.status}
        </span>
      </div>

      {/* Customer info */}
      <div className="rounded-2xl border bg-card p-4 space-y-1">
        <p className="text-xs text-muted-foreground">คำสั่งซื้อ</p>
        <p className="text-sm font-semibold">{po.customerOrder?.orderNo}</p>
        <p className="text-xs text-muted-foreground">{po.customerOrder?.customerCompany?.name}</p>
      </div>

      {/* Items */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="border-b px-4 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">รายการสินค้า</p>
        </div>
        <div className="divide-y">
          {po.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">{Number(item.quantity).toLocaleString()} {item.unit}</p>
              </div>
              <p className="text-sm font-bold text-primary shrink-0 ml-3">฿{fmt(Number(item.totalPrice))}</p>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">รวมทั้งหมด</span>
          <span className="text-base font-bold text-primary">฿{fmt(total)}</span>
        </div>
      </div>

      {/* Note if rejected */}
      {po.supplierResponseNote && (
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">หมายเหตุ</p>
          <p className="text-sm">{po.supplierResponseNote}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Actions */}
      {canAct && !showReject && (
        <div className="space-y-2 pb-4">
          {po.status === "SENT" && (
            <button
              onClick={() => handleStatus("ACKNOWLEDGED")}
              disabled={busy}
              className="w-full rounded-xl border border-primary py-3 text-sm font-semibold text-primary disabled:opacity-50"
            >
              {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "รับทราบ PO"}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><CheckCircle className="size-4" /> ยืนยันรับ PO</>}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="w-full rounded-xl border border-destructive py-3 text-sm font-semibold text-destructive disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="size-4" /> ปฏิเสธ PO
          </button>
        </div>
      )}

      {/* Reject form */}
      {showReject && (
        <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">ระบุเหตุผลที่ปฏิเสธ</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="เช่น สินค้าหมด, ราคาไม่ตรง..."
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowReject(false)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleReject}
              disabled={busy || !rejectReason.trim()}
              className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
            </button>
          </div>
        </div>
      )}

      {/* Status update for CONFIRMED */}
      {po.status === "CONFIRMED" && (
        <button
          onClick={() => handleStatus("PARTIALLY_FULFILLED")}
          disabled={busy}
          className="w-full rounded-xl border py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "อัปเดต: ส่งบางส่วนแล้ว"}
        </button>
      )}
    </div>
  );
}
