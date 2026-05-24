"use client";

import { AlertTriangle, Clock, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DebtStateBadge } from "@/components/shared/status-badge";
import { listDebts, type CollectionState, type DebtSnapshot } from "./debt-api";

const STATE_OPTIONS: Array<{ value: CollectionState | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "CURRENT", label: "ปกติ" },
  { value: "OVERDUE", label: "เกินกำหนด" },
  { value: "WARNING", label: "แจ้งเตือน" },
  { value: "COLLECTION", label: "ติดตามหนี้" },
  { value: "PROMISED", label: "สัญญาชำระ" },
  { value: "PARTIAL", label: "ชำระบางส่วน" },
  { value: "LEGAL", label: "ดำเนินคดี" },
  { value: "CLOSED", label: "ปิดแล้ว" },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function UrgencyBar({ daysOverdue }: { daysOverdue: number }) {
  if (daysOverdue <= 0) return null;
  const color = daysOverdue > 30 ? "bg-red-500" : daysOverdue > 7 ? "bg-amber-500" : "bg-yellow-400";
  const pct = Math.min(100, (daysOverdue / 90) * 100);
  return (
    <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ContactTimer({ firstContactAt, debtStartAt }: { firstContactAt: string | null; debtStartAt: string | null }) {
  if (!firstContactAt) return <span className="text-xs text-muted-foreground">ยังไม่ติดต่อ</span>;
  const start = new Date(debtStartAt ?? firstContactAt);
  const now = new Date();
  const isPast = start <= now;
  const diffMs = Math.abs(start.getTime() - now.getTime());
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
  if (isPast) {
    const days = Math.floor(diffMs / 86_400_000);
    return (
      <div className="flex items-center gap-1 text-xs">
        <Clock className="size-3 text-red-500" />
        <span className="text-red-600 dark:text-red-400 font-medium">นับหนี้แล้ว {days} วัน</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs">
      <Clock className="size-3 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400 font-medium">เหลือ {diffH}ช. {diffM}น.</span>
    </div>
  );
}

export function DebtList() {
  const [debts, setDebts] = useState<DebtSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [state, setState] = useState<CollectionState | "all">("all");

  async function load() {
    setIsLoading(true);
    try {
      const r = await listDebts({ state: state === "all" ? undefined : state, q: q.trim() || undefined });
      setDebts(r.debts);
    } catch { /* silent */ } finally { setIsLoading(false); }
  }

  useEffect(() => { void load(); }, [state]);

  const critical = debts.filter((d) => d.collectionState === "COLLECTION" || d.collectionState === "LEGAL").length;
  const totalOutstanding = debts.reduce((s, d) => s + Number(d.totalOutstanding), 0);
  const totalOverdue = debts.reduce((s, d) => s + Number(d.overdueAmount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ลูกหนี้</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ติดตามยอดค้างชำระและสถานะการติดตามหนี้</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ยอดคงค้างรวม</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-muted-foreground">บาท</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="size-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">เกินกำหนด</span>
          </div>
          <p className={`text-xl font-bold tabular-nums ${totalOverdue > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{fmt(totalOverdue)}</p>
          <p className="text-xs text-muted-foreground">บาท</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-red-500" />
            <span className="text-xs text-muted-foreground">วิกฤต</span>
          </div>
          <p className={`text-xl font-bold tabular-nums ${critical > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{critical}</p>
          <p className="text-xs text-muted-foreground">ราย (ติดตาม/คดี)</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); void load(); }}>
        <Input className="h-9 max-w-xs" placeholder="ค้นหาชื่อลูกค้า..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={state} onValueChange={(v) => setState(v as CollectionState | "all")}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm" className="h-9">ค้นหา</Button>
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ลูกค้า</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">ยอดค้าง</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">เกินกำหนด</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">การนับหนี้</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">กำลังโหลด...</td></tr>}
            {!isLoading && debts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Wallet className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">ไม่มีข้อมูลลูกหนี้</p>
                </td>
              </tr>
            )}
            {debts.map((d) => {
              const isCritical = d.collectionState === "COLLECTION" || d.collectionState === "LEGAL";
              return (
                <tr key={d.id} className={`hover:bg-muted/30 transition-colors ${isCritical ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{d.customerCompany?.name ?? d.customerCompanyId}</p>
                    {d.daysOverdue > 0 && <UrgencyBar daysOverdue={d.daysOverdue} />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold">{fmt(d.totalOutstanding)}</span>
                    <span className="text-xs text-muted-foreground ml-1">บาท</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(d.overdueAmount) > 0 ? (
                      <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{fmt(d.overdueAmount ?? 0)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="tabular-nums font-medium">{d.openInvoiceCount}</span>
                    <span className="text-xs text-muted-foreground ml-1">ใบ</span>
                  </td>
                  <td className="px-4 py-3"><DebtStateBadge state={d.collectionState} /></td>
                  <td className="px-4 py-3">
                    <ContactTimer firstContactAt={d.firstContactAt} debtStartAt={d.debtStartAt} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/debt/${d.customerCompanyId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      จัดการ
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && debts.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">{debts.length} บัญชี</div>
        )}
      </div>
    </div>
  );
}
