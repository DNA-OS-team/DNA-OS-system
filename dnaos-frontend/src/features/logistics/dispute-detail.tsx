"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDispute, updateDisputeStatus, type Dispute, type DisputeStatus } from "./dispute-api";
import { STATUS_LABEL, STATUS_VARIANT } from "./dispute-list";

const DISPUTE_TYPE_LABEL: Record<string, string> = {
  SHORT_DELIVERY: "ส่งของขาด",
  WRONG_MATERIAL: "วัสดุผิด",
  LATE_DELIVERY: "ส่งช้า",
  DAMAGED_MATERIAL: "วัสดุเสียหาย",
  PRICE_DISPUTE: "ข้อพิพาทราคา",
  PAYMENT_DISPUTE: "ข้อพิพาทชำระเงิน",
  CUSTOMER_REJECTED: "ลูกค้าปฏิเสธ",
  TRANSPORT_FAILED: "การขนส่งล้มเหลว",
  OTHER: "อื่นๆ",
};

const NEXT_STATUSES: Record<DisputeStatus, DisputeStatus[]> = {
  OPEN: ["INVESTIGATING", "RESOLVED", "REJECTED"],
  INVESTIGATING: ["WAITING_PARTNER", "WAITING_CUSTOMER", "RESOLVED", "REJECTED"],
  WAITING_PARTNER: ["INVESTIGATING", "RESOLVED", "REJECTED"],
  WAITING_CUSTOMER: ["INVESTIGATING", "RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
};

const REQUIRES_RESOLUTION: DisputeStatus[] = ["RESOLVED", "CLOSED"];

type Props = { disputeId: string };

export function DisputeDetail({ disputeId }: Props) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  async function load() {
    setIsLoading(true);
    try {
      const result = await getDispute(disputeId);
      setDispute(result.dispute);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [disputeId]);

  async function handleStatusChange(toStatus: DisputeStatus) {
    if (REQUIRES_RESOLUTION.includes(toStatus) && !resolutionNote.trim()) {
      setError("กรุณาระบุ resolution note ก่อน");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const result = await updateDisputeStatus(disputeId, {
        toStatus,
        note: note.trim() || undefined,
        resolutionNote: resolutionNote.trim() || undefined,
      });
      setDispute(result.dispute);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">กำลังโหลด...</div>;
  }

  if (!dispute) {
    return (
      <Alert variant="destructive">
        <AlertTitle>ไม่พบ dispute</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const nextStatuses = NEXT_STATUSES[dispute.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/disputes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-normal">
              {dispute.disputeNo}
            </h1>
            <Badge variant={STATUS_VARIANT[dispute.status]}>{STATUS_LABEL[dispute.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {DISPUTE_TYPE_LABEL[dispute.disputeType] ?? dispute.disputeType}
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-1">
              <span className="text-muted-foreground">ประเภท</span>
              <span>{DISPUTE_TYPE_LABEL[dispute.disputeType] ?? dispute.disputeType}</span>

              {dispute.customerOrder ? (
                <>
                  <span className="text-muted-foreground">Order</span>
                  <Link
                    href={`/admin/orders/${dispute.customerOrder.id}`}
                    className="text-blue-600 underline"
                  >
                    {dispute.customerOrder.orderNo}
                  </Link>
                </>
              ) : null}

              {dispute.transportJob ? (
                <>
                  <span className="text-muted-foreground">Transport Job</span>
                  <Link
                    href={`/admin/logistics/${dispute.transportJob.id}`}
                    className="text-blue-600 underline"
                  >
                    {dispute.transportJob.jobNo}
                  </Link>
                </>
              ) : null}

              {dispute.supplierPo ? (
                <>
                  <span className="text-muted-foreground">Supplier PO</span>
                  <span>{dispute.supplierPo.poNo}</span>
                </>
              ) : null}

              {dispute.financialImpact ? (
                <>
                  <span className="text-muted-foreground">ผลกระทบทางการเงิน</span>
                  <span className="font-medium text-destructive">
                    {Number(dispute.financialImpact).toLocaleString("th-TH")} บาท
                  </span>
                </>
              ) : null}

              <span className="text-muted-foreground">เปิดโดย</span>
              <span>{dispute.openedBy?.name ?? "-"}</span>

              <span className="text-muted-foreground">วันที่เปิด</span>
              <span>{new Date(dispute.createdAt).toLocaleString("th-TH")}</span>
            </div>

            <div>
              <p className="text-muted-foreground">รายละเอียด</p>
              <p className="mt-1 whitespace-pre-line rounded-md bg-muted/40 p-2">
                {dispute.description}
              </p>
            </div>

            {dispute.resolutionNote ? (
              <div>
                <p className="text-muted-foreground">Resolution note</p>
                <p className="mt-1 whitespace-pre-line rounded-md bg-green-50 p-2 text-green-800">
                  {dispute.resolutionNote}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Actions */}
        {nextStatuses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>เปลี่ยนสถานะ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="dispute-note" className="text-xs">
                  หมายเหตุ (ไม่บังคับ)
                </Label>
                <Textarea
                  id="dispute-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เหตุผลหรือรายละเอียดเพิ่มเติม"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resolution-note" className="text-xs">
                  Resolution note{" "}
                  <span className="text-muted-foreground">
                    (จำเป็นสำหรับ RESOLVED / CLOSED)
                  </span>
                </Label>
                <Textarea
                  id="resolution-note"
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="สรุปผลการแก้ไขปัญหา"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => handleStatusChange(s)}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Status history */}
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
              {(dispute.statusHistory ?? []).map((h) => (
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
