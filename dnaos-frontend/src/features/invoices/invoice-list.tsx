"use client";

import { CalendarDays, Plus, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { listInvoices, type Invoice, type InvoiceStatus } from "./invoice-api";

const STATUS_OPTIONS: Array<{ value: InvoiceStatus | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SENT", label: "ส่งแล้ว" },
  { value: "PARTIALLY_PAID", label: "ชำระบางส่วน" },
  { value: "PAID", label: "ชำระครบ" },
  { value: "VOID", label: "ยกเลิก" },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(inv: Invoice) {
  return inv.dueDate && new Date(inv.dueDate) < new Date() &&
    (inv.invoiceStatus === "SENT" || inv.invoiceStatus === "PARTIALLY_PAID");
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  async function load() {
    setIsLoading(true);
    try {
      const r = await listInvoices({ status: status === "all" ? undefined : status, q: q.trim() || undefined });
      setInvoices(r.invoices);
    } catch { /* silent */ } finally { setIsLoading(false); }
  }

  useEffect(() => { void load(); }, [status]);

  const totalUnpaid = invoices
    .filter((i) => i.invoiceStatus === "SENT" || i.invoiceStatus === "PARTIALLY_PAID")
    .reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ออก Invoice ติดตามการชำระเงิน</p>
        </div>
        <Link className={buttonVariants()} href="/admin/invoices/new">
          <Plus className="size-4" />
          ออก Invoice ใหม่
        </Link>
      </div>

      {/* Summary strip */}
      {!isLoading && totalUnpaid > 0 && (
        <div className="flex items-center gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <CalendarDays className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">ยอดค้างรับรวม</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{fmt(totalUnpaid)} บาท</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="ค้นหาเลข Invoice หรือลูกค้า..." value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | "all")}>
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">เลข Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ลูกค้า</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">ยอดรวม</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">ชำระแล้ว</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ครบกำหนด</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">กำลังโหลด...</td></tr>
            )}
            {!isLoading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Receipt className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">ไม่พบ Invoice</p>
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const overdue = isOverdue(inv);
              return (
                <tr key={inv.id} className={`hover:bg-muted/30 transition-colors ${overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${overdue ? "bg-red-100 dark:bg-red-950" : "bg-purple-50 dark:bg-purple-950"}`}>
                        <Receipt className={`size-4 ${overdue ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}`} />
                      </div>
                      <div>
                        <div className="font-mono font-medium">{inv.invoiceNo}</div>
                        {overdue && <div className="text-xs text-red-600 dark:text-red-400 font-medium">เกินกำหนด</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{inv.customerCompany?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{fmt(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmt(inv.paidAmount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                      {fmtDate(inv.dueDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><InvoiceStatusBadge status={inv.invoiceStatus} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/admin/invoices/${inv.id}`}>เปิด</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && invoices.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">{invoices.length} รายการ</div>
        )}
      </div>
    </div>
  );
}
