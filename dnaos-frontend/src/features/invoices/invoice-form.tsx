"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { getDocumentCreateOptions } from "@/features/documents/document-standalone-api";
import type { CreateOption, OrderOption, ProjectOption } from "@/features/documents/document-standalone-api";
import { createInvoice } from "./invoice-api";

type LineItem = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

const emptyItem = (): LineItem => ({ description: "", quantity: "1", unit: "รายการ", unitPrice: "0" });

export function InvoiceForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CreateOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocumentCreateOptions().then((opts) => {
      setCustomers(opts.customers);
      setProjects(opts.projects);
      setOrders(opts.orders);
    }).catch(() => {});
  }, []);

  const filteredProjects = projects.filter(
    (p) => !customerId || p.customerCompanyId === customerId
  );
  const filteredOrders = orders.filter(
    (o) => !customerId || o.customerCompanyId === customerId
  );

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer?.address) setRecipientAddress(customer.address);
    setProjectId("");
    setOrderId("");
  }

  function handleOrderChange(id: string) {
    setOrderId(id);
    const order = orders.find((o) => o.id === id);
    if (order) setReferenceNo(order.orderNo);
  }

  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const vatRate = 0.07;
  const parsedItems = items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    unit: it.unit,
    unitPrice: Number(it.unitPrice) || 0,
    totalPrice: Math.round((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * 100) / 100,
  }));
  const subtotal = parsedItems.reduce((s, it) => s + it.totalPrice, 0);
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const totalAmount = subtotal + vatAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { setError("กรุณาเลือกลูกค้า"); return; }
    if (items.some((it) => !it.description.trim())) { setError("กรุณาระบุรายละเอียดทุกรายการ"); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createInvoice({
        customerCompanyId: customerId,
        customerOrderId: orderId || null,
        projectId: projectId || null,
        dueDate: dueDate || null,
        referenceNo: referenceNo.trim() || null,
        recipientAddress: recipientAddress.trim() || null,
        notes: notes.trim() || null,
        vatRate,
        items: parsedItems,
      });
      router.push(`/admin/invoices/${result.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้าง invoice ไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>ข้อมูลหัว Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>ลูกค้า *</Label>
              <Select value={customerId} onValueChange={(v) => v && handleCustomerChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>โปรเจกต์ (ไม่บังคับ)</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกโปรเจกต์" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNo} — {p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Order (ไม่บังคับ)</Label>
              <Select value={orderId} onValueChange={(v) => v && handleOrderChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือก order" />
                </SelectTrigger>
                <SelectContent>
                  {filteredOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.orderNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-no">เลขอ้างอิง</Label>
              <Input
                id="ref-no"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due-date">วันครบกำหนด</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient-address">ที่อยู่ผู้รับ</Label>
              <Textarea
                id="recipient-address"
                rows={3}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">เลข Invoice</Label>
              <p className="text-sm text-muted-foreground italic">(จะสร้างอัตโนมัติเมื่อบันทึก)</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>รายการสินค้า/บริการ</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="size-3.5 mr-1" />
                เพิ่มรายการ
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_100px_32px] gap-1 items-end">
                  <div>
                    {i === 0 ? <Label className="text-xs">รายละเอียด</Label> : null}
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="รายละเอียด"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    {i === 0 ? <Label className="text-xs">จำนวน</Label> : null}
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    {i === 0 ? <Label className="text-xs">หน่วย</Label> : null}
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(i, "unit", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    {i === 0 ? <Label className="text-xs">ราคา/หน่วย</Label> : null}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className={i === 0 ? "mt-5" : ""}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยอดก่อนภาษี</span>
                <span>{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT 7%</span>
                <span>{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
                <span>ยอดรวม</span>
                <span>{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "กำลังสร้าง..." : "สร้าง Invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
