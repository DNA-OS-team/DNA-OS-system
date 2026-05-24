"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AlertTriangle, Building2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCustomer,
  listCustomerOrders,
  updateCustomer,
} from "./customer-api";
import type {
  Customer,
  CustomerOrderRequestSummary,
  CustomerOrderStatus,
  CustomerOrderSummary,
  OrderRequestStatus,
} from "./types";
import type { CustomerFormValues } from "./schemas";

// ─── Status configs ───────────────────────────────────────────────────────────

const ORDER_STATUS: Record<CustomerOrderStatus, { label: string; color: string }> = {
  DRAFT:               { label: "ร่าง",               color: "bg-gray-100 text-gray-600" },
  SUBMITTED:           { label: "ส่งแล้ว",            color: "bg-blue-100 text-blue-700" },
  PRICING:             { label: "กำลังตีราคา",        color: "bg-yellow-100 text-yellow-700" },
  QUOTED:              { label: "เสนอราคาแล้ว",       color: "bg-orange-100 text-orange-700" },
  CONFIRMED:           { label: "ยืนยันแล้ว",         color: "bg-green-100 text-green-700" },
  PROCUREMENT:         { label: "จัดซื้อ",            color: "bg-sky-100 text-sky-700" },
  DISPATCHING:         { label: "กำลังจัดส่ง",       color: "bg-indigo-100 text-indigo-700" },
  PARTIALLY_DELIVERED: { label: "ส่งบางส่วน",        color: "bg-amber-100 text-amber-700" },
  DELIVERED:           { label: "ส่งครบแล้ว",        color: "bg-emerald-100 text-emerald-700" },
  INVOICED:            { label: "ออกใบแจ้งหนี้แล้ว", color: "bg-purple-100 text-purple-700" },
  PAID:                { label: "ชำระแล้ว",           color: "bg-green-200 text-green-800" },
  CANCELLED:           { label: "ยกเลิก",             color: "bg-red-100 text-red-600" },
};

const REQUEST_STATUS: Record<OrderRequestStatus, { label: string; color: string }> = {
  PENDING:    { label: "รอดำเนินการ",     color: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "กำลังดำเนินการ", color: "bg-blue-100 text-blue-700" },
  CONFIRMED:  { label: "ยืนยันแล้ว",     color: "bg-green-100 text-green-700" },
  CANCELLED:  { label: "ยกเลิก",         color: "bg-red-100 text-red-600" },
};

// ─── Main dialog ──────────────────────────────────────────────────────────────

type Props = {
  customer: Customer | null;
  onClose: () => void;
  onUpdated?: (customer: Customer) => void;
  onDeleted?: (id: string) => void;
};

export function CustomerDialog({ customer, onClose, onUpdated, onDeleted }: Props) {
  return (
    <Dialog open={customer !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0" showCloseButton={false}>
        {customer && (
          <CustomerDialogInner
            customer={customer}
            onClose={onClose}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type View = "detail" | "edit" | "confirmDelete";

function CustomerDialogInner({
  customer,
  onClose,
  onUpdated,
  onDeleted,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdated?: (customer: Customer) => void;
  onDeleted?: (id: string) => void;
}) {
  const [view, setView] = useState<View>("detail");
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [orderRequests, setOrderRequests] = useState<CustomerOrderRequestSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Reset view when a different customer is opened
  useEffect(() => { setView("detail"); setOrdersLoaded(false); }, [customer.id]);

  function loadOrders() {
    if (ordersLoaded) return;
    setLoadingOrders(true);
    listCustomerOrders(customer.id)
      .then((r) => { setOrders(r.orders); setOrderRequests(r.orderRequests); setOrdersLoaded(true); })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }

  if (view === "edit") {
    return (
      <EditView
        customer={customer}
        onSaved={(updated) => { onUpdated?.(updated); setView("detail"); }}
        onCancel={() => setView("detail")}
      />
    );
  }

  if (view === "confirmDelete") {
    return (
      <ConfirmDeleteView
        customer={customer}
        onDeleted={() => { onDeleted?.(customer.id); onClose(); }}
        onCancel={() => setView("detail")}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-5 py-4">
        {customer.linePictureUrl ? (
          <Image
            src={customer.linePictureUrl}
            alt={customer.name}
            width={44}
            height={44}
            className="size-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Building2 className="size-5 text-blue-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <DialogHeader>
            <DialogTitle className="truncate">{customer.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={customer.status} />
            <LineBadge lineDisplayName={customer.lineDisplayName ?? null} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setView("edit")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="แก้ไขบัญชี"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setView("confirmDelete")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
            title="ลบบัญชี"
          >
            <Trash2 className="size-4" />
          </button>
          <a
            href={`/admin/customers/${customer.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="เปิดหน้าเต็ม"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="ปิด"
          >
            <span className="text-base leading-none">✕</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detail" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="mx-5 mt-3 w-fit shrink-0">
          <TabsTrigger value="detail">ข้อมูล</TabsTrigger>
          <TabsTrigger value="orders" onClick={loadOrders}>ออร์เดอร์</TabsTrigger>
        </TabsList>
        <TabsContent value="detail" className="flex-1 overflow-y-auto px-5 pb-5">
          <DetailTab customer={customer} />
        </TabsContent>
        <TabsContent value="orders" className="flex-1 overflow-y-auto px-5 pb-5">
          <OrdersTab orders={orders} orderRequests={orderRequests} loading={loadingOrders} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─── Edit view ────────────────────────────────────────────────────────────────

function EditView({
  customer,
  onSaved,
  onCancel,
}: {
  customer: Customer;
  onSaved: (updated: Customer) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CustomerFormValues>({
    name: customer.name,
    taxId: customer.taxId ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    bankName: customer.bankName ?? "",
    bankAccountNo: customer.bankAccountNo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof CustomerFormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อบริษัท"); return; }
    setSaving(true); setError(null);
    try {
      const result = await updateCustomer(customer.id, form);
      onSaved({ ...customer, ...result.customer });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="border-b px-5 py-4">
        <DialogHeader>
          <DialogTitle>แก้ไขบัญชีลูกค้า</DialogTitle>
        </DialogHeader>
        <p className="mt-0.5 text-xs text-muted-foreground">{customer.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="e-name">ชื่อบริษัท <span className="text-destructive">*</span></Label>
              <Input id="e-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-taxId">เลขประจำตัวผู้เสียภาษี</Label>
              <Input id="e-taxId" value={form.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-phone">เบอร์โทร</Label>
              <Input id="e-phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-email">อีเมล</Label>
            <Input id="e-email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-address">ที่อยู่</Label>
            <Textarea id="e-address" rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-bank">ธนาคาร</Label>
              <Input id="e-bank" value={form.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-bankNo">เลขบัญชี</Label>
              <Input id="e-bankNo" value={form.bankAccountNo ?? ""} onChange={(e) => set("bankAccountNo", e.target.value)} />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Confirm Delete view ──────────────────────────────────────────────────────

function ConfirmDeleteView({
  customer,
  onDeleted,
  onCancel,
}: {
  customer: Customer;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true); setError(null);
    try {
      await deleteCustomer(customer.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <DialogHeader>
            <DialogTitle className="text-destructive">ยืนยันการลบ</DialogTitle>
          </DialogHeader>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-2 text-sm">
        <p>คุณต้องการลบลูกค้า <span className="font-semibold">{customer.name}</span> ออกจากระบบหรือไม่?</p>
        <p className="text-muted-foreground">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={deleting}>ยกเลิก</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "กำลังลบ..." : "ลบ"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Detail Tab ───────────────────────────────────────────────────────────────

function DetailTab({ customer }: { customer: Customer }) {
  const credit = customer.customerCreditProfile;
  return (
    <div className="mt-4 space-y-5">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ข้อมูลบริษัท</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          <InfoRow label="เลขภาษี">{customer.taxId ?? "-"}</InfoRow>
          <InfoRow label="เบอร์โทร">{customer.phone ?? "-"}</InfoRow>
          <InfoRow label="อีเมล">{customer.email ?? "-"}</InfoRow>
          {customer.address && <InfoRow label="ที่อยู่" className="col-span-2">{customer.address}</InfoRow>}
          {customer.bankName && <InfoRow label="ธนาคาร">{customer.bankName}</InfoRow>}
          {customer.bankAccountNo && <InfoRow label="เลขบัญชี">{customer.bankAccountNo}</InfoRow>}
          <InfoRow label="สมัครเมื่อ">
            {new Date(customer.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
          </InfoRow>
          <InfoRow label="สถานที่">{customer.siteCount ?? 0} แห่ง</InfoRow>
        </div>
      </section>

      {(customer.contactName ?? customer.contactPhone) && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ผู้ติดต่อ (LINE)</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
            <InfoRow label="ชื่อ">{customer.contactName ?? "-"}</InfoRow>
            <InfoRow label="เบอร์">{customer.contactPhone ?? "-"}</InfoRow>
            {customer.lineDisplayName && <InfoRow label="LINE">{customer.lineDisplayName}</InfoRow>}
          </div>
        </section>
      )}

      {credit && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">เครดิต</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
            <InfoRow label="สถานะเครดิต"><CreditStatusBadge status={credit.creditStatus} /></InfoRow>
            <InfoRow label="วงเงินเครดิต">{fmtMoney(credit.creditLimit)} บาท</InfoRow>
            <InfoRow label="เทอมชำระ">{credit.creditTermDays} วัน</InfoRow>
            <InfoRow label="ยอดค้างชำระ">{fmtMoney(credit.currentOutstanding)} บาท</InfoRow>
            <InfoRow label="ค้างเกินกำหนด">{fmtMoney(credit.overdueAmount)} บาท</InfoRow>
            <InfoRow label="คะแนนพฤติกรรม">{credit.paymentBehaviorScore} / 100</InfoRow>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders, orderRequests, loading }: {
  orders: CustomerOrderSummary[];
  orderRequests: CustomerOrderRequestSummary[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }
  if (orders.length + orderRequests.length === 0) {
    return <div className="mt-8 text-center text-sm text-muted-foreground">ยังไม่มีออร์เดอร์</div>;
  }
  return (
    <div className="mt-4 space-y-5">
      {orderRequests.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            คำขอสั่งซื้อ (LINE) — {orderRequests.length} รายการ
          </p>
          <div className="space-y-2">
            {orderRequests.map((r) => {
              const cfg = REQUEST_STATUS[r.status];
              return (
                <div key={r.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium">{r.reqNo}</span>
                      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {r.items.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.items.map((it) => it.productVariant
                        ? `${it.productVariant.product.name} ${it.quantity} ${it.unit}`
                        : `${it.quantity} ${it.unit}`
                      ).join(", ")}
                    </p>
                  )}
                  {r.deliveryAddress && <p className="mt-0.5 truncate text-xs text-muted-foreground">📍 {r.deliveryAddress}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ออร์เดอร์ — {orders.length} รายการ
          </p>
          <div className="space-y-2">
            {orders.map((o) => {
              const cfg = ORDER_STATUS[o.status];
              return (
                <a key={o.id} href={`/admin/orders/${o.id}`}
                  className="block rounded-xl border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium">{o.orderNo}</span>
                      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {o.items.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.items.map((it) => it.productVariant
                        ? `${it.productVariant.product.name} / ${it.productVariant.name}`
                        : "สินค้า"
                      ).join(", ")}{o.items.length >= 3 ? " ..." : ""}
                    </p>
                  )}
                  <OrderStatusPipeline status={o.status} />
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Order status pipeline bar ────────────────────────────────────────────────

const PIPELINE_STEPS: CustomerOrderStatus[] = [
  "SUBMITTED", "PRICING", "QUOTED", "CONFIRMED",
  "PROCUREMENT", "DISPATCHING", "DELIVERED", "INVOICED", "PAID",
];

function OrderStatusPipeline({ status }: { status: CustomerOrderStatus }) {
  if (status === "DRAFT" || status === "CANCELLED") return null;
  const currentIdx = PIPELINE_STEPS.indexOf(status);
  return (
    <div className="mt-2 flex gap-0.5">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step} className={`h-1 flex-1 rounded-full ${i <= currentIdx ? "bg-primary" : "bg-muted"}`} title={ORDER_STATUS[step].label} />
      ))}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function InfoRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}

function LineBadge({ lineDisplayName }: { lineDisplayName: string | null }) {
  if (lineDisplayName) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#06C755]/10 px-2 py-0.5 text-[10px] font-semibold text-[#06C755]">
        <span className="size-1.5 rounded-full bg-[#06C755]" />LINE เชื่อมต่อแล้ว
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />ยังไม่เชื่อมต่อ LINE
    </span>
  );
}

function StatusBadge({ status }: { status: Customer["status"] }) {
  const map = { ACTIVE: ["default", "ใช้งาน"], INACTIVE: ["secondary", "ปิดใช้งาน"], SUSPENDED: ["secondary", "ระงับ"] } as const;
  const [variant, label] = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const CREDIT_STATUS_CFG = {
  NORMAL:  { label: "ปกติ",          color: "bg-green-100 text-green-700" },
  WATCH:   { label: "เฝ้าระวัง",    color: "bg-yellow-100 text-yellow-700" },
  HOLD:    { label: "หยุดชั่วคราว", color: "bg-orange-100 text-orange-700" },
  BLOCKED: { label: "ระงับ",         color: "bg-red-100 text-red-600" },
};

function CreditStatusBadge({ status }: { status: keyof typeof CREDIT_STATUS_CFG }) {
  const { label, color } = CREDIT_STATUS_CFG[status];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>;
}

function fmtMoney(value: string | number) {
  return Number(value).toLocaleString("th-TH", { maximumFractionDigits: 2 });
}
