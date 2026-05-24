"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  listAvailableVariants,
  createSupplierProduct,
  type AvailableVariant,
  type SupplierOwnProduct,
} from "./supplier-api";

type Props = {
  onClose: () => void;
  onCreated: (product: SupplierOwnProduct) => void;
};

export function AddSupplierProductDialog({ onClose, onCreated }: Props) {
  const [variants, setVariants] = useState<AvailableVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  const [selectedId, setSelectedId] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [minQty, setMinQty] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAvailableVariants()
      .then((r) => setVariants(r.variants))
      .catch(() => setError("โหลดรายการสินค้าไม่ได้"))
      .finally(() => setLoadingVariants(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !price) return;
    setSaving(true);
    setError(null);
    try {
      const result = await createSupplierProduct({
        productVariantId: selectedId,
        price: parseFloat(price),
        sku: sku.trim() || undefined,
        minQty: minQty ? parseFloat(minQty) : undefined,
        serviceArea: serviceArea.trim() || undefined,
        isAvailable,
      });
      onCreated(result.product);
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  const selected = variants.find((v) => v.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-background p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">เพิ่มรายการสินค้า</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">สินค้า / ตัวเลือก *</label>
            {loadingVariants ? (
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีสินค้าให้เพิ่มแล้ว</p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- เลือกสินค้า --</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product.name} — {v.name} ({v.unit})
                  </option>
                ))}
              </select>
            )}
            {selected && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                หมวด: {selected.product.category}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">ราคา (บาท / หน่วย) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="0.00"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">จำนวนขั้นต่ำ</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ไม่บังคับ"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">พื้นที่ให้บริการ</label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="เช่น กรุงเทพ, ชลบุรี"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="size-4 rounded"
            />
            <span className="text-sm">พร้อมขาย</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !selectedId || !price}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "เพิ่มสินค้า"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
