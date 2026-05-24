"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  approveSettlement,
  cancelSettlement,
  createPV,
  getSettlement,
  markPaid,
  submitSettlement,
  type SettlementBatch,
} from "./settlement-api";
import { STATUS_LABEL, STATUS_VARIANT, PARTNER_TYPE_LABEL } from "./settlement-list";

export function SettlementDetail({ id }: { id: string }) {
  const [settlement, setSettlement] = useState<SettlementBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getSettlement(id);
      setSettlement(data.settlement);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAction(action: () => Promise<{ settlement: SettlementBatch }>) {
    setIsSaving(true);
    setError(null);
    try {
      const data = await action();
      setSettlement(data.settlement);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">กำลังโหลด...</div>;
  if (!settlement) return <div className="text-muted-foreground">ไม่พบรายการ</div>;

  const items = settlement.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/settlements" className="text-sm text-muted-foreground hover:underline">
            ← กลับรายการ Settlement
          </Link>
          <h1 className="text-xl font-semibold mt-1 font-mono">{settlement.batchNo}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{PARTNER_TYPE_LABEL[settlement.partnerType]}</Badge>
          <Badge variant={STATUS_VARIANT[settlement.status]}>{STATUS_LABEL[settlement.status]}</Badge>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {settlement.status === "DRAFT" && (
          <Button size="sm" onClick={() => handleAction(() => submitSettlement(id))} disabled={isSaving}>
            ส่งอนุมัติ
          </Button>
        )}
        {["DRAFT", "PENDING_APPROVAL"].includes(settlement.status) && (
          <Button size="sm" onClick={() => handleAction(() => approveSettlement(id))} disabled={isSaving}>
            อนุมัติ
          </Button>
        )}
        {settlement.status === "APPROVED" && (
          <Button size="sm" onClick={() => handleAction(() => createPV(id))} disabled={isSaving}>
            สั่งจ่าย (PV)
          </Button>
        )}
        {settlement.status === "PAYMENT_ORDERED" && (
          <Button size="sm" onClick={() => handleAction(() => markPaid(id))} disabled={isSaving}>
            ยืนยันจ่ายแล้ว
          </Button>
        )}
        {!["PAID", "CANCELLED"].includes(settlement.status) && (
          <Button variant="outline" size="sm" onClick={() => handleAction(() => cancelSettlement(id))} disabled={isSaving}>
            ยกเลิก
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">บริษัทคู่ค้า</CardTitle></CardHeader>
          <CardContent>
            <div className="font-medium">{settlement.partnerCompany?.name ?? "-"}</div>
            {settlement.partnerCompany?.isIndividual && (
              <div className="text-xs text-muted-foreground mt-1">บุคคลธรรมดา (หัก WHT 3%)</div>
            )}
            {settlement.partnerCompany?.bankName && (
              <div className="text-xs text-muted-foreground mt-1">
                {settlement.partnerCompany.bankName}: {settlement.partnerCompany.bankAccountNo ?? "-"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ยอดก่อนหัก</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Number(settlement.grossAmount).toLocaleString("th-TH")} บาท</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">หัก WHT</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              {Number(settlement.whtAmount) > 0 ? `-${Number(settlement.whtAmount).toLocaleString("th-TH")} บาท` : "ไม่หัก"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ยอดสุทธิ</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">{Number(settlement.netAmount).toLocaleString("th-TH")} บาท</div>
            {settlement.paymentDueAt && (
              <div className="text-xs text-muted-foreground mt-1">
                ครบกำหนด: {new Date(settlement.paymentDueAt).toLocaleDateString("th-TH")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period */}
      <div className="text-sm text-muted-foreground">
        ช่วงเวลา: {new Date(settlement.periodFrom).toLocaleDateString("th-TH")} — {new Date(settlement.periodTo).toLocaleDateString("th-TH")}
        {settlement.approvedAt && ` · อนุมัติ: ${new Date(settlement.approvedAt).toLocaleDateString("th-TH")} โดย ${settlement.approvedByAdmin?.username ?? "-"}`}
        {settlement.paidAt && ` · จ่าย: ${new Date(settlement.paidAt).toLocaleDateString("th-TH")}`}
      </div>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle>รายการ ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภท</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">ยอด (ก่อนหัก)</TableHead>
                <TableHead className="text-right">WHT</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.refType === "PURCHASE_ORDER" ? "PO" : "Transport"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-right text-sm">{Number(item.grossAmount).toLocaleString("th-TH")}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">
                    {Number(item.whtAmount) > 0 ? `-${Number(item.whtAmount).toLocaleString("th-TH")}` : "-"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(item.netAmount).toLocaleString("th-TH")}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold">
                <TableCell colSpan={2}>รวม</TableCell>
                <TableCell className="text-right">{Number(settlement.grossAmount).toLocaleString("th-TH")}</TableCell>
                <TableCell className="text-right text-destructive">
                  {Number(settlement.whtAmount) > 0 ? `-${Number(settlement.whtAmount).toLocaleString("th-TH")}` : "-"}
                </TableCell>
                <TableCell className="text-right text-green-700">{Number(settlement.netAmount).toLocaleString("th-TH")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {settlement.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">หมายเหตุ</CardTitle></CardHeader>
          <CardContent className="text-sm">{settlement.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
