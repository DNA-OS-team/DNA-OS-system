"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  createCategory,
  listCategories,
  updateCategory,
} from "./product-api";
import { categoryFormSchema, type CategoryFormValues } from "./schemas";
import type { ProductCategory } from "./types";

export function ProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: "0",
    },
  });

  async function refreshCategories() {
    const result = await listCategories();
    setCategories(result.categories);
  }

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
          setFormError(
            error instanceof Error ? error.message : "Unable to load categories"
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
  }, []);

  async function onSubmit(values: CategoryFormValues) {
    setFormError(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
      } else {
        await createCategory(values);
      }

      setEditingCategory(null);
      form.reset({ name: "", description: "", sortOrder: "0" });
      await refreshCategories();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save category");
    }
  }

  function startEdit(category: ProductCategory) {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description ?? "",
      sortOrder: String(category.sortOrder),
    });
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/products"
      >
        <ArrowLeft />
        Products
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Product categories
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage category grouping for product master data.
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Category action failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Edit category" : "Create category"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_160px]">
            <Field message={form.formState.errors.name?.message}>
              <Label htmlFor="name">Category name</Label>
              <Input id="name" {...form.register("name")} />
            </Field>
            <Field message={form.formState.errors.sortOrder?.message}>
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" inputMode="numeric" {...form.register("sortOrder")} />
            </Field>
            <Field
              className="md:col-span-2"
              message={form.formState.errors.description?.message}
            >
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...form.register("description")} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingCategory ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingCategory(null);
                  form.reset({ name: "", description: "", sortOrder: "0" });
                }}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save />
              {form.formState.isSubmitting ? "Saving..." : "Save category"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>{category.productCount ?? 0}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(category)}
                    >
                      Edit
                    </Button>
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
