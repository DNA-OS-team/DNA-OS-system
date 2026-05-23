"use client";

import { ArrowLeft, CheckCircle, Receipt, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  confirmPayment,
  getInvoice,
  recordPayment,
  rejectPayment,
  sendInvoice,
  voidInvoice,
  type Invoice,
  type PaymentMethod,
} from "./invoice-api";
import { STATUS_LABEL, STATUS_VARIANT } from "./invoice-list";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "โอนเงิน",
  CASH: "เงินสด",
  CHEQUE: "เช็ค",
  CREDIT_CARD: "บัตรเครดิต",
  OTHER: "อื่นๆ",
};

const PAYMENT_METHODS: PaymentMethod[] = [
  "BANK_TRANSFER", "CASH", "CHEQUE", "CREDIT_CARD", "OTHER",
];

type Props = { invoiceId: string };

export function InvoiceDetail({ invoiceId }: Props) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");
  const [paySlip, setPaySlip] = useState("");
  const [payNotes, setPayNotes] = useState("");

  async function load() {
    setIsLoading(true);
    try {
      const result = await getInvoice(invoiceId);
      setInvoice(result.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [invoiceId]);

  async function handleSend() {
    setIsSaving(true); setError(null);
    try { const r = await sendInvoice(invoiceId); setInvoice(r.invoice); }
    catch (err) { setError(err instanceof Error ? err.message : "ส่ง invoice ไม่สำเร็จ"); }
    finally { setIsSaving(false); }
  }

  async function handleVoid() {
    if (!confirm("ยืนยันยกเลิก invoice นี้?")) return;
    setIsSaving(true); setError(null);
    try { const r = await voidInvoice(invoiceId); setInvoice(r.invoice); }
    catch (err) { setError(err instanceof Error ? err.message : "ยกเลิก invoice ไม่สำเร็จ"); }
    finally { setIsSaving(false); }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payAmount) return;
    setIsSaving(true); setError(null);
    try {
      await recordPayment(invoiceId, {
        paymentMethod: payMethod,
        amount: Number(payAmount),
        paidAt: payDate,
        referenceNo: payRef.trim() || null,
        slipUrl: paySlip.trim() || null,
        notes: payNotes.trim() || null,
      });
      setShowPayForm(false);
      setPayAmount(""); setPayRef(""); setPaySlip(""); setPayNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกการชำระเงินไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirm(paymentId: string) {
    setIsSaving(true); setError(null);
    try { const r = await confirmPayment(invoiceId, paymentId); setInvoice(r.invoice); }
    catch (err) { setError(err instanceof Error ? err.message : "ยืนยันไม่สำเร็จ"); }
    finally { setIsSaving(false); }
  }

  async function handleReject(paymentId: string) {
    setIsSaving(true); setError(null);
    try { const r = await rejectPayment(invoiceId, paymentId); setInvoice(r.invoice); }
    catch (err) { setError(err instanceof Error ? err.message : "ปฏิเสธไม่สำเร็จ"); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <div className="text-muted-foreground">กำลังโหลด...</div>;
  if (!invoice) return (
    <Alert variant="destructive">
      <AlertTitle>ไม่พบ invoice</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  const canSend = invoice.invoiceStatus === "DRAFT";
  const canVoid = invoice.invoiceStatus !== "PAID" && invoice.invoiceStatus !== "VOID";
  const canPay = invoice.invoiceStatus === "SENT" || invoice.invoiceStatus === "PARTIALLY_PAID";
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/invoices" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-normal">{invoice.invoiceNo}</h1>
            <Badge variant={STATUS_VARIANT[invoice.invoiceStatus]}>
              {STATUS_LABEL[invoice.invoiceStatus]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.customerCompany?.name ?? "-"}
            {invoice.receiptNo ? ` · ใบเสร็จ ${invoice.receiptNo}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {canSend ? (
            <Button size="sm" onClick={handleSend} disabled={isSaving}>ส่ง Invoice</Button>
          ) : null}
          {canVoid ? (
            <Button size="sm" variant="destructive" onClick={handleVoid} disabled={isSaving}>
              ยกเลิก
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}

      {invoice.invoiceStatus === "PAID" && invoice.receiptNo ? (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Receipt className="size-4" />
          <AlertTitle>ชำระครบแล้ว — ใบเสร็จ {invoice.receiptNo}</AlertTitle>
          <AlertDescription>
            ออกเมื่อ {invoice.receiptIssuedAt ? new Date(invoice.receiptIssuedAt).toLocaleString("th-TH") : "-"}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>รายละเอียด Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-1">
              <span className="text-muted-foreground">ลูกค้า</span>
              <span>{invoice.customerCompany?.name ?? "-"}</span>

              {invoice.customerOrder ? (
                <>
                  <span className="text-muted-foreground">Order</span>
                  <Link href={`/admin/orders/${invoice.customerOrder.id}`} className="text-blue-600 underline">
                    {invoice.customerOrder.orderNo}
                  </Link>
                </>
              ) : null}

              {invoice.project ? (
                <>
                  <span className="text-muted-foreground">โปรเจกต์</span>
                  <span>{invoice.project.projectNo} — {invoice.project.title}</span>
                </>
              ) : null}

              {invoice.referenceNo ? (
                <>
                  <span className="text-muted-foreground">อ้างอิง</span>
                  <span>{invoice.referenceNo}</span>
                </>
              ) : null}

              <span className="text-muted-foreground">วันที่ออก</span>
              <span>{new Date(invoice.invoiceDate).toLocaleDateString("th-TH")}</span>

              {invoice.dueDate ? (
                <>
                  <span className="text-muted-foreground">ครบกำหนด</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString("th-TH")}</span>
                </>
              ) : null}

              <span className="text-muted-foreground">ยอดรวม</span>
              <span className="font-semibold">{Number(invoice.totalAmount).toLocaleString("th-TH")} บาท</span>

              <span className="text-muted-foreground">ชำระแล้ว</span>
              <span className="font-semibold text-green-700">{Number(invoice.paidAmount).toLocaleString("th-TH")} บาท</span>

              <span className="text-muted-foreground">ค้างชำระ</span>
              <span className={remaining > 0 ? "font-semibold text-destructive" : "font-semibold"}>
                {remaining.toLocaleString("th-TH")} บาท
              </span>
            </div>

            {invoice.recipientAddress ? (
              <div>
                <p className="text-muted-foreground">ที่อยู่ผู้รับ</p>
                <p className="mt-1 whitespace-pre-line text-sm">{invoice.recipientAddress}</p>
              </div>
            ) : null}
            {invoice.notes ? (
              <div>
                <p className="text-muted-foreground">หมายเหตุ</p>
                <p className="mt-1 whitespace-pre-line text-sm">{invoice.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>รายการ</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead className="text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoice.items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toLocaleString("th-TH")}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium">{Number(item.totalPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-muted-foreground text-sm">ก่อนภาษี</TableCell>
                  <TableCell className="text-right">{Number(invoice.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-muted-foreground text-sm">VAT {Math.round(Number(invoice.vatRate) * 100)}%</TableCell>
                  <TableCell className="text-right">{Number(invoice.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">รวมทั้งสิ้น</TableCell>
                  <TableCell className="text-right font-semibold">{Number(invoice.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>การชำระเงิน</CardTitle>
          {canPay ? (
            <Button size="sm" variant="outline" onClick={() => setShowPayForm((v) => !v)}>
              + บันทึกการชำระเงิน
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {showPayForm ? (
            <form className="rounded-md border p-3 space-y-3" onSubmit={handleRecordPayment}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">วิธีชำระ</Label>
                  <Select value={payMethod} onValueChange={(v) => v && setPayMethod(v as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-amount" className="text-xs">จำนวนเงิน (บาท) *</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={remaining.toFixed(2)}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-date" className="text-xs">วันที่ชำระ *</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-ref" className="text-xs">เลขอ้างอิง</Label>
                  <Input
                    id="pay-ref"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="pay-slip" className="text-xs">URL สลิป (ไม่บังคับ)</Label>
                  <Input
                    id="pay-slip"
                    placeholder="https://..."
                    value={paySlip}
                    onChange={(e) => setPaySlip(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="pay-notes" className="text-xs">หมายเหตุ</Label>
                  <Textarea id="pay-notes" rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={() => setShowPayForm(false)}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>วิธี</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.payments ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">ยังไม่มีการชำระเงิน</TableCell>
                </TableRow>
              ) : null}
              {(invoice.payments ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{new Date(p.paidAt).toLocaleDateString("th-TH")}</TableCell>
                  <TableCell className="text-sm">{PAYMENT_METHOD_LABEL[p.paymentMethod]}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {Number(p.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                    {p.slipUrl ? (
                      <a href={p.slipUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-blue-600 underline">สลิป</a>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.referenceNo ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      p.paymentStatus === "CONFIRMED" ? "default" :
                      p.paymentStatus === "REJECTED" ? "destructive" : "secondary"
                    }>
                      {p.paymentStatus === "CONFIRMED" ? "ยืนยันแล้ว" :
                       p.paymentStatus === "REJECTED" ? "ปฏิเสธ" : "รอยืนยัน"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.paymentStatus === "PENDING" ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600"
                          onClick={() => handleConfirm(p.id)}
                          disabled={isSaving}
                          title="ยืนยัน"
                        >
                          <CheckCircle className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleReject(p.id)}
                          disabled={isSaving}
                          title="ปฏิเสธ"
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    ) : null}
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
