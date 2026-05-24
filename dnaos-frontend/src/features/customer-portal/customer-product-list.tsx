"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import { listCustomerProducts, type CustomerProduct } from "./customer-order-api";
import { useCustomerAuth } from "./use-customer-auth";

function fmtPrice(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function ProductCard({ product }: { product: CustomerProduct }) {
  const cheapestVariant = product.variants.length > 0
    ? product.variants.reduce((a, b) => a.price < b.price ? a : b)
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-12 text-muted-foreground/30" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 p-3">
        <p className="font-semibold leading-tight text-foreground">{product.name}</p>

        <div className="space-y-1">
          {product.pricePerTon !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ต่อตัน</span>
              <span className="text-sm font-bold text-primary">฿{fmtPrice(product.pricePerTon)}</span>
            </div>
          )}
          {product.pricePerCubic !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ต่อคิว</span>
              <span className="text-sm font-bold text-primary">฿{fmtPrice(product.pricePerCubic)}</span>
            </div>
          )}
          {product.pricePerTon === null && product.pricePerCubic === null && cheapestVariant && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ราคา / {cheapestVariant.unit}</span>
              <span className="text-sm font-bold text-primary">฿{fmtPrice(cheapestVariant.price)}</span>
            </div>
          )}
        </div>

        <Link
          href={`/customer/order/new?productId=${product.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <ShoppingCart className="size-3.5" />
          สั่งซื้อ
        </Link>
      </div>
    </div>
  );
}

export function CustomerProductList() {
  const auth = useCustomerAuth("/customer/products");
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    listCustomerProducts()
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
      <div>
        <h1 className="text-lg font-bold">สินค้าทั้งหมด</h1>
        <p className="text-xs text-muted-foreground">เลือกสินค้าที่ต้องการสั่งซื้อ</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
          <Package className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
