"use client";

import { zodResolver } from "@/lib/zod-resolver";
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
      setFormError(error instanceof Error ? error.message : "ไม่สามารถบันทึกลูกค้าได้");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>บันทึกไม่สำเร็จ</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{customer ? "รายละเอียดลูกค้า" : "ลูกค้าใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldError message={form.formState.errors.name?.message}>
            <Label htmlFor="name">ชื่อบริษัทลูกค้า</Label>
            <Input id="name" {...form.register("name")} />
          </FieldError>

          <FieldError message={form.formState.errors.taxId?.message}>
            <Label htmlFor="taxId">เลขที่ผู้เสียภาษี</Label>
            <Input id="taxId" {...form.register("taxId")} />
          </FieldError>

          <FieldError message={form.formState.errors.phone?.message}>
            <Label htmlFor="phone">โทรศัพท์</Label>
            <Input id="phone" {...form.register("phone")} />
          </FieldError>

          <FieldError message={form.formState.errors.email?.message}>
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </FieldError>

          <FieldError message={form.formState.errors.bankName?.message}>
            <Label htmlFor="bankName">ชื่อธนาคาร</Label>
            <Input id="bankName" {...form.register("bankName")} />
          </FieldError>

          <FieldError message={form.formState.errors.bankAccountNo?.message}>
            <Label htmlFor="bankAccountNo">เลขบัญชีธนาคาร</Label>
            <Input id="bankAccountNo" {...form.register("bankAccountNo")} />
          </FieldError>

          <FieldError
            className="md:col-span-2"
            message={form.formState.errors.address?.message}
          >
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea id="address" rows={3} {...form.register("address")} />
          </FieldError>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึกลูกค้า"}
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
