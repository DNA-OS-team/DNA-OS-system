"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useFleetAuth } from "./use-fleet-auth";
import {
  getFleetJob, updateFleetJobStatus,
  JOB_STATUS_LABEL, NEXT_STATUS_LABEL,
  type TransportJob, type TransportJobStatus,
} from "./fleet-api";
import { Button } from "@/components/ui/button";

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FleetJobDetail({ jobId }: { jobId: string }) {
  const auth = useFleetAuth(`/fleet/jobs/${jobId}`);
  const [job, setJob] = useState<TransportJob | null>(null);
  const [nextStatuses, setNextStatuses] = useState<TransportJobStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    getFleetJob(jobId)
      .then((r) => { if (mounted) { setJob(r.job); setNextStatuses(r.nextStatuses); } })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status, jobId]);

  async function handleStatus(toStatus: TransportJobStatus) {
    if (!job) return;
    setUpdating(true);
    try {
      const r = await updateFleetJobStatus(job.id, toStatus);
      setJob((r as { job: TransportJob }).job);
      setNextStatuses([]);
      const refreshed = await getFleetJob(job.id);
      setJob(refreshed.job);
      setNextStatuses(refreshed.nextStatuses);
    } catch {
      setError("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setUpdating(false);
    }
  }

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>;
  }

  if (isLoading) return (
    <div className="space-y-4 pt-2">
      <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
      <div className="h-48 rounded-2xl bg-muted animate-pulse" />
    </div>
  );

  if (error || !job) return (
    <div className="pt-2 space-y-4">
      <Link href="/fleet/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> กลับ
      </Link>
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">{error ?? "ไม่พบงานขนส่ง"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pt-2">
      <Link href="/fleet/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> งานทั้งหมด
      </Link>

      <div className="rounded-2xl border bg-card px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono font-bold text-lg">{job.jobNo}</p>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
            {JOB_STATUS_LABEL[job.status as TransportJobStatus] ?? job.status}
          </span>
        </div>

        <div className="divide-y text-sm">
          <div className="flex items-start gap-2 py-2">
            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">รับสินค้าจาก</p>
              <p className="font-medium">{job.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 py-2">
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">ส่งไปที่</p>
              <p className="font-medium">{job.dropoffAddress}</p>
            </div>
          </div>
          {job.scheduledPickupAt && (
            <div className="flex items-center gap-2 py-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">กำหนดรับ</p>
                <p>{fmtDate(job.scheduledPickupAt)}</p>
              </div>
            </div>
          )}
          {job.scheduledDeliveryAt && (
            <div className="flex items-center gap-2 py-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">กำหนดส่ง</p>
                <p>{fmtDate(job.scheduledDeliveryAt)}</p>
              </div>
            </div>
          )}
          {job.notes && (
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-1">หมายเหตุ</p>
              <p className="text-sm">{job.notes}</p>
            </div>
          )}
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">อัปเดตสถานะ</p>
          {nextStatuses.map((s) => (
            <Button key={s} className="w-full" onClick={() => handleStatus(s)} disabled={updating}>
              {updating ? "กำลังบันทึก..." : (NEXT_STATUS_LABEL[s] ?? JOB_STATUS_LABEL[s as TransportJobStatus])}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
