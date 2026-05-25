"use client";

import { useEffect, useState } from "react";
import { Package, Loader2, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

type InventoryItem = {
  id: string;
  productName: string;
  variantName: string;
  unit: string;
  category: string;
  stockQty: number | null;
  availableQty: number | null;
  reservedQty: number | null;
  lowStockThreshold: number | null;
  isAvailable: boolean;
};

export default function SupplierInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<{ products: InventoryItem[] }>("/liff/supplier/inventory")
      .then((r) => setItems(r.products))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: InventoryItem) {
    setEditing(item.id);
    setInputVal(String(item.stockQty ?? 0));
    setError(null);
    setSaved(null);
  }

  async function saveStock(item: InventoryItem) {
    const qty = parseFloat(inputVal);
    if (isNaN(qty) || qty < 0) {
      setError("จำนวนไม่ถูกต้อง");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/liff/supplier/inventory/${item.id}/stock`, {
        method: "POST",
        body: JSON.stringify({ stockQty: qty }),
      });
      setSaved(item.id);
      setEditing(null);
      load();
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const isLow = (item: InventoryItem) =>
    item.stockQty !== null &&
    item.lowStockThreshold !== null &&
    item.stockQty <= item.lowStockThreshold;

  return (
    <div className="space-y-4 p-4">
      <h1 className="pt-1 text-lg font-bold">จัดการสต๊อก</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
          <Package className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในระบบ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          {items.map((item) => (
            <div key={item.id} className={`rounded-2xl border bg-card p-4 ${isLow(item) ? "border-amber-300" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.variantName} · {item.category}</p>
                  {isLow(item) && (
                    <p className="text-[10px] font-semibold text-amber-600 mt-0.5">สต๊อกใกล้หมด</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {editing === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className="w-20 rounded-lg border bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                      <button
                        onClick={() => saveStock(item)}
                        disabled={saving}
                        className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="text-right"
                    >
                      <p className={`text-base font-bold ${saved === item.id ? "text-emerald-600" : "text-primary"}`}>
                        {item.stockQty !== null ? item.stockQty.toLocaleString("th-TH") : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.unit} · แตะเพื่อแก้ไข</p>
                    </button>
                  )}
                </div>
              </div>

              {item.reservedQty !== null && item.availableQty !== null && (
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>จอง {item.reservedQty.toLocaleString("th-TH")}</span>
                  <span>พร้อมส่ง {item.availableQty.toLocaleString("th-TH")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
