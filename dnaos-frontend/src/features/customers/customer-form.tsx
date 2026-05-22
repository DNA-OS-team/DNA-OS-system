"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "./customer-api";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "./schemas";
import type { Customer } from "./types";

type CustomerFormProps = {
  customer?: Customer;
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name ?? "",
      taxId: customer?.taxId ?? "",
      address: customer?.address ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      bankName: customer?.bankName ?? "",
      bankAccountNo: customer?.bankAccountNo ?? "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    setFormError(null);

    try {
      const result = customer
        ? await updateCustomer(customer.id, values)
        : await createCustomer(values);

      router.push(`/admin/customers/${result.customer.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save customer");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{customer ? "Customer details" : "New customer"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldError message={form.formState.errors.name?.message}>
            <Label htmlFor="name">Customer name</Label>
            <Input id="name" {...form.register("name")} />
          </FieldError>

          <FieldError message={form.formState.errors.taxId?.message}>
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" {...form.register("taxId")} />
          </FieldError>

          <FieldError message={form.formState.errors.phone?.message}>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </FieldError>

          <FieldError message={form.formState.errors.email?.message}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </FieldError>

          <FieldError message={form.formState.errors.bankName?.message}>
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" {...form.register("bankName")} />
          </FieldError>

          <FieldError message={form.formState.errors.bankAccountNo?.message}>
            <Label htmlFor="bankAccountNo">Bank account</Label>
            <Input id="bankAccountNo" {...form.register("bankAccountNo")} />
          </FieldError>

          <FieldError
            className="md:col-span-2"
            message={form.formState.errors.address?.message}
          >
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={3} {...form.register("address")} />
          </FieldError>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting ? "Saving..." : "Save customer"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function FieldError({
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
