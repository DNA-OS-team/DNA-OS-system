"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, Package } from "lucide-react";
import {
  listCustomerProducts,
  createOrderRequest,
  type CustomerProduct,
  type ProductVariantOption,
} from "./customer-order-api";
import { useCustomerAuth } from "./use-customer-auth";

function fmtPrice(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type SuccessState = { reqNo: string };

export function CustomerOrderForm() {
  const auth = useCustomerAuth("/customer/order/new");
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    listCustomerProducts()
      .then((r) => {
        setProducts(r.products);
        if (productId) {
          setSelectedProductId(productId);
          const prod = r.products.find((p) => p.id === productId);
          if (prod?.variants[0]) setSelectedVariantId(prod.variants[0].variantId);
        }
      })
      .finally(() => setLoading(false));
  }, [auth.status, productId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const selectedVariant: ProductVariantOption | null =
    selectedProduct?.variants.find((v) => v.variantId === selectedVariantId) ?? null;

  function handleProductChange(id: string) {
    setSelectedProductId(id);
    setSelectedVariantId("");
    const prod = products.find((p) => p.id === id);
    if (prod?.variants[0]) setSelectedVariantId(prod.variants[0].variantId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariantId || !quantity || !deliveryAddress) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createOrderRequest({
        items: [{ productVariantId: selectedVariantId, quantity: Number(quantity), unit: selectedVariant?.unit ?? "" }],
        deliveryAddress,
        requestedDeliveryAt: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        note: note || null,
      });
      setSuccess({ reqNo: result.reqNo });
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-bold">ส่งคำขอสั่งซื้อแล้ว!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            หมายเลขคำขอ: <span className="font-mono font-semibold text-foreground">{success.reqNo}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันรายละเอียด</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/customer/orders")}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            ดูคำสั่งซื้อ
          </button>
          <button
            onClick={() => { setSuccess(null); setQuantity(""); setDeliveryAddress(""); setNote(""); setDeliveryDate(""); }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            สั่งซื้อเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="rounded-lg p-1.5 hover:bg-muted transition">
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">สั่งซื้อสินค้า</h1>
          <p className="text-xs text-muted-foreground">กรอกรายละเอียดเพื่อส่งคำขอ</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">สินค้า</label>
            <div className="relative">
              <Package className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Variant + unit */}
          {selectedProduct && selectedProduct.variants.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ประเภท / หน่วย</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.variantId} value={v.variantId}>
                    {v.variantName} — ฿{fmtPrice(v.price)} / {v.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              จำนวน{selectedVariant ? ` (${selectedVariant.unit})` : ""}
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="เช่น 10"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Delivery address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ที่อยู่จัดส่ง</label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              rows={2}
              placeholder="ระบุที่อยู่หรือชื่อโครงการ"
              className="w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Delivery date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">วันที่ต้องการรับสินค้า <span className="text-muted-foreground font-normal">(ถ้ามี)</span></label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">หมายเหตุ <span className="text-muted-foreground font-normal">(ถ้ามี)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="รายละเอียดเพิ่มเติม"
              className="w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedVariantId || !quantity || !deliveryAddress}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {submitting ? "กำลังส่ง..." : "ส่งคำขอสั่งซื้อ"}
          </button>
        </form>
      )}
    </div>
  );
}
