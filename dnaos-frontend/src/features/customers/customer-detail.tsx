"use client";

import { ArrowLeft, CreditCard, MapPinned } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCustomer } from "./customer-api";
import { CustomerForm } from "./customer-form";
import type { Customer } from "./types";

type CustomerDetailProps = {
  customerId: string;
};

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCustomer(customerId)
      .then((result) => {
        if (isMounted) {
          setCustomer(result.customer);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load customer"
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
  }, [customerId]);

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/customers"
      >
        <ArrowLeft />
        Customers
      </Link>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Customer unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading customer...</p>
      ) : null}

      {customer ? (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">{customer.status}</Badge>
                <Badge variant="outline">{customer.type}</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-normal">
                {customer.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Update customer company details without changing tenant scope.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/admin/customers/${customer.id}/sites`}
              >
                <MapPinned />
                Sites
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/admin/customers/${customer.id}/credit`}
              >
                <CreditCard />
                Credit
              </Link>
            </div>
          </div>
          <Separator />
          <CustomerForm customer={customer} />
        </>
      ) : null}
    </div>
  );
}
