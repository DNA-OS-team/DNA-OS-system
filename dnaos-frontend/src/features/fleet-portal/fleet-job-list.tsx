"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useFleetAuth } from "./use-fleet-auth";
import { listFleetJobs, JOB_STATUS_LABEL, type TransportJob, type TransportJobStatus } from "./fleet-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLOR: Record<string, string> = {
  CREATED: "badge-neutral", ASSIGNED: "badge-info", ACCEPTED: "badge-info",
  GOING_TO_PICKUP: "badge-warning", ARRIVED_PICKUP: "badge-warning",
  LOADED: "badge-warning", IN_TRANSIT: "badge-warning", ARRIVED_SITE: "badge-warning",
  DELIVERED: "badge-success", COMPLETED: "badge-success",
  CANCELLED: "badge-danger", FAILED: "badge-danger",
};

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function JobCard({ job }: { job: TransportJob }) {
  return (
    <Link href={`/fleet/jobs/${job.id}`}
      className="group flex items-start gap-3 rounded-2xl border bg-card p-4 hover:border-primary/40 active:scale-[0.98] transition-all">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 mt-0.5">
        <Truck className="size-5 text-amber-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono font-bold text-sm">{job.jobNo}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[job.status] ?? "badge-neutral"}`}>
            {JOB_STATUS_LABEL[job.status as TransportJobStatus] ?? job.status}
          </span>
        </div>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0 mt-0.5" />
          <span className="truncate">{job.dropoffAddress}</span>
        </div>
        {job.scheduledDeliveryAt && (
          <p className="text-xs text-muted-foreground">นัดส่ง {fmtDate(job.scheduledDeliveryAt)}</p>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 mt-1 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

export function FleetJobList() {
  const auth = useFleetAuth("/fleet/jobs");
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    setIsLoading(true);
    const params = statusFilter === "active"
      ? undefined
      : statusFilter === "all" ? undefined : { status: statusFilter };
    listFleetJobs(params)
      .then((r) => { if (mounted) setJobs(r.jobs); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status, statusFilter]);

  const filtered = statusFilter === "active"
    ? jobs.filter((j) => !["DELIVERED", "COMPLETED", "CANCELLED", "FAILED"].includes(j.status))
    : jobs;

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{auth.me.company.name}</p>
          <p className="text-xs text-muted-foreground">{auth.me.displayName}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">งานที่ค้างอยู่</SelectItem>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="DELIVERED">ส่งแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">ไม่มีงานขนส่ง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
