"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, CheckCircle, MapPin, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";

type JobItem = { id: string; description: string; quantity: number; unit: string };
type Proof = { id: string; proofType: string; fileUrl: string | null; note: string | null; createdAt: string };
type TransportJob = {
  id: string;
  jobNo: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledPickupAt: string | null;
  scheduledDeliveryAt: string | null;
  notes: string | null;
  items: JobItem[];
  customerOrder: { orderNo: string; customerCompany: { name: string } };
};

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "มอบหมายแล้ว",
  ACCEPTED: "รับงานแล้ว",
  GOING_TO_PICKUP: "กำลังไปรับสินค้า",
  ARRIVED_PICKUP: "ถึงจุดรับแล้ว",
  LOADED: "บรรทุกแล้ว",
  IN_TRANSIT: "กำลังส่ง",
  ARRIVED_SITE: "ถึงไซต์งานแล้ว",
  DELIVERED: "ส่งครบแล้ว",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  ACCEPTED: "รับงาน",
  GOING_TO_PICKUP: "ออกเดินทางไปรับสินค้า",
  ARRIVED_PICKUP: "ถึงจุดรับสินค้าแล้ว",
  LOADED: "บรรทุกสินค้าแล้ว",
  IN_TRANSIT: "เริ่มส่งสินค้า",
  ARRIVED_SITE: "ถึงไซต์งานแล้ว",
  DELIVERED: "ส่งสินค้าครบแล้ว",
};

const PROOF_TYPE_LABEL: Record<string, string> = {
  PHOTO_BEFORE_LOADING: "รูปก่อนบรรทุก",
  PHOTO_AFTER_LOADING: "รูปหลังบรรทุก",
  PHOTO_AT_SITE: "รูปที่ไซต์งาน",
  SCALE_TICKET: "ใบชั่งน้ำหนัก",
  DELIVERY_NOTE: "ใบส่งของ",
  CUSTOMER_SIGNATURE: "ลายเซ็นลูกค้า",
  OTHER: "อื่นๆ",
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FleetJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<TransportJob | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [nextStatuses, setNextStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proof form
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofType, setProofType] = useState("PHOTO_AT_SITE");
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    apiFetch<{ job: TransportJob; proofs: Proof[]; nextStatuses: string[] }>(`/liff/fleet/jobs/${id}`)
      .then((r) => {
        setJob(r.job);
        setProofs(r.proofs);
        setNextStatuses(r.nextStatuses);
      })
      .catch(() => setError("ไม่พบงาน"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatus(toStatus: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/liff/fleet/jobs/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ toStatus }),
      });
      load();
    } catch {
      setError("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleProofSubmit() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/liff/fleet/jobs/${id}/proof`, {
        method: "POST",
        body: JSON.stringify({
          proofType,
          fileUrl: null,
          note: proofNote.trim() || null,
        }),
      });
      setShowProofForm(false);
      setProofNote("");
      load();
    } catch {
      setError("บันทึกหลักฐานไม่สำเร็จ");
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

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-destructive">{error ?? "ไม่พบงาน"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <p className="font-mono text-sm font-bold">{job.jobNo}</p>
          <p className="text-xs text-muted-foreground">{job.customerOrder?.customerCompany?.name}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {STATUS_LABEL[job.status] ?? job.status}
        </span>
      </div>

      {/* Route */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className="size-2.5 rounded-full bg-primary" />
            <div className="w-0.5 h-6 bg-border" />
            <MapPin className="size-3.5 text-destructive" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">รับสินค้าที่</p>
              <p className="text-sm font-medium">{job.pickupAddress}</p>
              {job.scheduledPickupAt && (
                <p className="text-xs text-muted-foreground">{fmtDate(job.scheduledPickupAt)}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ส่งที่</p>
              <p className="text-sm font-medium">{job.dropoffAddress}</p>
              {job.scheduledDeliveryAt && (
                <p className="text-xs text-muted-foreground">{fmtDate(job.scheduledDeliveryAt)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      {job.items.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-2.5 flex items-center gap-2">
            <Package className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">สินค้า</p>
          </div>
          <div className="divide-y">
            {job.items.map((item) => (
              <div key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground truncate flex-1 mr-2">{item.description}</span>
                <span className="font-medium shrink-0">{Number(item.quantity).toLocaleString()} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {job.notes && (
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">หมายเหตุ</p>
          <p className="text-sm">{job.notes}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Next status actions */}
      {nextStatuses.length > 0 && (
        <div className="space-y-2">
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              disabled={busy}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <><CheckCircle className="size-4" />{NEXT_STATUS_LABEL[s] ?? s}</>}
            </button>
          ))}
        </div>
      )}

      {/* Submit proof */}
      <button
        onClick={() => setShowProofForm(!showProofForm)}
        className="w-full rounded-xl border py-3 text-sm font-semibold flex items-center justify-center gap-2"
      >
        <Camera className="size-4" /> บันทึกหลักฐานการส่ง
      </button>

      {showProofForm && (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">บันทึกหลักฐาน</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">ประเภทหลักฐาน</label>
            <select
              value={proofType}
              onChange={(e) => setProofType(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(PROOF_TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">หมายเหตุ</label>
            <textarea
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={2}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProofForm(false)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleProofSubmit}
              disabled={busy}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Existing proofs */}
      {proofs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">หลักฐานที่บันทึกแล้ว</p>
          {proofs.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <CheckCircle className="size-4 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">{PROOF_TYPE_LABEL[p.proofType] ?? p.proofType}</p>
                {p.note && <p className="text-xs text-muted-foreground mt-0.5">{p.note}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(p.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" />
    </div>
  );
}
