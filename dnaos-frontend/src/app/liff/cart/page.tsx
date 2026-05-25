"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/features/liff/cart-context";
import { apiFetch } from "@/lib/api";
import type { CustomerSite } from "@/features/customer-portal/customer-order-api";

export default function LiffCartPage() {
  const router = useRouter();
  const { items, update, remove, clear, total } = useCart();
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [siteId, setSiteId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ sites: CustomerSite[] }>("/customer/sites")
      .then((r) => {
        setSites(r.sites);
        if (r.sites[0]) setSiteId(r.sites[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleOrder() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const site = sites.find((s) => s.id === siteId);
      await apiFetch("/customer/orders/request", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({
            productVariantId: i.productVariantId,
            quantity: i.quantity,
            unit: i.unit,
          })),
          deliveryAddress: site?.address ?? "ระบุที่อยู่ในหมายเหตุ",
          note: note.trim() || null,
        }),
      });
      clear();
      router.push("/liff/orders");
    } catch {
      setError("ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <ShoppingBag className="size-16 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">ตะกร้าว่างอยู่</p>
        <button
          onClick={() => router.push("/liff/shop")}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          เลือกสินค้า
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">ตะกร้าสินค้า</h1>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.productVariantId} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.variantName} · {item.unit}</p>
              <p className="text-sm font-bold text-primary mt-0.5">
                ฿{(item.price * item.quantity).toLocaleString("th-TH")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => update(item.productVariantId, item.quantity - 1)}
                className="flex size-8 items-center justify-center rounded-full border"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => update(item.productVariantId, item.quantity + 1)}
                className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                onClick={() => remove(item.productVariantId)}
                className="ml-1 flex size-8 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery site */}
      {sites.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">ที่อยู่จัดส่ง</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.siteName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">หมายเหตุ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="วันที่ต้องการ, รายละเอียดเพิ่มเติม..."
          rows={2}
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Summary + Order */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">รวม ({items.length} รายการ)</span>
          <span className="text-lg font-bold text-primary">฿{total.toLocaleString("th-TH")}</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "กำลังส่งคำสั่งซื้อ…" : "ยืนยันสั่งซื้อ"}
        </button>
      </div>
    </div>
  );
}
