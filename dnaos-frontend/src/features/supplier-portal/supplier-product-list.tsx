"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Package, Plus } from "lucide-react";
import { listSupplierProducts, type SupplierOwnProduct } from "./supplier-api";
import { useSupplierAuth } from "./use-supplier-auth";
import { AddSupplierProductDialog } from "./add-supplier-product-dialog";

function fmtPrice(n: string | number) {
  return Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function ProductCard({ p }: { p: SupplierOwnProduct }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {p.productVariant.product.imageUrl ? (
          <Image src={p.productVariant.product.imageUrl} alt={p.productVariant.product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-10 text-muted-foreground/30" />
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.isAvailable ? "bg-green-500/90 text-white" : "bg-gray-400/80 text-white"}`}>
          {p.isAvailable ? "พร้อมขาย" : "ปิดขาย"}
        </span>
      </div>

      <div className="space-y-1.5 p-3">
        <p className="text-[10px] text-muted-foreground">{p.productVariant.product.category}</p>
        <p className="font-semibold leading-tight">{p.productVariant.product.name}</p>
        <p className="text-xs text-muted-foreground">{p.productVariant.name} · {p.productVariant.unit}</p>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ราคา</span>
            <span className="text-sm font-bold text-primary">฿{fmtPrice(p.price)} / {p.productVariant.unit}</span>
          </div>
          {p.stockQty !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">คงเหลือ</span>
              <span className="text-xs font-medium">{fmtPrice(p.stockQty)} {p.productVariant.unit}</span>
            </div>
          )}
          {p.sku && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">SKU</span>
              <span className="font-mono text-xs">{p.sku}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SupplierProductList() {
  const auth = useSupplierAuth("/supplier/products");
  const [products, setProducts] = useState<SupplierOwnProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    listSupplierProducts()
      .then((r) => setProducts(r.products))
      .finally(() => setLoading(false));
  }, [auth.status]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">สินค้าของฉัน</h1>
          <p className="text-xs text-muted-foreground">สินค้าที่คุณเพิ่มในระบบ DNA OS</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="size-3.5" />
          เพิ่มรายการสินค้า
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <Package className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในระบบ</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" />
            เพิ่มรายการสินค้า
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {showAdd && (
        <AddSupplierProductDialog
          onClose={() => setShowAdd(false)}
          onCreated={(product) => {
            setProducts((prev) => [product, ...prev]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
