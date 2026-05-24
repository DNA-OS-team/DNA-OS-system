"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { listSettlements, type SettlementBatch, type SettlementPartnerType, type SettlementStatus } from "./settlement-api";

export const STATUS_LABEL: Record<SettlementStatus, string> = {
  DRAFT: "ร่าง",
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  PAYMENT_ORDERED: "สั่งจ่ายแล้ว",
  PAID: "จ่ายแล้ว",
  CANCELLED: "ยกเลิก",
};

export const STATUS_VARIANT: Record<SettlementStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  PAYMENT_ORDERED: "default",
  PAID: "default",
  CANCELLED: "destructive",
};

export const PARTNER_TYPE_LABEL: Record<SettlementPartnerType, string> = {
  SUPPLIER: "ซัพพลายเออร์",
  FLEET: "ขนส่ง",
};

export function SettlementList() {
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SettlementStatus | "all">("all");
  const [partnerType, setPartnerType] = useState<SettlementPartnerType | "all">("all");

  async function load() {
    setIsLoading(true);
    try {
      const result = await listSettlements({
        status: status === "all" ? undefined : status,
        partnerType: partnerType === "all" ? undefined : partnerType,
        q: q.trim() || undefined,
      });
      setSettlements(result.settlements);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, partnerType]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  const totalPending = settlements.filter((s) =>
    ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAYMENT_ORDERED"].includes(s.status)
  ).reduce((sum, s) => sum + Number(s.netAmount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settlement / Payout</h1>
          <p className="text-sm text-muted-foreground">จ่ายเงินให้ซัพพลายเออร์และผู้ขนส่ง</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-right">
            <div className="font-semibold">{totalPending.toLocaleString("th-TH")} บาท</div>
            <div className="text-muted-foreground">รอจ่าย</div>
          </div>
          <Link href="/admin/settlements/new" className={buttonVariants({ size: "sm" })}>
            สร้าง Settlement
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2 flex-wrap" onSubmit={handleSearch}>
            <Input
              placeholder="ค้นหาชื่อบริษัท..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select value={partnerType} onValueChange={(v) => setPartnerType((v ?? "all") as SettlementPartnerType | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="SUPPLIER">ซัพพลายเออร์</SelectItem>
                <SelectItem value="FLEET">ขนส่ง</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus((v ?? "all") as SettlementStatus | "all")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {(Object.keys(STATUS_LABEL) as SettlementStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
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
                <TableHead>เลข Batch</TableHead>
                <TableHead>บริษัทคู่ค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ยอดรวม (ก่อนหัก)</TableHead>
                <TableHead>หัก WHT</TableHead>
                <TableHead>ยอดสุทธิ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ครบกำหนด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">กำลังโหลด...</TableCell>
                </TableRow>
              ) : null}
              {!isLoading && settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">ไม่มีรายการ</TableCell>
                </TableRow>
              ) : null}
              {settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm font-medium">{s.batchNo}</TableCell>
                  <TableCell className="text-sm">{s.partnerCompany?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{PARTNER_TYPE_LABEL[s.partnerType]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{Number(s.grossAmount).toLocaleString("th-TH")} บาท</TableCell>
                  <TableCell className="text-sm text-destructive">
                    {Number(s.whtAmount) > 0 ? `-${Number(s.whtAmount).toLocaleString("th-TH")}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{Number(s.netAmount).toLocaleString("th-TH")} บาท</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.paymentDueAt ? new Date(s.paymentDueAt).toLocaleDateString("th-TH") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/settlements/${s.id}`}
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
