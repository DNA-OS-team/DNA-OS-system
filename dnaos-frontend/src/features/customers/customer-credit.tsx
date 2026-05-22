"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomerCredit, upsertCustomerCredit } from "./customer-api";
import {
  customerCreditFormSchema,
  type CustomerCreditFormValues,
} from "./schemas";
import type { Customer } from "./types";

type CustomerCreditProps = {
  customerId: string;
};

const creditStatusOptions = ["NORMAL", "WATCH", "HOLD", "BLOCKED"] as const;

export function CustomerCredit({ customerId }: CustomerCreditProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<CustomerCreditFormValues>({
    resolver: zodResolver(customerCreditFormSchema),
    defaultValues: {
      creditLimit: "0",
      creditTermDays: "0",
      currentOutstanding: "0",
      overdueAmount: "0",
      creditStatus: "NORMAL",
      paymentBehaviorScore: "0",
    },
  });
  const creditStatus = useWatch({
    control: form.control,
    name: "creditStatus",
  });

  useEffect(() => {
    let isMounted = true;

    getCustomerCredit(customerId)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setCustomer(result.customer);

        if (result.creditProfile) {
          form.reset({
            creditLimit: String(result.creditProfile.creditLimit),
            creditTermDays: String(result.creditProfile.creditTermDays),
            currentOutstanding: String(result.creditProfile.currentOutstanding),
            overdueAmount: String(result.creditProfile.overdueAmount),
            creditStatus: result.creditProfile.creditStatus,
            paymentBehaviorScore: String(result.creditProfile.paymentBehaviorScore),
          });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(
            error instanceof Error ? error.message : "Unable to load credit profile"
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
  }, [customerId, form]);

  async function onSubmit(values: CustomerCreditFormValues) {
    setFormError(null);

    try {
      await upsertCustomerCredit(customerId, values);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save credit");
    }
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href={`/admin/customers/${customerId}`}
      >
        <ArrowLeft />
        Customer details
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {customer?.name ?? "Customer"} credit
        </h1>
        <p className="text-sm text-muted-foreground">
          Set credit limits and current credit status for this customer.
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Credit action failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading credit profile...</p>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Credit profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field message={form.formState.errors.creditLimit?.message}>
              <Label htmlFor="creditLimit">Credit limit</Label>
              <Input id="creditLimit" inputMode="decimal" {...form.register("creditLimit")} />
            </Field>
            <Field message={form.formState.errors.creditTermDays?.message}>
              <Label htmlFor="creditTermDays">Credit term days</Label>
              <Input
                id="creditTermDays"
                inputMode="numeric"
                {...form.register("creditTermDays")}
              />
            </Field>
            <Field message={form.formState.errors.currentOutstanding?.message}>
              <Label htmlFor="currentOutstanding">Current outstanding</Label>
              <Input
                id="currentOutstanding"
                inputMode="decimal"
                {...form.register("currentOutstanding")}
              />
            </Field>
            <Field message={form.formState.errors.overdueAmount?.message}>
              <Label htmlFor="overdueAmount">Overdue amount</Label>
              <Input
                id="overdueAmount"
                inputMode="decimal"
                {...form.register("overdueAmount")}
              />
            </Field>
            <Field message={form.formState.errors.creditStatus?.message}>
              <Label htmlFor="creditStatus">Credit status</Label>
              <Select
                value={creditStatus}
                onValueChange={(value) =>
                  form.setValue(
                    "creditStatus",
                    value as CustomerCreditFormValues["creditStatus"]
                  )
                }
              >
                <SelectTrigger id="creditStatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creditStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field message={form.formState.errors.paymentBehaviorScore?.message}>
              <Label htmlFor="paymentBehaviorScore">Payment behavior score</Label>
              <Input
                id="paymentBehaviorScore"
                inputMode="numeric"
                {...form.register("paymentBehaviorScore")}
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save />
              {form.formState.isSubmitting ? "Saving..." : "Save credit"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function Field({
  children,
  message,
}: {
  children: ReactNode;
  message?: string;
}) {
  return (
    <div className="space-y-2">
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
