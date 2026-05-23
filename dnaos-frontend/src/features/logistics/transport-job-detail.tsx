"use client";

import { ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignFleetToJob, getTransportJob, listFleetCompanies, updateTransportJobStatus } from "./transport-job-api";
import type { FleetCompany, TransportJob, TransportJobStatus } from "./types";
import { STATUS_LABEL, STATUS_VARIANT } from "./transport-job-list";

type Props = { jobId: string };

export function TransportJobDetail({ jobId }: Props) {
  const [job, setJob] = useState<TransportJob | null>(null);
  const [nextStatuses, setNextStatuses] = useState<TransportJobStatus[]>([]);
  const [fleetCompanies, setFleetCompanies] = useState<FleetCompany[]>([]);
  const [selectedFleet, setSelectedFleet] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [jobResult, fleetResult] = await Promise.all([
        getTransportJob(jobId),
        listFleetCompanies(),
      ]);
      setJob(jobResult.job);
      setNextStatuses(jobResult.nextStatuses);
      setFleetCompanies(fleetResult.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [jobId]);

  async function handleAssignFleet() {
    if (!selectedFleet) return;
    setIsSaving(true);
    setError(null);
    try {
      await assignFleetToJob(jobId, selectedFleet);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "มอบหมาย fleet ไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(toStatus: TransportJobStatus) {
    setIsSaving(true);
    setError(null);
    try {
      await updateTransportJobStatus(jobId, toStatus);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">กำลังโหลด...</div>;
  }

  if (!job) {
    return (
      <Alert variant="destructive">
        <AlertTitle>ไม่พบงานขนส่ง</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/logistics"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Truck className="size-5" />
            <h1 className="text-2xl font-semibold tracking-normal font-mono">
              {job.jobNo}
            </h1>
            <Badge variant={STATUS_VARIANT[job.status]}>
              {STATUS_LABEL[job.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Order: {job.customerOrder?.orderNo ?? "-"} ·{" "}
            {job.customerOrder?.customerCompany?.name ?? ""}
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดงาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-1">
              <span className="text-muted-foreground">รับสินค้าจาก</span>
              <span>{job.pickupAddress}</span>
              <span className="text-muted-foreground">ส่งไปที่</span>
              <span>{job.dropoffAddress}</span>
              <span className="text-muted-foreground">Fleet</span>
              <span>{job.fleetCompany?.name ?? <span className="text-muted-foreground">ยังไม่มอบหมาย</span>}</span>
              <span className="text-muted-foreground">กำหนดรับ</span>
              <span>{job.scheduledPickupAt ? new Date(job.scheduledPickupAt).toLocaleString("th-TH") : "-"}</span>
              <span className="text-muted-foreground">กำหนดส่ง</span>
              <span>{job.scheduledDeliveryAt ? new Date(job.scheduledDeliveryAt).toLocaleString("th-TH") : "-"}</span>
              <span className="text-muted-foreground">ต้นทุนขนส่ง</span>
              <span>{Number(job.transportCost).toLocaleString()} บาท</span>
              <span className="text-muted-foreground">ค่าส่งลูกค้า</span>
              <span>{Number(job.customerDeliveryFee).toLocaleString()} บาท</span>
            </div>
            {job.notes ? (
              <p className="text-muted-foreground">{job.notes}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!job.fleetCompany && job.status === "CREATED" ? (
            <Card>
              <CardHeader>
                <CardTitle>มอบหมาย Fleet</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Select value={selectedFleet} onValueChange={(v) => setSelectedFleet(v ?? "")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="เลือก fleet" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignFleet}
                  disabled={!selectedFleet || isSaving}
                >
                  มอบหมาย
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {nextStatuses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>เปลี่ยนสถานะ</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleStatusChange(s)}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>หน่วย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(job.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    ไม่มีรายการสินค้า
                  </TableCell>
                </TableRow>
              ) : null}
              {(job.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{Number(item.quantity).toLocaleString()}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติสถานะ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>จาก</TableHead>
                <TableHead>ไป</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(job.statusHistory ?? []).map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm">
                    {new Date(h.createdAt).toLocaleString("th-TH")}
                  </TableCell>
                  <TableCell>
                    {h.fromStatus ? (
                      <Badge variant="outline">{STATUS_LABEL[h.fromStatus]}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[h.toStatus]}>
                      {STATUS_LABEL[h.toStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {h.note ?? "-"}
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
