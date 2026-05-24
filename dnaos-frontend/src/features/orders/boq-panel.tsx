"use client";

import { ClipboardList, Plus, RefreshCw } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createOrderBoq, getOrderBoqs } from "./boq-api";
import type { Boq, BoqItem } from "./types";

type BoqPanelProps = {
  orderId: string;
};

export function BoqPanel({ orderId }: BoqPanelProps) {
  const [boqs, setBoqs] = useState<Boq[]>([]);
  const [selectedBoq, setSelectedBoq] = useState<Boq | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOrderBoqs(orderId)
      .then((result) => {
        if (isMounted) {
          setBoqs(result.boqs);
          if (result.boqs.length > 0) {
            setSelectedBoq(result.boqs[0]);
          }
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดข้อมูล BOQ ไม่สำเร็จ"
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

  async function handleCreateBoq() {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createOrderBoq(orderId);
      setBoqs((prev) => [result.boq, ...prev]);
      setSelectedBoq(result.boq);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "สร้าง BOQ ไม่สำเร็จ"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>BOQ (ใบปริมาณงานและราคา)</CardTitle>
          <CardDescription>
            สร้างจากผลคำนวณราคาล่าสุด แสดงต้นทุน ราคาขาย และ VAT 7%
          </CardDescription>
        </div>
        <Button onClick={handleCreateBoq} disabled={isCreating}>
          {isCreating ? <RefreshCw className="animate-spin" /> : <Plus />}
          สร้าง BOQ ใหม่
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
          <p className="text-sm text-muted-foreground">กำลังโหลด BOQ...</p>
        ) : null}

        {!isLoading && boqs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <ClipboardList className="size-8 opacity-40" />
            <p className="text-sm">
              ยังไม่มี BOQ กดปุ่มสร้าง BOQ ใหม่ (ต้องคำนวณราคาก่อน)
            </p>
          </div>
        ) : null}

        {boqs.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {boqs.map((boq) => (
              <button
                key={boq.id}
                type="button"
                onClick={() => setSelectedBoq(boq)}
                className="text-sm underline-offset-2 hover:underline"
              >
                <Badge
                  variant={selectedBoq?.id === boq.id ? "default" : "outline"}
                >
                  {boq.boqNo}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}

        {selectedBoq ? <BoqDetail boq={selectedBoq} /> : null}
      </CardContent>
    </Card>
  );
}

function BoqDetail({ boq }: { boq: Boq }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{boq.boqNo}</span>
        <BoqStatusBadge status={boq.status} />
        <span>สร้างเมื่อ {formatDateTime(boq.createdAt)}</span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รายการสินค้า</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
              <TableHead className="text-right">ราคาขาย/หน่วย</TableHead>
              <TableHead className="text-right">ราคาขายรวม</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boq.items.map((item) => (
              <BoqItemRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator />

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ยอดก่อน VAT</span>
          <span className="font-mono">{formatCurrency(boq.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            VAT {formatPercent(boq.vatRate)}
          </span>
          <span className="font-mono">{formatCurrency(boq.vatAmount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>ยอดรวมทั้งสิ้น</span>
          <span className="font-mono text-base">{formatCurrency(boq.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function BoqItemRow({ item }: { item: BoqItem }) {
  const productName = [
    item.productVariant?.product?.name,
    item.productVariant?.name,
  ]
    .filter(Boolean)
    .join(" / ");

  const marginPercent = Number(item.marginPercent);

  return (
    <TableRow>
      <TableCell className="min-w-48">
        <div className="font-medium">{productName || item.productVariantId}</div>
        {item.description ? (
          <div className="text-xs text-muted-foreground">{item.description}</div>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        {formatNumber(item.quantity)} {item.unit}
      </TableCell>
      <TableCell className="text-right">{formatCurrency(item.supplierUnitCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.sellUnitPrice)}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.sellTotalPrice)}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={
            marginPercent < 10 ? "text-destructive" : "text-muted-foreground"
          }
        >
          {formatNumber(marginPercent)}%
        </span>
      </TableCell>
    </TableRow>
  );
}

function BoqStatusBadge({ status }: { status: Boq["status"] }) {
  const labels: Record<Boq["status"], string> = {
    DRAFT: "ร่าง",
    FINALIZED: "ยืนยันแล้ว",
    CANCELLED: "ยกเลิก",
  };
  const variants: Record<Boq["status"], "secondary" | "default" | "destructive"> = {
    DRAFT: "secondary",
    FINALIZED: "default",
    CANCELLED: "destructive",
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

function formatPercent(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
