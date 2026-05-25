"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/features/liff/cart-context";

type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string;
  variants: { variantId: string; variantName: string; unit: string; price: number }[];
};

export default function LiffProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { add, items, update } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  useEffect(() => {
    apiFetch<{ products: Product[] }>("/customer/products")
      .then((r) => {
        const p = r.products.find((x) => x.id === id);
        if (p) {
          setProduct(p);
          setSelectedVariantId(p.variants[0]?.variantId ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">ไม่พบสินค้า</p>
      </div>
    );
  }

  const variant = product.variants.find((v) => v.variantId === selectedVariantId);
  const cartItem = items.find((i) => i.productVariantId === selectedVariantId);

  function handleAdd() {
    if (!variant) return;
    add({
      productVariantId: variant.variantId,
      productName: product!.name,
      variantName: variant.variantName,
      unit: variant.unit,
      price: variant.price,
    });
  }

  return (
    <div className="min-h-screen">
      {/* Image */}
      <div className="relative aspect-square w-full bg-muted">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-16 text-muted-foreground/30" />
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <h1 className="text-xl font-bold">{product.name}</h1>
        </div>

        {/* Variant selector */}
        {product.variants.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">เลือกตัวเลือก</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.variantId}
                  onClick={() => setSelectedVariantId(v.variantId)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedVariantId === v.variantId
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {v.variantName}
                </button>
              ))}
            </div>
          </div>
        )}

        {variant && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{variant.variantName}</p>
                <p className="text-2xl font-bold text-primary">
                  ฿{variant.price.toLocaleString("th-TH")}
                </p>
                <p className="text-xs text-muted-foreground">ต่อ {variant.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItem ? (
                  <>
                    <button
                      onClick={() => update(selectedVariantId, cartItem.quantity - 1)}
                      className="flex size-9 items-center justify-center rounded-full border bg-background"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{cartItem.quantity}</span>
                    <button
                      onClick={() => update(selectedVariantId, cartItem.quantity + 1)}
                      className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus className="size-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    <ShoppingCart className="size-4" />
                    เพิ่มในตะกร้า
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
