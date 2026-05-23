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
import { listDebts, type CollectionState, type DebtSnapshot } from "./debt-api";

export const STATE_LABEL: Record<CollectionState, string> = {
  CURRENT:    "ปกติ",
  OVERDUE:    "เกินกำหนด",
  WARNING:    "แจ้งเตือน",
  COLLECTION: "ติดตามหนี้",
  PROMISED:   "สัญญาชำระ",
  PARTIAL:    "ชำระบางส่วน",
  LEGAL:      "ดำเนินคดี",
  CLOSED:     "ปิดแล้ว",
};

export const STATE_VARIANT: Record<CollectionState, "default" | "secondary" | "destructive" | "outline"> = {
  CURRENT:    "outline",
  OVERDUE:    "secondary",
  WARNING:    "default",
  COLLECTION: "destructive",
  PROMISED:   "secondary",
  PARTIAL:    "default",
  LEGAL:      "destructive",
  CLOSED:     "outline",
};

function ContactTimer({ firstContactAt, debtStartAt }: { firstContactAt: string | null; debtStartAt: string | null }) {
  if (!firstContactAt) return <span className="text-muted-foreground text-xs">ยังไม่ได้ติดต่อ</span>;

  const start = new Date(debtStartAt ?? firstContactAt);
  const now = new Date();
  const isPast = start <= now;
  const diffMs = Math.abs(start.getTime() - now.getTime());
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);

  if (isPast) {
    const days = Math.floor(diffMs / 86_400_000);
    return (
      <div className="text-xs">
        <div className="text-destructive font-medium">เริ่มนับหนี้แล้ว {days} วัน</div>
        <div className="text-muted-foreground">{new Date(firstContactAt).toLocaleDateString("th-TH")}</div>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div className="text-yellow-600 font-medium">เหลือ {diffH}ชม. {diffM}นาที</div>
      <div className="text-muted-foreground">ติดต่อ {new Date(firstContactAt).toLocaleDateString("th-TH")}</div>
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
      const result = await listDebts({
        state: state === "all" ? undefined : state,
        q: q.trim() || undefined,
      });
      setDebts(result.debts);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [state]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  const activeDebts = debts.filter((d) => d.collectionState !== "CLOSED" && d.collectionState !== "CURRENT");
  const totalOutstanding = debts.reduce((s, d) => s + Number(d.totalOutstanding), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">แดชบอร์ดลูกหนี้</h1>
          <p className="text-sm text-muted-foreground">ติดตามยอดค้างชำระและสถานะการติดตามหนี้</p>
        </div>
        <div className="flex gap-3 text-sm text-right">
          <div>
            <div className="font-semibold text-destructive">{activeDebts.length} ราย</div>
            <div className="text-muted-foreground">ค้างชำระ</div>
          </div>
          <div>
            <div className="font-semibold">{totalOutstanding.toLocaleString("th-TH")} บาท</div>
            <div className="text-muted-foreground">ยอดรวมค้าง</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input
              placeholder="ค้นหาชื่อลูกค้า..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select value={state} onValueChange={(v) => setState((v ?? "all") as CollectionState | "all")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {(Object.keys(STATE_LABEL) as CollectionState[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATE_LABEL[s]}</SelectItem>
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
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ยอดค้าง</TableHead>
                <TableHead>เกินกำหนด</TableHead>
                <TableHead>จำนวน Invoice</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>การติดต่อ / นับหนี้</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">กำลังโหลด...</TableCell>
                </TableRow>
              ) : null}
              {!isLoading && debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">ไม่มีข้อมูลลูกหนี้</TableCell>
                </TableRow>
              ) : null}
              {debts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.customerCompany?.name ?? d.customerCompanyId}</TableCell>
                  <TableCell className="font-medium">
                    {Number(d.totalOutstanding).toLocaleString("th-TH")} บาท
                    {Number(d.overdueAmount) > 0 ? (
                      <div className="text-xs text-destructive">
                        เกินกำหนด {Number(d.overdueAmount).toLocaleString("th-TH")} บาท
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.daysOverdue > 0 ? (
                      <span className="text-destructive font-medium">{d.daysOverdue} วัน</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{d.openInvoiceCount} ใบ</TableCell>
                  <TableCell>
                    <Badge variant={STATE_VARIANT[d.collectionState]}>
                      {STATE_LABEL[d.collectionState]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ContactTimer firstContactAt={d.firstContactAt} debtStartAt={d.debtStartAt} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/debt/${d.customerCompanyId}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      จัดการ
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
