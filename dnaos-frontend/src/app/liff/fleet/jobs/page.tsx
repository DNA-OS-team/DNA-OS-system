"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";

type TransportJob = {
  id: string;
  jobNo: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  createdAt: string;
  scheduledPickupAt: string | null;
  customerOrder: { orderNo: string; customerCompany: { name: string } };
};

const STATUS_LABEL: Record<string, string> = {
  CREATED: "สร้างแล้ว",
  ASSIGNED: "มอบหมายแล้ว",
  ACCEPTED: "รับงานแล้ว",
  GOING_TO_PICKUP: "กำลังไปรับสินค้า",
  ARRIVED_PICKUP: "ถึงจุดรับแล้ว",
  LOADED: "บรรทุกแล้ว",
  IN_TRANSIT: "กำลังส่ง",
  ARRIVED_SITE: "ถึงไซต์งานแล้ว",
  DELIVERED: "ส่งครบแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  GOING_TO_PICKUP: "bg-indigo-100 text-indigo-700",
  ARRIVED_PICKUP: "bg-violet-100 text-violet-700",
  LOADED: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  ARRIVED_SITE: "bg-lime-100 text-lime-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FleetJobsPage() {
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ jobs: TransportJob[] }>(`/liff/fleet/jobs?filter=${filter}`)
      .then((r) => setJobs(r.jobs))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">งานของฉัน</h1>

      <div className="flex gap-2">
        {(["active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "active" ? "กำลังดำเนินการ" : "ทั้งหมด"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
          <Truck className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ไม่มีงานในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/liff/fleet/jobs/${job.id}`} className="block">
              <div className="rounded-2xl border bg-card p-3.5 active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold">{job.jobNo}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[job.status] ?? "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{job.customerOrder?.customerCompany?.name}</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">รับที่</span>
                    <span className="truncate">{job.pickupAddress}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">ส่งที่</span>
                    <span className="truncate">{job.dropoffAddress}</span>
                  </div>
                  {job.scheduledPickupAt && (
                    <p className="text-muted-foreground">นัดรับ {fmtDate(job.scheduledPickupAt)}</p>
                  )}
                </div>
                <div className="mt-2 flex justify-end">
                  <ChevronRight className="size-4 text-muted-foreground/50" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
