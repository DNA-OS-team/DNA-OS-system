"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useSupplierAuth } from "./use-supplier-auth";
import { getSupplierPO, confirmSupplierPO, rejectSupplierPO, PO_STATUS_LABEL, type SupplierPO, type PoStatus } from "./supplier-api";
import { Button } from "@/components/ui/button";

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}
function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

export function SupplierPODetail({ poId }: { poId: string }) {
  const auth = useSupplierAuth(`/supplier/orders/${poId}`);
  const [po, setPo] = useState<SupplierPO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let mounted = true;
    getSupplierPO(poId)
      .then((r) => { if (mounted) setPo(r.supplierPurchaseOrder); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [auth.status, poId]);

  async function handleConfirm() {
    if (!po) return;
    setActing(true);
    try {
      const r = await confirmSupplierPO(po.id);
      setPo((r as { supplierPurchaseOrder: SupplierPO }).supplierPurchaseOrder);
    } catch { setError("ยืนยันไม่สำเร็จ"); }
    finally { setActing(false); }
  }

  async function handleReject() {
    if (!po) return;
    setActing(true);
    try {
      const r = await rejectSupplierPO(po.id);
      setPo((r as { supplierPurchaseOrder: SupplierPO }).supplierPurchaseOrder);
    } catch { setError("ปฏิเสธไม่สำเร็จ"); }
    finally { setActing(false); }
  }

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>;
  }
  if (isLoading) return (
    <div className="space-y-4 pt-2">
      <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
      <div className="h-48 rounded-2xl bg-muted animate-pulse" />
    </div>
  );
  if (error || !po) return (
    <div className="pt-2 space-y-4">
      <Link href="/supplier/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> กลับ
      </Link>
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">{error ?? "ไม่พบใบสั่งซื้อ"}</p>
      </div>
    </div>
  );

  const canAct = po.status === "ACKNOWLEDGED" || po.status === "DRAFT";

  return (
    <div className="space-y-4 pt-2">
      <Link href="/supplier/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> ใบสั่งซื้อทั้งหมด
      </Link>

      <div className="rounded-2xl border bg-card px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">ใบสั่งซื้อ</p>
            <p className="font-bold text-lg">{po.customerOrder?.orderNo ?? po.id.slice(0, 8)}</p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
            {PO_STATUS_LABEL[po.status as PoStatus] ?? po.status}
          </span>
        </div>

        <div className="divide-y text-sm">
          {po.customerOrder?.customerCompany && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">ลูกค้า</span>
              <span className="font-medium">{po.customerOrder.customerCompany.name}</span>
            </div>
          )}
          {po.customerOrder?.project && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">โปรเจกต์</span>
              <span className="font-medium text-right">{po.customerOrder.project.title}</span>
            </div>
          )}
          {po.customerOrder?.customerSite && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" /><span>หน้างาน</span>
              </div>
              <span className="font-medium">{po.customerOrder.customerSite.siteName}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">วันที่สร้าง</span>
            <span>{fmtDate(po.createdAt)}</span>
          </div>
        </div>
      </div>

      {po.items && po.items.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">รายการสินค้า ({po.items.length})</span>
          </div>
          <div className="divide-y">
            {po.items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productVariant?.product?.name ?? item.description ?? "-"}
                    </p>
                    {item.productVariant?.name && (
                      <p className="text-xs text-muted-foreground">{item.productVariant.name}</p>
                    )}
                  </div>
                  <div className="text-sm text-right shrink-0 tabular-nums">
                    <p>{Number(item.quantity).toLocaleString("th-TH")} {item.unit}</p>
                    <p className="text-xs text-muted-foreground">฿{fmtMoney(item.totalCost)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t bg-muted/30 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ยอดรวม</span>
              <span>฿{fmtMoney(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT 7%</span>
              <span>฿{fmtMoney(po.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>รวมทั้งสิ้น</span>
              <span>฿{fmtMoney(po.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {canAct && (
        <div className="space-y-2">
          <Button className="w-full" onClick={handleConfirm} disabled={acting}>
            {acting ? "กำลังดำเนินการ..." : "ยืนยันรับใบสั่งซื้อ"}
          </Button>
          <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleReject} disabled={acting}>
            ปฏิเสธ
          </Button>
        </div>
      )}
    </div>
  );
}
