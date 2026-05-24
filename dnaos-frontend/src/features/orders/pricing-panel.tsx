"use client";

import { AlertTriangle, Calculator, RefreshCw } from "lucide-react";
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
import { getOrderPricing, runOrderPricing } from "./pricing-api";
import type { PricingSnapshot, PricingSnapshotItem } from "./types";

type PricingPanelProps = {
  orderId: string;
};

export function PricingPanel({ orderId }: PricingPanelProps) {
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOrderPricing(orderId)
      .then((result) => {
        if (isMounted) {
          setPricingSnapshot(result.pricingSnapshot);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดข้อมูลราคาไม่สำเร็จ"
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

  async function handleRunPricing() {
    setIsRunning(true);
    setError(null);

    try {
      const result = await runOrderPricing(orderId);
      setPricingSnapshot(result.pricingSnapshot);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "คำนวณราคาไม่สำเร็จ"
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>คำนวณราคา</CardTitle>
          <CardDescription>
            เลือก supplier ที่ต้นทุนต่ำสุดและมี stock เพียงพอจากรายการสินค้าใน order
          </CardDescription>
        </div>
        <Button onClick={handleRunPricing} disabled={isRunning}>
          {isRunning ? <RefreshCw className="animate-spin" /> : <Calculator />}
          {pricingSnapshot ? "คำนวณใหม่" : "คำนวณราคา"}
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
          <p className="text-sm text-muted-foreground">กำลังโหลดผลคำนวณ...</p>
        ) : null}

        {!isLoading && !pricingSnapshot ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีผลคำนวณราคา กดปุ่มคำนวณราคาเพื่อสร้าง snapshot แรก
          </p>
        ) : null}

        {pricingSnapshot ? (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <PricingMetric label="ต้นทุนรวม" value={formatCurrency(pricingSnapshot.totalSupplierCost)} />
              <PricingMetric label="ราคาขายรวม" value={formatCurrency(pricingSnapshot.totalSellPrice)} />
              <PricingMetric label="Margin" value={formatCurrency(pricingSnapshot.totalMargin)} />
              <PricingMetric label="Margin %" value={`${formatNumber(pricingSnapshot.marginPercent)}%`} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={pricingSnapshot.status === "CALCULATED" ? "secondary" : "destructive"}>
                {pricingSnapshot.status === "CALCULATED" ? "คำนวณแล้ว" : "ต้องตรวจสอบ"}
              </Badge>
              <span>สร้างเมื่อ {formatDateTime(pricingSnapshot.createdAt)}</span>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
                    <TableHead className="text-right">ราคาขาย/หน่วย</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingSnapshot.items.map((item) => (
                    <PricingItemRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PricingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function PricingItemRow({ item }: { item: PricingSnapshotItem }) {
  const productName = [
    item.productVariant?.product?.name,
    item.productVariant?.name
  ]
    .filter(Boolean)
    .join(" / ");
  const supplierName =
    item.supplierCompany?.name ?? item.supplierProduct?.supplierCompany?.name ?? "-";

  return (
    <TableRow>
      <TableCell className="min-w-48">
        <div className="font-medium">{productName || item.productVariantId}</div>
        {item.supplierProduct?.sku ? (
          <div className="text-xs text-muted-foreground">SKU: {item.supplierProduct.sku}</div>
        ) : null}
      </TableCell>
      <TableCell>{supplierName}</TableCell>
      <TableCell className="text-right">
        {formatNumber(item.quantity)} {item.unit}
      </TableCell>
      <TableCell className="text-right">{formatCurrency(item.supplierUnitCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.sellUnitPrice)}</TableCell>
      <TableCell className="text-right">
        {formatCurrency(item.marginAmount)}
        <div className="text-xs text-muted-foreground">
          {formatNumber(item.marginPercent)}%
        </div>
      </TableCell>
      <TableCell className="min-w-44">
        {item.warning ? (
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span className="text-sm">{item.warning}</span>
          </div>
        ) : (
          <Badge variant="secondary">พร้อมเสนอราคา</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2
  }).format(Number(value));
}

function formatNumber(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
