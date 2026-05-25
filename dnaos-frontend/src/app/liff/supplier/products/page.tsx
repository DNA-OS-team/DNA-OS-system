"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";
import { useLiff } from "@/hooks/use-liff";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  productName: string;
  variantName: string;
  category: string;
  unit: string;
  price: number;
  isAvailable: boolean;
};

type Submission = {
  id: string;
  productName: string;
  category: string;
  unit: string;
  price: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
};

const STATUS_CONFIG = {
  PENDING:  { label: "รอตรวจสอบ", color: "bg-amber-100 text-amber-700",  icon: Clock },
  APPROVED: { label: "อนุมัติแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  REJECTED: { label: "ไม่อนุมัติ",  color: "bg-red-100 text-red-700",     icon: XCircle },
};

function fmtPrice(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function LiffSupplierProductsPage() {
  const liff = useLiff();
  const [products, setProducts] = useState<Product[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "submitted">("active");

  useEffect(() => {
    if (liff.status !== "ready") return;
    apiFetch<{ products: Product[]; submissions: Submission[] }>("/liff/supplier/products")
      .then((r) => { setProducts(r.products); setSubmissions(r.submissions); })
      .finally(() => setLoading(false));
  }, [liff.status]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-lg font-bold">สินค้าของฉัน</h1>
        <Link
          href="/liff/supplier/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="size-3.5" />
          เพิ่มสินค้า
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1">
        {[
          { key: "active", label: `ลิสต์ขาย (${products.length})` },
          { key: "submitted", label: `ยื่นขออนุมัติ (${submissions.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "active" | "submitted")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : tab === "active" ? (
        products.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าที่ลิสต์ขาย</p>
            <Link href="/liff/supplier/products/new" className="text-xs font-semibold text-primary">
              + เพิ่มสินค้าใหม่
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border bg-card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.variantName} · {p.category}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {p.isAvailable ? "พร้อมขาย" : "ปิดรับ"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-primary">฿{fmtPrice(p.price)} / {p.unit}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        submissions.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <Clock className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">ยังไม่มีรายการที่ยื่นขออนุมัติ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              const Icon = cfg.icon;
              return (
                <div key={s.id} className="rounded-2xl border bg-card p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold truncate">{s.productName}</p>
                    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                      <Icon className="size-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.category} · ฿{fmtPrice(s.price)} / {s.unit}</p>
                  {s.adminNote && (
                    <p className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{s.adminNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
