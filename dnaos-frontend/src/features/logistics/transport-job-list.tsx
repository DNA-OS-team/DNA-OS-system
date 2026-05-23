"use client";

import { Truck, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTransportJobs } from "./transport-job-api";
import type { TransportJob, TransportJobStatus } from "./types";

const STATUS_LABEL: Record<TransportJobStatus, string> = {
  CREATED: "รอมอบหมาย",
  ASSIGNED: "มอบหมายแล้ว",
  ACCEPTED: "รับงานแล้ว",
  GOING_TO_PICKUP: "กำลังไปรับสินค้า",
  ARRIVED_PICKUP: "ถึงจุดรับสินค้า",
  LOADED: "บรรทุกสินค้าแล้ว",
  IN_TRANSIT: "กำลังขนส่ง",
  ARRIVED_SITE: "ถึงไซต์งาน",
  DELIVERED: "ส่งสำเร็จ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  FAILED: "ล้มเหลว",
};

const STATUS_VARIANT: Record<TransportJobStatus, "default" | "secondary" | "outline" | "destructive"> = {
  CREATED: "secondary",
  ASSIGNED: "secondary",
  ACCEPTED: "default",
  GOING_TO_PICKUP: "default",
  ARRIVED_PICKUP: "default",
  LOADED: "default",
  IN_TRANSIT: "default",
  ARRIVED_SITE: "default",
  DELIVERED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
  FAILED: "destructive",
};

export function TransportJobList() {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransportJobStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      listTransportJobs({
        q: query || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
        .then((result) => {
          if (isMounted) setJobs(result.jobs);
        })
        .catch((err: unknown) => {
          if (isMounted)
            setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, statusFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">งานขนส่ง</h1>
        <p className="text-sm text-muted-foreground">
          ติดตามและจัดการงานขนส่งทั้งหมด
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาหมายเลขงาน ที่อยู่รับ-ส่ง"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TransportJobStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              {(Object.keys(STATUS_LABEL) as TransportJobStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการงานขนส่ง</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลขงาน</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Fleet</TableHead>
                <TableHead>รับสินค้าจาก</TableHead>
                <TableHead>ส่งไปที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    ไม่พบงานขนส่ง
                  </TableCell>
                </TableRow>
              ) : null}
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{job.jobNo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {job.customerOrder?.orderNo ?? "-"}
                  </TableCell>
                  <TableCell>{job.fleetCompany?.name ?? <span className="text-muted-foreground">ยังไม่มอบหมาย</span>}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">
                    {job.pickupAddress}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">
                    {job.dropoffAddress}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[job.status]}>
                      {STATUS_LABEL[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/logistics/${job.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      เปิด
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export { STATUS_LABEL, STATUS_VARIANT };
