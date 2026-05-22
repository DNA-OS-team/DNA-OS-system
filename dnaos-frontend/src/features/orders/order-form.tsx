"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { createOrder, getOrderOptions, updateOrder } from "./order-api";
import { orderFormSchema, type OrderFormValues } from "./schemas";
import type {
  CustomerOrder,
  CustomerOrderOptions,
  CustomerOrderStatus,
} from "./types";

const statuses: CustomerOrderStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "PRICING",
  "QUOTED",
  "CONFIRMED",
  "CANCELLED",
];

type OrderFormProps = {
  order?: CustomerOrder;
};

export function OrderForm({ order }: OrderFormProps) {
  const router = useRouter();
  const [options, setOptions] = useState<CustomerOrderOptions>({
    projects: [],
    productVariants: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      projectId: order?.projectId ?? "",
      customerCompanyId: order?.customerCompanyId ?? "",
      customerSiteId: order?.customerSiteId ?? "",
      status: order?.status ?? "DRAFT",
      requestedDeliveryAt: order?.requestedDeliveryAt
        ? order.requestedDeliveryAt.slice(0, 16)
        : "",
      deliveryNote: order?.deliveryNote ?? "",
      items:
        order?.items?.map((item) => ({
          productVariantId: item.productVariantId,
          description: item.description ?? "",
          quantity: String(item.quantity),
          unit: item.unit,
        })) ?? [
          {
            productVariantId: "",
            description: "",
            quantity: "1",
            unit: "",
          },
        ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const projectId = useWatch({
    control: form.control,
    name: "projectId",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });
  const selectedProject = useMemo(
    () => options.projects.find((project) => project.id === projectId),
    [options.projects, projectId]
  );

  useEffect(() => {
    let isMounted = true;

    getOrderOptions()
      .then((result) => {
        if (isMounted) {
          setOptions(result);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : "Unable to load order options");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    form.setValue("customerCompanyId", selectedProject.customerCompanyId);
    form.setValue("customerSiteId", selectedProject.customerSiteId);
  }, [form, selectedProject]);

  async function onSubmit(values: OrderFormValues) {
    setFormError(null);

    try {
      const result = order
        ? await updateOrder(order.id, values)
        : await createOrder(values);

      router.push(`/admin/orders/${result.order.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save order");
    }
  }

  function applyVariant(index: number, productVariantId: string | null) {
    if (!productVariantId) {
      return;
    }

    const variant = options.productVariants.find((item) => item.id === productVariantId);

    form.setValue(`items.${index}.productVariantId`, productVariantId);

    if (variant?.unit) {
      form.setValue(`items.${index}.unit`, variant.unit);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Order action failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{order ? "Order details" : "New order"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field message={form.formState.errors.projectId?.message}>
            <Label htmlFor="projectId">Project</Label>
            <Select
              value={projectId}
              onValueChange={(value) => {
                if (value) {
                  form.setValue("projectId", value);
                }
              }}
            >
              <SelectTrigger id="projectId" className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {options.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectNo} / {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field message={form.formState.errors.status?.message}>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                form.setValue("status", value as CustomerOrderStatus)
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field message={form.formState.errors.customerCompanyId?.message}>
            <Label>Customer</Label>
            <Input value={selectedProject?.customerCompany?.name ?? ""} readOnly />
          </Field>
          <Field message={form.formState.errors.customerSiteId?.message}>
            <Label>Site</Label>
            <Input value={selectedProject?.customerSite?.siteName ?? ""} readOnly />
          </Field>

          <Field message={form.formState.errors.requestedDeliveryAt?.message}>
            <Label htmlFor="requestedDeliveryAt">Requested delivery</Label>
            <Input
              id="requestedDeliveryAt"
              type="datetime-local"
              {...form.register("requestedDeliveryAt")}
            />
          </Field>

          <Field
            className="md:col-span-2"
            message={form.formState.errors.deliveryNote?.message}
          >
            <Label htmlFor="deliveryNote">Delivery note</Label>
            <Textarea id="deliveryNote" rows={3} {...form.register("deliveryNote")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                productVariantId: "",
                description: "",
                quantity: "1",
                unit: "",
              })
            }
          >
            <Plus />
            Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.formState.errors.items?.root?.message ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.items.root.message}
            </p>
          ) : null}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_120px_120px_auto]"
            >
              <Field message={form.formState.errors.items?.[index]?.productVariantId?.message}>
                <Label>Product variant</Label>
                <Select
                  value={form.watch(`items.${index}.productVariantId`)}
                  onValueChange={(value) => applyVariant(index, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.productVariants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.product?.name ?? "-"} / {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field message={form.formState.errors.items?.[index]?.quantity?.message}>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.001"
                  {...form.register(`items.${index}.quantity`)}
                />
              </Field>
              <Field message={form.formState.errors.items?.[index]?.unit?.message}>
                <Label>Unit</Label>
                <Input {...form.register(`items.${index}.unit`)} />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Remove order item"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Field
                className="md:col-span-4"
                message={form.formState.errors.items?.[index]?.description?.message}
              >
                <Label>Description</Label>
                <Input {...form.register(`items.${index}.description`)} />
              </Field>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting ? "Saving..." : "Save order"}
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
