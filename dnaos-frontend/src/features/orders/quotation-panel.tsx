"use client";

import { AlertTriangle, FileCheck, Plus, RefreshCw } from "lucide-react";
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
import { createOrderQuotation, getOrderQuotations } from "./quotation-api";
import type { Quotation, QuotationItem } from "./types";

type QuotationPanelProps = {
  orderId: string;
};

export function QuotationPanel({ orderId }: QuotationPanelProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQt, setSelectedQt] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOrderQuotations(orderId)
      .then((result) => {
        if (isMounted) {
          setQuotations(result.quotations);
          if (result.quotations.length > 0) {
            setSelectedQt(result.quotations[0]);
          }
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดข้อมูล QT ไม่สำเร็จ"
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

  async function handleCreateQuotation() {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createOrderQuotation(orderId);
      setQuotations((prev) => [result.quotation, ...prev]);
      setSelectedQt(result.quotation);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "สร้าง QT ไม่สำเร็จ"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>ใบเสนอราคา (QT)</CardTitle>
          <CardDescription>
            สร้างจาก BOQ ล่าสุด แสดงราคาขายและ VAT 7% (ไม่เปิดเผยต้นทุน)
          </CardDescription>
        </div>
        <Button onClick={handleCreateQuotation} disabled={isCreating}>
          {isCreating ? <RefreshCw className="animate-spin" /> : <Plus />}
          สร้าง QT ใหม่
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
          <p className="text-sm text-muted-foreground">กำลังโหลด QT...</p>
        ) : null}

        {!isLoading && quotations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <FileCheck className="size-8 opacity-40" />
            <p className="text-sm">
              ยังไม่มี QT กดปุ่มสร้าง QT ใหม่ (ต้องมี BOQ ก่อน)
            </p>
          </div>
        ) : null}

        {quotations.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {quotations.map((qt) => (
              <button
                key={qt.id}
                type="button"
                onClick={() => setSelectedQt(qt)}
                className="text-sm underline-offset-2 hover:underline"
              >
                <Badge
                  variant={selectedQt?.id === qt.id ? "default" : "outline"}
                >
                  {qt.quotationNo}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}

        {selectedQt ? <QuotationDetail qt={selectedQt} /> : null}
      </CardContent>
    </Card>
  );
}

function QuotationDetail({ qt }: { qt: Quotation }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{qt.quotationNo}</span>
        <QuotationStatusBadge status={qt.status} />
        <span>สร้างเมื่อ {formatDateTime(qt.createdAt)}</span>
      </div>

      {qt.requiresApproval ? (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>ต้องการอนุมัติก่อนส่งลูกค้า</AlertTitle>
          <AlertDescription>{qt.approvalReason}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รายการสินค้า</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead className="text-right">ราคา/หน่วย</TableHead>
              <TableHead className="text-right">ราคารวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qt.items.map((item) => (
              <QuotationItemRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator />

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ยอดก่อน VAT</span>
          <span className="font-mono">{formatCurrency(qt.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            VAT {formatPercent(qt.vatRate)}
          </span>
          <span className="font-mono">{formatCurrency(qt.vatAmount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>ยอดรวมทั้งสิ้น</span>
          <span className="font-mono text-base">{formatCurrency(qt.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function QuotationItemRow({ item }: { item: QuotationItem }) {
  const productName = [
    item.productVariant?.product?.name,
    item.productVariant?.name,
  ]
    .filter(Boolean)
    .join(" / ");

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
      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.totalPrice)}
      </TableCell>
    </TableRow>
  );
}

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const labels: Record<Quotation["status"], string> = {
    DRAFT: "ร่าง",
    PENDING_APPROVAL: "รออนุมัติ",
    APPROVED: "อนุมัติแล้ว",
    SENT: "ส่งแล้ว",
    CONFIRMED: "ลูกค้ายืนยัน",
    REJECTED: "ปฏิเสธ",
    CANCELLED: "ยกเลิก",
    EXPIRED: "หมดอายุ",
  };
  const variants: Record<
    Quotation["status"],
    "secondary" | "default" | "destructive" | "outline"
  > = {
    DRAFT: "secondary",
    PENDING_APPROVAL: "outline",
    APPROVED: "default",
    SENT: "outline",
    CONFIRMED: "default",
    REJECTED: "destructive",
    CANCELLED: "destructive",
    EXPIRED: "outline",
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
