"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createVariant, listVariants, updateVariant } from "./product-api";
import { variantFormSchema, type VariantFormValues } from "./schemas";
import type { Product, ProductVariant } from "./types";

type ProductVariantsProps = {
  productId: string;
};

export function ProductVariants({ productId }: ProductVariantsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: "",
      unit: "",
      specsJson: "",
      isActive: true,
    },
  });
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  async function refreshVariants() {
    const result = await listVariants(productId);
    setProduct(result.product);
    setVariants(result.variants);
  }

  useEffect(() => {
    let isMounted = true;

    listVariants(productId)
      .then((result) => {
        if (isMounted) {
          setProduct(result.product);
          setVariants(result.variants);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : "ไม่สามารถโหลดตัวแปรได้");
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
  }, [productId]);

  async function onSubmit(values: VariantFormValues) {
    setFormError(null);

    try {
      if (editingVariant) {
        await updateVariant(productId, editingVariant.id, values);
      } else {
        await createVariant(productId, values);
      }

      setEditingVariant(null);
      form.reset({ name: "", unit: "", specsJson: "", isActive: true });
      await refreshVariants();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ไม่สามารถบันทึกตัวแปรได้");
    }
  }

  function startEdit(variant: ProductVariant) {
    setEditingVariant(variant);
    form.reset({
      name: variant.name,
      unit: variant.unit,
      specsJson: JSON.stringify(variant.specs ?? {}, null, 2),
      isActive: variant.isActive,
    });
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href={`/admin/products/${productId}`}
      >
        <ArrowLeft />
        รายละเอียดสินค้า
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {product?.name ?? "สินค้า"} ตัวแปร
        </h1>
        <p className="text-sm text-muted-foreground">
          จัดการตัวแปรและข้อมูลจำเพาะ ราคา supplier แยกต่างหาก
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการตัวแปรไม่สำเร็จ</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{editingVariant ? "แก้ไขตัวแปร" : "เพิ่มตัวแปร"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field message={form.formState.errors.name?.message}>
              <Label htmlFor="name">ชื่อตัวแปร</Label>
              <Input id="name" {...form.register("name")} />
            </Field>
            <Field message={form.formState.errors.unit?.message}>
              <Label htmlFor="unit">หน่วยตัวแปร</Label>
              <Input id="unit" {...form.register("unit")} />
            </Field>
            <Field
              className="md:col-span-2"
              message={form.formState.errors.specsJson?.message}
            >
              <Label htmlFor="specsJson">Specs JSON</Label>
              <Textarea
                id="specsJson"
                rows={5}
                placeholder='{"size":"large","material":"sand"}'
                {...form.register("specsJson")}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">ตัวแปรใช้งานอยู่</Label>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingVariant ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingVariant(null);
                  form.reset({ name: "", unit: "", specsJson: "", isActive: true });
                }}
              >
                ยกเลิก
              </Button>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus />
              {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึกตัวแปร"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลดตัวแปร...</p>
        ) : null}
        {!isLoading && variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีตัวแปร</p>
        ) : null}
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{variant.name}</div>
                  <Badge variant={variant.isActive ? "secondary" : "outline"}>
                    {variant.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">หน่วย: {variant.unit}</p>
                <pre className="max-w-xl overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  {JSON.stringify(variant.specs ?? {}, null, 2)}
                </pre>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startEdit(variant)}
              >
                แก้ไข
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
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
