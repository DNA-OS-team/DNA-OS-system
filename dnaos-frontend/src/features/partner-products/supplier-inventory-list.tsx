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
            : "Unable to load supplier inventory"
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
          : "Unable to update supplier inventory"
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
          Supplier inventory
        </h1>
        <p className="text-sm text-muted-foreground">
          Update approved supplier stock. Every stock change creates a movement.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Inventory action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Inventory filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search supplier or product"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(checked) => setLowStockOnly(checked === true)}
            />
            Low stock only
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Low threshold</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && inventories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No supplier inventory found.
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
                          <Badge variant="outline">Low stock</Badge>
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
                        placeholder="Adjustment note"
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
                        {savingId === inventory.supplierProductId ? "Saving" : "Save"}
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
