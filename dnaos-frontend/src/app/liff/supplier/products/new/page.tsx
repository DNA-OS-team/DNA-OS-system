"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

const UNITS = ["ตัน", "คิว", "ลูกบาศก์เมตร", "ถุง", "กระสอบ", "ชิ้น", "กล่อง", "ลิตร", "กิโลกรัม", "เมตร"];
const CATEGORIES = ["หิน", "ทราย", "ปูน", "เหล็ก", "ไม้", "กระเบื้อง", "สี", "ท่อ", "ไฟฟ้า", "อื่นๆ"];

export default function LiffSupplierNewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    requestedProductName: "",
    requestedCategoryName: "",
    description: "",
    unit: "",
    price: "",
    stockQty: "",
    minQty: "",
    serviceArea: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.requestedProductName.trim()) return setError("กรุณาระบุชื่อสินค้า");
    if (!form.unit) return setError("กรุณาเลือกหน่วย");
    if (!form.price || Number(form.price) <= 0) return setError("กรุณาระบุราคา");

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/liff/supplier/products/submit", {
        method: "POST",
        body: JSON.stringify({
          requestedProductName: form.requestedProductName.trim(),
          requestedCategoryName: form.requestedCategoryName.trim() || undefined,
          description: form.description.trim() || undefined,
          unit: form.unit,
          price: Number(form.price),
          stockQty: Number(form.stockQty) || 0,
          minQty: Number(form.minQty) || 0,
          serviceArea: form.serviceArea.trim() || undefined,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <CheckCircle2 className="size-16 text-green-500" />
        <div>
          <p className="text-lg font-bold">ส่งคำขออนุมัติแล้ว</p>
          <p className="mt-1 text-sm text-muted-foreground">แอดมินจะตรวจสอบและแจ้งผลให้ทราบครับ</p>
        </div>
        <button
          onClick={() => router.push("/liff/supplier/products")}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          กลับหน้าสินค้า
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => router.back()} className="flex size-8 items-center justify-center rounded-full hover:bg-muted">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold">เพิ่มสินค้าใหม่</h1>
      </div>

      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
        สินค้าจะถูกส่งให้แอดมินตรวจสอบก่อนแสดงในระบบ
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ชื่อสินค้า */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">ชื่อสินค้า *</label>
          <input
            value={form.requestedProductName}
            onChange={(e) => set("requestedProductName", e.target.value)}
            placeholder="เช่น หินคลุก, ทรายหยาบ, ปูนซีเมนต์..."
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* หมวดหมู่ */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">หมวดหมู่</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set("requestedCategoryName", form.requestedCategoryName === cat ? "" : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${form.requestedCategoryName === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* หน่วย */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">หน่วย *</label>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => set("unit", form.unit === u ? "" : u)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${form.unit === u ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* ราคา */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">ราคา (บาท) *</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">สต๊อกเริ่มต้น</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.stockQty}
              onChange={(e) => set("stockQty", e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* ปริมาณขั้นต่ำ */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">ปริมาณสั่งขั้นต่ำ</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.minQty}
            onChange={(e) => set("minQty", e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* พื้นที่ให้บริการ */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">พื้นที่ให้บริการ</label>
          <input
            value={form.serviceArea}
            onChange={(e) => set("serviceArea", e.target.value)}
            placeholder="เช่น กรุงเทพฯ, นนทบุรี, ปทุมธานี"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">รายละเอียดเพิ่มเติม</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="สเปค, คุณสมบัติ, เงื่อนไขพิเศษ..."
            rows={3}
            className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "กำลังส่ง..." : "ส่งขออนุมัติ"}
        </button>
      </form>
    </div>
  );
}
