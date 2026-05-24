"use client";

import { FilePlus2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createOrderSupplierPurchaseOrders,
  getOrderSupplierPurchaseOrders,
} from "./purchase-order-api";
import type {
  SupplierPoStatus,
  SupplierPurchaseOrder,
  SupplierPurchaseOrderItem,
} from "./types";

type PurchaseOrderPanelProps = {
  orderId: string;
};

export function PurchaseOrderPanel({ orderId }: PurchaseOrderPanelProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<SupplierPurchaseOrder[]>([]);
  const [selectedPo, setSelectedPo] = useState<SupplierPurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOrderSupplierPurchaseOrders(orderId)
      .then((result) => {
        if (isMounted) {
          setPurchaseOrders(result.supplierPurchaseOrders);
          setSelectedPo(result.supplierPurchaseOrders[0] ?? null);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดข้อมูล Supplier PO ไม่สำเร็จ"
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  async function handleCreatePOs() {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createOrderSupplierPurchaseOrders(orderId);
      setPurchaseOrders(result.supplierPurchaseOrders);
      setSelectedPo(result.supplierPurchaseOrders[0] ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "สร้าง Supplier PO ไม่สำเร็จ"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Supplier PO</CardTitle>
          <CardDescription>
            สร้างใบสั่งซื้อแยกตาม supplier จากราคาต้นทุนที่เลือกไว้ใน pricing
          </CardDescription>
        </div>
        <Button onClick={handleCreatePOs} disabled={isCreating || purchaseOrders.length > 0}>
          {isCreating ? <RefreshCw className="animate-spin" /> : <FilePlus2 />}
          สร้าง Supplier PO
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>พบปัญหา</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด Supplier PO...</p>
        ) : null}

        {!isLoading && purchaseOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มี Supplier PO ต้องปรับ order เป็น CONFIRMED และมี QT ก่อนสร้าง PO
          </p>
        ) : null}

        {purchaseOrders.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {purchaseOrders.map((po) => (
              <Button
                key={po.id}
                variant={selectedPo?.id === po.id ? "secondary" : "outline"}
                onClick={() => setSelectedPo(po)}
              >
                {po.poNo}
              </Button>
            ))}
          </div>
        ) : null}

        {selectedPo ? <PurchaseOrderDetail purchaseOrder={selectedPo} /> : null}
      </CardContent>
    </Card>
  );
}

function PurchaseOrderDetail({
  purchaseOrder,
}: {
  purchaseOrder: SupplierPurchaseOrder;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <PurchaseOrderMetric label="Supplier" value={purchaseOrder.supplierCompany?.name ?? "-"} />
        <PurchaseOrderMetric label="มูลค่าก่อน VAT" value={formatCurrency(purchaseOrder.subtotal)} />
        <PurchaseOrderMetric label="VAT" value={formatCurrency(purchaseOrder.vatAmount)} />
        <PurchaseOrderMetric label="ยอดรวม" value={formatCurrency(purchaseOrder.totalAmount)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <SupplierPoStatusBadge status={purchaseOrder.status} />
        <span>สร้างเมื่อ {formatDateTime(purchaseOrder.createdAt)}</span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
              <TableHead className="text-right">รวมต้นทุน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrder.items.map((item) => (
              <PurchaseOrderItemRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PurchaseOrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function PurchaseOrderItemRow({ item }: { item: SupplierPurchaseOrderItem }) {
  const productName = [
    item.productVariant?.product?.name,
    item.productVariant?.name
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <TableRow>
      <TableCell className="min-w-56">
        <div className="font-medium">{productName || item.productVariantId}</div>
        {item.description ? (
          <div className="text-xs text-muted-foreground">{item.description}</div>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        {formatNumber(item.quantity)} {item.unit}
      </TableCell>
      <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
    </TableRow>
  );
}

function SupplierPoStatusBadge({ status }: { status: SupplierPoStatus }) {
  const labels: Record<SupplierPoStatus, string> = {
    DRAFT: "ร่าง",
    SENT: "ส่งแล้ว",
    ACKNOWLEDGED: "รับทราบ",
    CONFIRMED: "ยืนยันแล้ว",
    PARTIALLY_FULFILLED: "ส่งบางส่วน",
    FULFILLED: "ส่งครบแล้ว",
    BILLED: "วางบิลแล้ว",
    PAID: "ชำระแล้ว",
    CANCELLED: "ยกเลิก",
    REJECTED: "ปฏิเสธ",
  };
  const variant: Record<SupplierPoStatus, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "secondary",
    SENT: "outline",
    ACKNOWLEDGED: "outline",
    CONFIRMED: "default",
    PARTIALLY_FULFILLED: "outline",
    FULFILLED: "default",
    BILLED: "outline",
    PAID: "default",
    CANCELLED: "destructive",
    REJECTED: "destructive",
  };

  return <Badge variant={variant[status]}>{labels[status]}</Badge>;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatNumber(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
