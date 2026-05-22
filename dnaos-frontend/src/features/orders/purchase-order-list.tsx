"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSupplierPurchaseOrders } from "./purchase-order-api";
import type { SupplierPoStatus, SupplierPurchaseOrder } from "./types";

const statuses: Array<"all" | SupplierPoStatus> = [
  "all",
  "DRAFT",
  "SENT",
  "ACKNOWLEDGED",
  "CONFIRMED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "BILLED",
  "PAID",
  "CANCELLED",
  "REJECTED",
];

export function PurchaseOrderList() {
  const [purchaseOrders, setPurchaseOrders] = useState<SupplierPurchaseOrder[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | SupplierPoStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      listSupplierPurchaseOrders({ q, status })
        .then((result) => {
          setPurchaseOrders(result.supplierPurchaseOrders);
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดรายการ Supplier PO ไม่สำเร็จ"
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [q, status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Supplier PO</h1>
        <p className="text-sm text-muted-foreground">
          ตรวจสอบใบสั่งซื้อที่แยกตาม supplier จาก order ที่ยืนยันแล้ว
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>พบปัญหา</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>รายการ Supplier PO</CardTitle>
          <CardDescription>ค้นหาจากเลข PO, supplier หรือเลข order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="ค้นหา Supplier PO"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as "all" | SupplierPoStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption === "all" ? "ทุกสถานะ" : statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">กำลังโหลด Supplier PO...</p>
          ) : null}

          {!isLoading && purchaseOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มี Supplier PO</p>
          ) : null}

          {purchaseOrders.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลข PO</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono">{po.poNo}</TableCell>
                      <TableCell>{po.supplierCompany?.name ?? "-"}</TableCell>
                      <TableCell className="font-mono">
                        {po.customerOrder?.orderNo ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{po.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(po.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(value));
}
