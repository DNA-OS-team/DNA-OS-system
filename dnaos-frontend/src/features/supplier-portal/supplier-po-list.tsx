"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useSupplierAuth } from "./use-supplier-auth";
import { listSupplierPOs, PO_STATUS_LABEL, type SupplierPO, type PoStatus } from "./supplier-api";

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "badge-neutral", ACKNOWLEDGED: "badge-info", CONFIRMED: "badge-success",
  PARTIALLY_FULFILLED: "badge-warning", FULFILLED: "badge-success",
  BILLED: "badge-purple", PAID: "badge-success",
  CANCELLED: "badge-danger", REJECTED: "badge-danger",
};

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function POCard({ po }: { po: SupplierPO }) {
  return (
    <Link href={`/supplier/orders/${po.id}`}
      className="group flex items-start gap-3 rounded-2xl border bg-card p-4 hover:border-primary/40 active:scale-[0.98] transition-all">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 mt-0.5">
        <Package className="size-5 text-emerald-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate">
            {po.customerOrder?.customerCompany?.name ?? "ไม่ระบุลูกค้า"}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[po.status] ?? "badge-neutral"}`}>
            {PO_STATUS_LABEL[po.status as PoStatus] ?? po.status}
          </span>
        </div>
        {po.customerOrder?.project && (
          <p className="text-xs text-muted-foreground truncate">{po.customerOrder.project.title}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fmtDate(po.createdAt)}</span>
          <span className="font-medium text-foreground">฿{fmtMoney(po.totalAmount)}</span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 mt-1 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

export function SupplierPOList() {
  const auth = useSupplierAuth("/supplier/orders");
  const [orders, setOrders] = useState<SupplierPO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    listSupplierPOs()
      .then((r) => { if (mounted) setOrders(r.supplierPurchaseOrders); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <p className="font-semibold">{auth.me.company.name}</p>
        <p className="text-xs text-muted-foreground">{auth.me.displayName}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">ยังไม่มีใบสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((po) => <POCard key={po.id} po={po} />)}
        </div>
      )}
    </div>
  );
}
