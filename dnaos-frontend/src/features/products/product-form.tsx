"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  listCategories,
  updateProduct,
} from "./product-api";
import { productFormSchema, type ProductFormValues } from "./schemas";
import type { Product, ProductCategory } from "./types";

type ProductFormProps = {
  product?: Product;
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      categoryId: product?.categoryId ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      defaultUnit: product?.defaultUnit ?? "",
      isActive: product?.isActive ?? true,
    },
  });
  const categoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  useEffect(() => {
    let isMounted = true;

    listCategories()
      .then((result) => {
        if (isMounted) {
          setCategories(result.categories);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : "Unable to load categories");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);

    try {
      const result = product
        ? await updateProduct(product.id, values)
        : await createProduct(values);

      router.push(`/admin/products/${result.product.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save product");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Product action failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{product ? "Product details" : "New product"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field message={form.formState.errors.name?.message}>
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...form.register("name")} />
          </Field>

          <Field message={form.formState.errors.defaultUnit?.message}>
            <Label htmlFor="defaultUnit">Default unit</Label>
            <Input id="defaultUnit" {...form.register("defaultUnit")} />
          </Field>

          <Field message={form.formState.errors.categoryId?.message}>
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                if (value) {
                  form.setValue("categoryId", value);
                }
              }}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center gap-3 pt-7">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active product</Label>
          </div>

          <Field
            className="md:col-span-2"
            message={form.formState.errors.description?.message}
          >
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting ? "Saving..." : "Save product"}
          </Button>
        </CardFooter>
      </Card>
    </form>
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
