"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DebtStateBadge } from "@/components/shared/status-badge";
import {
  addCollectionNote,
  getDebtDetail,
  recordFirstContact,
  refreshDebt,
  transitionState,
  type CollectionState,
  type DebtSnapshot,
  type DebtInvoice,
  type CollectionNote,
} from "./debt-api";

const STATE_LABEL: Record<CollectionState, string> = {
  CURRENT:    "ปกติ",
  OVERDUE:    "เกินกำหนด",
  WARNING:    "แจ้งเตือน",
  COLLECTION: "ติดตามหนี้",
  PROMISED:   "สัญญาชำระ",
  PARTIAL:    "ชำระบางส่วน",
  LEGAL:      "ดำเนินคดี",
  CLOSED:     "ปิดแล้ว",
};

const MANUAL_STATES: CollectionState[] = ["PROMISED", "PARTIAL", "LEGAL", "CLOSED"];

function DebtTimer({ snapshot }: { snapshot: DebtSnapshot }) {
  const { firstContactAt, debtStartAt } = snapshot;

  if (!firstContactAt) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        <div className="font-medium text-muted-foreground mb-1">การติดต่อครั้งแรก</div>
        <div className="text-muted-foreground">ยังไม่ได้บันทึกการติดต่อ</div>
        <div className="mt-2 text-xs text-muted-foreground">
          หลังบันทึกการติดต่อ ระบบจะนับ 24 ชั่วโมง ก่อนเริ่ม debt period
        </div>
      </div>
    );
  }

  const now = new Date();
  const start = debtStartAt ? new Date(debtStartAt) : null;
  const isStarted = start && start <= now;
  const diffMs = start ? Math.abs(start.getTime() - now.getTime()) : 0;
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);

  return (
    <div className={`rounded-lg border p-4 text-sm ${isStarted ? "border-destructive/50 bg-destructive/5" : "border-yellow-300 bg-yellow-50"}`}>
      <div className="font-medium mb-1">
        {isStarted ? "เริ่มนับหนี้แล้ว" : "ช่วงผ่อนผัน 24 ชั่วโมง"}
      </div>
      <div className="text-2xl font-bold">
        {isStarted
          ? `${days} วัน ${hours} ชม.`
          : `เหลือ ${hours} ชม. ${mins} นาที`}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        ติดต่อครั้งแรก: {new Date(firstContactAt).toLocaleString("th-TH")}
        {start ? ` — เริ่มนับ: ${start.toLocaleString("th-TH")}` : ""}
      </div>
    </div>
  );
}

export function DebtDetail({ customerCompanyId }: { customerCompanyId: string }) {
  const [snapshot, setSnapshot] = useState<DebtSnapshot | null>(null);
  const [invoices, setInvoices] = useState<DebtInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [promisedPayDate, setPromisedPayDate] = useState("");
  const [toState, setToState] = useState<CollectionState>("PROMISED");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getDebtDetail(customerCompanyId);
      setSnapshot(data.snapshot);
      setInvoices(data.invoices);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [customerCompanyId]);

  async function handleFirstContact() {
    setIsSaving(true);
    setError(null);
    try {
      const data = await recordFirstContact(customerCompanyId, "บันทึกการติดต่อลูกค้า");
      setSnapshot(data.snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await addCollectionNote(customerCompanyId, {
        note: note.trim(),
        promisedPayDate: promisedPayDate || null,
      });
      setNote("");
      setPromisedPayDate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTransition() {
    setIsSaving(true);
    setError(null);
    try {
      const data = await transitionState(customerCompanyId, toState, note.trim() || undefined);
      setSnapshot(data.snapshot);
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRefresh() {
    setIsSaving(true);
    try {
      const data = await refreshDebt(customerCompanyId);
      setSnapshot(data.snapshot);
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">กำลังโหลด...</div>;

  const notes: CollectionNote[] = snapshot?.collectionNotes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/debt" className="text-sm text-muted-foreground hover:underline">
            ← กลับรายการลูกหนี้
          </Link>
          <h1 className="text-xl font-semibold mt-1">
            {snapshot?.customerCompany?.name ?? customerCompanyId}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          {snapshot && <DebtStateBadge state={snapshot.collectionState} />}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isSaving}>
            รีเฟรช
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ยอดค้างชำระ</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(snapshot?.totalOutstanding ?? 0).toLocaleString("th-TH")} บาท
            </div>
            {Number(snapshot?.overdueAmount ?? 0) > 0 && (
              <div className="text-sm text-destructive mt-1">
                เกินกำหนด {Number(snapshot?.overdueAmount ?? 0).toLocaleString("th-TH")} บาท
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">จำนวน Invoice ค้าง</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snapshot?.openInvoiceCount ?? 0} ใบ</div>
            {(snapshot?.daysOverdue ?? 0) > 0 && (
              <div className="text-sm text-destructive mt-1">เกินกำหนด {snapshot?.daysOverdue} วัน</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">การติดต่อ</CardTitle></CardHeader>
          <CardContent>
            {snapshot?.firstContactAt ? (
              <div className="text-sm">
                <div className="font-medium">{new Date(snapshot.firstContactAt).toLocaleDateString("th-TH")}</div>
                {snapshot.debtStartAt && (
                  <div className="text-muted-foreground text-xs mt-1">
                    เริ่มนับหนี้: {new Date(snapshot.debtStartAt).toLocaleDateString("th-TH")}
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={handleFirstContact} disabled={isSaving}>
                บันทึกการติดต่อครั้งแรก
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {snapshot && <DebtTimer snapshot={snapshot} />}

      {/* Invoice list */}
      <Card>
        <CardHeader><CardTitle>Invoice ค้างชำระ</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">ไม่มี invoice ค้างชำระ</div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-medium">{inv.invoiceNo}</div>
                    {inv.customerOrder && (
                      <div className="text-xs text-muted-foreground">Order: {inv.customerOrder.orderNo}</div>
                    )}
                    {inv.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        ครบกำหนด: {new Date(inv.dueDate).toLocaleDateString("th-TH")}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{Number(inv.totalAmount).toLocaleString("th-TH")} บาท</div>
                    <div className="text-xs text-muted-foreground">
                      ชำระแล้ว {Number(inv.paidAmount).toLocaleString("th-TH")} บาท
                    </div>
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className={buttonVariants({ variant: "link", size: "sm" }) + " h-auto p-0"}
                    >
                      ดู Invoice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add note + state transition */}
      <Card>
        <CardHeader><CardTitle>บันทึกการดำเนินการ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddNote} className="space-y-3">
            <Textarea
              placeholder="บันทึกการติดต่อ สัญญา หรือหมายเหตุ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="วันที่สัญญาชำระ"
                value={promisedPayDate}
                onChange={(e) => setPromisedPayDate(e.target.value)}
                className="w-48"
              />
              <Button type="submit" disabled={isSaving || !note.trim()}>
                บันทึกหมายเหตุ
              </Button>
            </div>
          </form>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">เปลี่ยนสถานะ</div>
            <div className="flex gap-2">
              <Select value={toState} onValueChange={(v) => setToState(v as CollectionState)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{STATE_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleTransition} disabled={isSaving}>
                เปลี่ยนสถานะ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection notes history */}
      {notes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>ประวัติการติดต่อ</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {notes.map((n) => (
                <div key={n.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 text-sm">{n.note}</div>
                    <DebtStateBadge state={n.collectionState} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex gap-3">
                    <span>{new Date(n.createdAt).toLocaleString("th-TH")}</span>
                    {n.createdByAdmin && <span>โดย {n.createdByAdmin.username}</span>}
                    {n.promisedPayDate && (
                      <span>สัญญาชำระ: {new Date(n.promisedPayDate).toLocaleDateString("th-TH")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
