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
import { listInvoices, type Invoice, type InvoiceStatus } from "./invoice-api";

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "ร่าง",
  SENT: "ส่งแล้ว",
  PARTIALLY_PAID: "ชำระบางส่วน",
  PAID: "ชำระครบ",
  VOID: "ยกเลิก",
};

export const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "default",
  PAID: "default",
  VOID: "destructive",
};

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  async function load() {
    setIsLoading(true);
    try {
      const result = await listInvoices({
        status: status === "all" ? undefined : status,
        q: q.trim() || undefined,
      });
      setInvoices(result.invoices);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">รายการ Invoice</h1>
          <p className="text-sm text-muted-foreground">ออกใบแจ้งหนี้และติดตามการชำระเงิน</p>
        </div>
        <Link href="/admin/invoices/new" className={buttonVariants({ size: "sm" })}>
          ออก Invoice
        </Link>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input
              placeholder="ค้นหาด้วยเลข invoice หรือชื่อลูกค้า..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={status}
              onValueChange={(v) => setStatus((v ?? "all") as InvoiceStatus | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {(Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((s) => (
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
                <TableHead>เลข Invoice</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ยอดรวม</TableHead>
                <TableHead>ชำระแล้ว</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">กำลังโหลด...</TableCell>
                </TableRow>
              ) : null}
              {!isLoading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">ไม่พบ invoice</TableCell>
                </TableRow>
              ) : null}
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {inv.invoiceNo}
                    {inv.receiptNo ? (
                      <div className="text-xs text-muted-foreground">{inv.receiptNo}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">{inv.customerCompany?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {Number(inv.totalAmount).toLocaleString("th-TH")} บาท
                  </TableCell>
                  <TableCell className="text-sm">
                    {Number(inv.paidAmount).toLocaleString("th-TH")} บาท
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[inv.invoiceStatus]}>
                      {STATUS_LABEL[inv.invoiceStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.invoiceDate).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
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
