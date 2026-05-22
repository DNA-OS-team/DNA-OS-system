"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PackageCheck, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createPartnerProductSubmission,
  getPartnerProductOptions,
  listPartnerProductSubmissions,
} from "./partner-product-api";
import {
  partnerProductSubmissionFormSchema,
  type PartnerProductSubmissionFormValues,
} from "./schemas";
import type {
  CompanySummary,
  PartnerProductSubmission,
  PartnerProductSubmissionStatus,
  ProductVariantOption,
} from "./types";

const statuses: Array<"all" | PartnerProductSubmissionStatus> = [
  "all",
  "PENDING",
  "APPROVED",
  "REJECTED",
];

export function PartnerProductList() {
  const [submissions, setSubmissions] = useState<PartnerProductSubmission[]>([]);
  const [suppliers, setSuppliers] = useState<CompanySummary[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariantOption[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PartnerProductSubmissionStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PartnerProductSubmissionFormValues>({
    resolver: zodResolver(partnerProductSubmissionFormSchema),
    defaultValues: {
      supplierCompanyId: "",
      productVariantId: "",
      requestedProductName: "",
      requestedCategoryName: "",
      description: "",
      unit: "",
      price: "0",
      stockQty: "0",
      minQty: "0",
      serviceArea: "",
    },
  });
  const supplierCompanyId = useWatch({
    control: form.control,
    name: "supplierCompanyId",
  });
  const productVariantId = useWatch({
    control: form.control,
    name: "productVariantId",
  });
  const selectedVariant = useMemo(
    () => productVariants.find((variant) => variant.id === productVariantId),
    [productVariantId, productVariants]
  );

  useEffect(() => {
    let isMounted = true;

    getPartnerProductOptions()
      .then((result) => {
        if (isMounted) {
          setSuppliers(result.suppliers);
          setProductVariants(result.productVariants);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "ไม่สามารถโหลดตัวเลือกสินค้าซัพพลายเออร์ได้"
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      loadSubmissions(isMounted);
    }, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, status]);

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }

    form.setValue("requestedProductName", selectedVariant.product?.name ?? selectedVariant.name);
    form.setValue(
      "requestedCategoryName",
      selectedVariant.product?.category?.name ?? ""
    );
    form.setValue("unit", selectedVariant.unit);
  }, [form, selectedVariant]);

  async function loadSubmissions(isMounted = true) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listPartnerProductSubmissions({ q: query, status });

      if (isMounted) {
        setSubmissions(result.submissions);
      }
    } catch (requestError) {
      if (isMounted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "ไม่สามารถโหลดรายการสินค้าซัพพลายเออร์ได้"
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  async function onSubmit(values: PartnerProductSubmissionFormValues) {
    setError(null);

    try {
      await createPartnerProductSubmission(values);
      form.reset({
        supplierCompanyId: "",
        productVariantId: "",
        requestedProductName: "",
        requestedCategoryName: "",
        description: "",
        unit: "",
        price: "0",
        stockQty: "0",
        minQty: "0",
        serviceArea: "",
      });
      await loadSubmissions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ไม่สามารถสร้างรายการสินค้าซัพพลายเออร์ได้"
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            สินค้าซัพพลายเออร์
          </h1>
          <p className="text-sm text-muted-foreground">
            ตรวจสอบรายการสินค้าซัพพลายเออร์ก่อนอนุมัติ
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/supplier-inventory"
        >
          คลังสินค้า
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการสินค้าซัพพลายเออร์ไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มรายการซัพพลายเออร์</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field message={form.formState.errors.supplierCompanyId?.message}>
              <Label htmlFor="supplierCompanyId">ซัพพลายเออร์</Label>
              <Select
                value={supplierCompanyId}
                onValueChange={(value) => {
                  if (value) {
                    form.setValue("supplierCompanyId", value);
                  }
                }}
              >
                <SelectTrigger id="supplierCompanyId" className="w-full">
                  <SelectValue placeholder="เลือกซัพพลายเออร์" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field message={form.formState.errors.productVariantId?.message}>
              <Label htmlFor="productVariantId">ตัวแปรหลัก</Label>
              <Select
                value={productVariantId || "none"}
                onValueChange={(value) =>
                  form.setValue("productVariantId", value === "none" ? "" : value ?? "")
                }
              >
                <SelectTrigger id="productVariantId" className="w-full">
                  <SelectValue placeholder="ไม่บังคับ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ขอสินค้าใหม่</SelectItem>
                  {productVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.product?.name ?? variant.name} / {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field message={form.formState.errors.requestedProductName?.message}>
              <Label htmlFor="requestedProductName">ชื่อสินค้า</Label>
              <Input id="requestedProductName" {...form.register("requestedProductName")} />
            </Field>
            <Field message={form.formState.errors.requestedCategoryName?.message}>
              <Label htmlFor="requestedCategoryName">หมวดหมู่</Label>
              <Input
                id="requestedCategoryName"
                {...form.register("requestedCategoryName")}
              />
            </Field>
            <Field message={form.formState.errors.unit?.message}>
              <Label htmlFor="unit">หน่วย</Label>
              <Input id="unit" {...form.register("unit")} />
            </Field>
            <Field message={form.formState.errors.price?.message}>
              <Label htmlFor="price">ราคา</Label>
              <Input id="price" type="number" step="0.01" {...form.register("price")} />
            </Field>
            <Field message={form.formState.errors.stockQty?.message}>
              <Label htmlFor="stockQty">จำนวนสต็อก</Label>
              <Input
                id="stockQty"
                type="number"
                step="0.001"
                {...form.register("stockQty")}
              />
            </Field>
            <Field message={form.formState.errors.minQty?.message}>
              <Label htmlFor="minQty">จำนวนขั้นต่ำ</Label>
              <Input id="minQty" type="number" step="0.001" {...form.register("minQty")} />
            </Field>
            <Field message={form.formState.errors.serviceArea?.message}>
              <Label htmlFor="serviceArea">พื้นที่บริการ</Label>
              <Input id="serviceArea" {...form.register("serviceArea")} />
            </Field>
            <Field className="md:col-span-2" message={form.formState.errors.description?.message}>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus />
              {form.formState.isSubmitting ? "กำลังส่ง..." : "ส่งรายการ"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองรายการ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาซัพพลายเออร์ หมวดหมู่ หรือสินค้า"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "all" | PartnerProductSubmissionStatus)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {statusOption === "all" ? "ทุกสถานะ" : statusOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการที่ส่งมา</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>ซัพพลายเออร์</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>สต็อก</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    กำลังโหลดรายการ...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    ไม่พบรายการ
                  </TableCell>
                </TableRow>
              ) : null}
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PackageCheck className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{submission.requestedProductName}</div>
                        <div className="text-xs text-muted-foreground">
                          {submission.requestedCategoryName || submission.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.supplierCompany?.name ?? "-"}</TableCell>
                  <TableCell>{formatNumber(submission.price)}</TableCell>
                  <TableCell>
                    {formatNumber(submission.stockQty)} {submission.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={submission.status === "PENDING" ? "secondary" : "outline"}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/partner-products/${submission.id}`}
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

function Field({
  children,
  className,
  message,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
}
