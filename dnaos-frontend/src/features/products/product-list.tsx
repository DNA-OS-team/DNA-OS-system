"use client";

import { Package, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { listCategories, listProducts } from "./product-api";
import type { Product, ProductCategory } from "./types";

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filteredProducts = useMemo(() => products, [products]);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      Promise.all([
        listProducts({
          q: query,
          categoryId: categoryId === "all" ? undefined : categoryId,
          isActive: activeFilter,
        }),
        listCategories(),
      ])
        .then(([productResult, categoryResult]) => {
          if (isMounted) {
            setProducts(productResult.products);
            setCategories(categoryResult.categories);
          }
        })
        .catch((requestError: unknown) => {
          if (isMounted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "ไม่สามารถโหลดสินค้าได้"
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeFilter, categoryId, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">สินค้า</h1>
          <p className="text-sm text-muted-foreground">
            จัดการข้อมูลสินค้าหลักโดยไม่รวมราคา supplier
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/products/categories"
          >
            หมวดหมู่
          </Link>
          <Link className={buttonVariants()} href="/admin/products/new">
            <Plus />
            สินค้าใหม่
          </Link>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ไม่สามารถโหลดสินค้าได้</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาชื่อสินค้าหรือคำอธิบาย"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={categoryId}
            onValueChange={(value) => setCategoryId(value ?? "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="หมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(value) =>
              setActiveFilter(value as "all" | "true" | "false")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="true">ใช้งานเท่านั้น</SelectItem>
              <SelectItem value="false">ไม่ใช้งานเท่านั้น</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>หน่วย</TableHead>
                <TableHead>ตัวแปร</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    กำลังโหลดสินค้า...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    ไม่พบสินค้า
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.description || "ไม่มีคำอธิบาย"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name ?? "-"}</TableCell>
                  <TableCell>{product.defaultUnit}</TableCell>
                  <TableCell>{product.variantCount ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "secondary" : "outline"}>
                      {product.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/products/${product.id}`}
                    >
                      เปิด
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
