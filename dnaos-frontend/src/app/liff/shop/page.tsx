"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { useLiff } from "@/hooks/use-liff";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string;
  pricePerTon: number | null;
  pricePerCubic: number | null;
  variants: { variantId: string; variantName: string; unit: string; price: number }[];
};

function fmtPrice(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function LiffShopPage() {
  const liff = useLiff();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (liff.status !== "ready") return;
    apiFetch<{ products: Product[] }>("/customer/products")
      .then((r) => setProducts(r.products))
      .finally(() => setLoading(false));
  }, [liff.status]);

  if (liff.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบ LINE...</p>
        </div>
      </div>
    );
  }

  if (liff.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-destructive">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-muted-foreground mt-1">{liff.message}</p>
        </div>
      </div>
    );
  }

  const filtered = q
    ? products.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase())
      )
    : products;

  const categories = [...new Set(filtered.map((p) => p.category))];

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        {liff.pictureUrl && (
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full border">
            <Image src={liff.pictureUrl} alt={liff.displayName} fill className="object-cover" />
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">สวัสดี, {liff.displayName}</p>
          <h1 className="text-base font-bold leading-tight">เลือกสินค้า</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
          <Package className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ไม่พบสินค้า</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</p>
              <div className="grid grid-cols-2 gap-3">
                {filtered.filter((p) => p.category === cat).map((p) => (
                  <Link key={p.id} href={`/liff/shop/${p.id}`} className="block">
                    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm active:scale-[0.98] transition-transform">
                      <div className="relative aspect-[4/3] bg-muted">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="size-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                        {p.pricePerTon && (
                          <p className="mt-1 text-xs font-bold text-primary">฿{fmtPrice(p.pricePerTon)}/ตัน</p>
                        )}
                        {p.pricePerCubic && (
                          <p className="mt-0.5 text-xs text-muted-foreground">฿{fmtPrice(p.pricePerCubic)}/คิว</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
