"use client";

import { Boxes, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listSupplierInventory,
  updateSupplierInventory,
} from "./partner-product-api";
import type { SupplierInventory } from "./types";

type InventoryDraft = {
  stockQty: string;
  lowStockThreshold: string;
  note: string;
};

export function SupplierInventoryList() {
  const [inventories, setInventories] = useState<SupplierInventory[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InventoryDraft>>({});
  const [query, setQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      loadInventory(isMounted);
    }, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [lowStockOnly, query]);

  async function loadInventory(isMounted = true) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listSupplierInventory({ q: query, lowStockOnly });

      if (isMounted) {
        setInventories(result.inventories);
        setDrafts(
          Object.fromEntries(
            result.inventories.map((inventory) => [
              inventory.supplierProductId,
              {
                stockQty: String(inventory.stockQty),
                lowStockThreshold: String(inventory.lowStockThreshold),
                note: "",
              },
            ])
          )
        );
      }
    } catch (requestError) {
      if (isMounted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "ไม่สามารถโหลดคลังสินค้าได้"
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  async function saveInventory(inventory: SupplierInventory) {
    const draft = drafts[inventory.supplierProductId];

    if (!draft) {
      return;
    }

    setSavingId(inventory.supplierProductId);
    setError(null);

    try {
      await updateSupplierInventory(inventory.supplierProductId, draft);
      await loadInventory();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ไม่สามารถอัปเดตคลังสินค้าได้"
      );
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(
    supplierProductId: string,
    field: keyof InventoryDraft,
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [supplierProductId]: {
        stockQty: current[supplierProductId]?.stockQty ?? "0",
        lowStockThreshold: current[supplierProductId]?.lowStockThreshold ?? "0",
        note: current[supplierProductId]?.note ?? "",
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          คลังสินค้าซัพพลายเออร์
        </h1>
        <p className="text-sm text-muted-foreground">
          อัปเดตสต็อกซัพพลายเออร์ที่อนุมัติแล้ว ทุกการเปลี่ยนแปลงสต็อกจะบันทึกเป็น movement
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการคลังสินค้าไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองคลังสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาซัพพลายเออร์หรือสินค้า"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(checked) => setLowStockOnly(checked === true)}
            />
            สต็อกต่ำเท่านั้น
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ทะเบียนสต็อก</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>ซัพพลายเออร์</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>สต็อก</TableHead>
                <TableHead>เกณฑ์ต่ำ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    กำลังโหลดคลังสินค้า...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && inventories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    ไม่พบคลังสินค้า
                  </TableCell>
                </TableRow>
              ) : null}
              {inventories.map((inventory) => {
                const supplierProduct = inventory.supplierProduct;
                const productName = supplierProduct?.productVariant?.product?.name ?? "-";
                const variantName = supplierProduct?.productVariant?.name ?? "-";
                const supplierName = supplierProduct?.supplierCompany?.name ?? "-";
                const draft = drafts[inventory.supplierProductId];
                const isLowStock =
                  Number(inventory.availableQty) <= Number(inventory.lowStockThreshold);

                return (
                  <TableRow key={inventory.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Boxes className="size-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {variantName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{supplierName}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          {formatNumber(inventory.availableQty)} {inventory.unit}
                        </div>
                        {isLowStock ? (
                          <Badge variant="outline">สต็อกต่ำ</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        value={draft?.stockQty ?? ""}
                        onChange={(event) =>
                          updateDraft(
                            inventory.supplierProductId,
                            "stockQty",
                            event.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        value={draft?.lowStockThreshold ?? ""}
                        onChange={(event) =>
                          updateDraft(
                            inventory.supplierProductId,
                            "lowStockThreshold",
                            event.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft?.note ?? ""}
                        placeholder="หมายเหตุการปรับสต็อก"
                        onChange={(event) =>
                          updateDraft(
                            inventory.supplierProductId,
                            "note",
                            event.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        type="button"
                        disabled={savingId === inventory.supplierProductId}
                        onClick={() => saveInventory(inventory)}
                      >
                        <Save />
                        {savingId === inventory.supplierProductId ? "กำลังบันทึก" : "บันทึก"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
}
