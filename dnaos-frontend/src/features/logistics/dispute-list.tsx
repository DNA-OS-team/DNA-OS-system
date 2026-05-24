"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { listDisputes, type Dispute, type DisputeStatus } from "./dispute-api";

export const STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: "เปิด",
  INVESTIGATING: "กำลังสืบสวน",
  WAITING_PARTNER: "รอพาร์ทเนอร์",
  WAITING_CUSTOMER: "รอลูกค้า",
  RESOLVED: "แก้ไขแล้ว",
  REJECTED: "ปฏิเสธ",
  CLOSED: "ปิดแล้ว",
};

export const STATUS_VARIANT: Record<DisputeStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  INVESTIGATING: "default",
  WAITING_PARTNER: "secondary",
  WAITING_CUSTOMER: "secondary",
  RESOLVED: "default",
  REJECTED: "outline",
  CLOSED: "outline",
};

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

export function DisputeList() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DisputeStatus | "all">("all");

  async function load() {
    setIsLoading(true);
    try {
      const result = await listDisputes({
        status: status === "all" ? undefined : status,
        q: q.trim() || undefined,
      });
      setDisputes(result.disputes);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">รายการ Dispute</h1>
          <p className="text-sm text-muted-foreground">ติดตามและแก้ไขปัญหา / ข้อพิพาท</p>
        </div>
        <Link href="/admin/disputes/new" className={buttonVariants({ size: "sm" })}>
          เปิด Dispute
        </Link>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input
              placeholder="ค้นหาด้วยเลข dispute หรือรายละเอียด..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={status}
              onValueChange={(v) => setStatus((v ?? "all") as DisputeStatus | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {(Object.keys(STATUS_LABEL) as DisputeStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">ค้นหา</Button>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลข Dispute</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>Order / Job</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่เปิด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && disputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    ไม่พบ dispute
                  </TableCell>
                </TableRow>
              ) : null}
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {d.disputeNo}
                  </TableCell>
                  <TableCell className="text-sm">
                    {DISPUTE_TYPE_LABEL[d.disputeType] ?? d.disputeType}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.customerOrder?.orderNo ?? d.transportJob?.jobNo ?? d.supplierPo?.poNo ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/disputes/${d.id}`}
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
