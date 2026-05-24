"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { listAdminSuppliers, type AdminSupplier } from "./partner-product-api";
import { SupplierDialog, CreateSupplierDialog } from "./supplier-dialog";

export function PartnerProductList() {
  const [supplierList, setSupplierList] = useState<AdminSupplier[]>([]);
  const [selected, setSelected] = useState<AdminSupplier | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    listAdminSuppliers()
      .then((result) => {
        if (isMounted) setSupplierList(result.suppliers);
      })
      .catch((err: unknown) => {
        if (isMounted)
          setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return supplierList;
    const q = query.toLowerCase();
    return supplierList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.lineDisplayName?.toLowerCase().includes(q) ?? false) ||
        (s.contactName?.toLowerCase().includes(q) ?? false) ||
        (s.taxId?.toLowerCase().includes(q) ?? false)
    );
  }, [supplierList, query]);

  function handleUpdated(updated: AdminSupplier) {
    setSupplierList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  }

  function handleDeleted(id: string) {
    setSupplierList((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
  }

  function handleCreated(supplier: AdminSupplier) {
    setSupplierList((prev) => [supplier, ...prev]);
  }

  return (
    <div className="space-y-4">
      <SupplierDialog
        supplier={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
      <CreateSupplierDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">ซัพพลายเออร์</h1>
          <p className="text-sm text-muted-foreground">รายชื่อและข้อมูลซัพพลายเออร์ทั้งหมดในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className={buttonVariants({ variant: "outline" })} href="/admin/supplier-inventory">
            คลังสินค้า
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            เพิ่มซัพพลายเออร์
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>รายชื่อซัพพลายเออร์</CardTitle>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาชื่อ, LINE, ผู้ติดต่อ, เลขภาษี"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ซัพพลายเออร์</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>เบอร์โทร / อีเมล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>LINE</TableHead>
                <TableHead className="text-right">สินค้า</TableHead>
                <TableHead className="text-right">Submission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    ไม่พบซัพพลายเออร์
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(supplier)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {supplier.linePictureUrl ? (
                          <Image
                            src={supplier.linePictureUrl}
                            alt={supplier.lineDisplayName ?? supplier.name}
                            width={32}
                            height={32}
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {supplier.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.lineDisplayName ? (
                            <div className="text-xs text-muted-foreground">
                              {supplier.lineDisplayName}
                            </div>
                          ) : null}
                          {supplier.taxId ? (
                            <div className="text-xs text-muted-foreground">
                              เลขภาษี {supplier.taxId}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.contactName ?? "-"}</div>
                      {supplier.contactPhone ? (
                        <div className="text-xs text-muted-foreground">{supplier.contactPhone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div>{supplier.phone ?? "-"}</div>
                      {supplier.email ? (
                        <div className="text-xs text-muted-foreground">{supplier.email}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.status === "ACTIVE" ? "default" : "secondary"}>
                        {supplier.status === "ACTIVE"
                          ? "ใช้งาน"
                          : supplier.status === "INACTIVE"
                            ? "ปิดใช้งาน"
                            : "ระงับ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.lineDisplayName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755]/10 px-2 py-0.5 text-xs font-medium text-[#06C755]">
                          <span className="size-1.5 rounded-full bg-[#06C755]" />
                          เชื่อมต่อแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          ยังไม่เชื่อมต่อ
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{supplier.productCount}</TableCell>
                    <TableCell className="text-right">{supplier.submissionCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
