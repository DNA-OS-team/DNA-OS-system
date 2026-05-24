"use client";

import { MapPin, Search, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransportStatusBadge } from "@/components/shared/status-badge";
import { listTransportJobs } from "./transport-job-api";
import type { TransportJob, TransportJobStatus } from "./types";

const STATUS_OPTIONS: Array<{ value: TransportJobStatus | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "CREATED", label: "รอมอบหมาย" },
  { value: "ASSIGNED", label: "มอบหมายแล้ว" },
  { value: "ACCEPTED", label: "รับงานแล้ว" },
  { value: "GOING_TO_PICKUP", label: "กำลังไปรับ" },
  { value: "ARRIVED_PICKUP", label: "ถึงจุดรับ" },
  { value: "LOADED", label: "บรรทุกแล้ว" },
  { value: "IN_TRANSIT", label: "กำลังขนส่ง" },
  { value: "ARRIVED_SITE", label: "ถึงไซต์" },
  { value: "DELIVERED", label: "ส่งสำเร็จ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "FAILED", label: "ล้มเหลว" },
];

// Jobs that need attention (not completed/cancelled/failed/delivered)
const ACTIVE_STATUSES = ["CREATED", "ASSIGNED", "ACCEPTED", "GOING_TO_PICKUP", "ARRIVED_PICKUP", "LOADED", "IN_TRANSIT", "ARRIVED_SITE"];

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

export function TransportJobList() {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransportJobStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      setIsLoading(true);
      listTransportJobs({ q: query || undefined, status: statusFilter !== "all" ? statusFilter : undefined })
        .then((r) => { if (active) setJobs(r.jobs); })
        .catch(() => {})
        .finally(() => { if (active) setIsLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(t); };
  }, [query, statusFilter]);

  const activeCount = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length;
  const unassigned = jobs.filter((j) => j.status === "CREATED").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">งานขนส่ง</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ติดตามและจัดการงานขนส่งทั้งหมด</p>
        </div>
      </div>

      {/* Status strip */}
      {!isLoading && (activeCount > 0 || unassigned > 0) && (
        <div className="flex flex-wrap gap-3">
          {unassigned > 0 && (
            <div className="flex items-center gap-2 rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
              <Truck className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{unassigned} งาน รอมอบหมายรถ</span>
            </div>
          )}
          {activeCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5">
              <Truck className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{activeCount} งาน กำลังดำเนินการ</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="ค้นหาหมายเลขงาน..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TransportJobStatus | "all")}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">หมายเลขงาน</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fleet</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">เส้นทาง</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">กำหนดส่ง</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">กำลังโหลด...</td></tr>}
            {!isLoading && jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Truck className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">ไม่พบงานขนส่ง</p>
                </td>
              </tr>
            )}
            {jobs.map((job) => {
              const needsAttention = job.status === "CREATED";
              return (
                <tr key={job.id} className={`hover:bg-muted/30 transition-colors ${needsAttention ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${needsAttention ? "bg-amber-100 dark:bg-amber-950" : "bg-blue-50 dark:bg-blue-950"}`}>
                        <Truck className={`size-4 ${needsAttention ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`} />
                      </div>
                      <span className="font-mono font-medium">{job.jobNo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{job.customerOrder?.orderNo ?? "-"}</td>
                  <td className="px-4 py-3">
                    {job.fleetCompany ? (
                      <span className="font-medium">{job.fleetCompany.name}</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">ยังไม่มอบหมาย</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 mt-0.5 shrink-0" />
                      <div>
                        <p className="truncate">{job.pickupAddress}</p>
                        <p className="truncate text-muted-foreground/60">→ {job.dropoffAddress}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {fmtDate(job.scheduledDeliveryAt) ?? "-"}
                  </td>
                  <td className="px-4 py-3"><TransportStatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/logistics/${job.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>เปิด</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && jobs.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">{jobs.length} งาน</div>
        )}
      </div>
    </div>
  );
}

export { STATUS_OPTIONS };
