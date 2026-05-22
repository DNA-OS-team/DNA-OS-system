"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomers } from "./customer-api";
import type { Customer } from "./types";

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    listCustomers()
      .then((result) => {
        if (isMounted) {
          setCustomers(result.customers);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load customers"
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer companies, delivery sites, and credit settings.
          </p>
        </div>
        <Link className={buttonVariants()} href="/admin/customers/new">
          <Plus />
          New customer
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Customers unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Customer directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : null}

              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.email || customer.phone || "No contact yet"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{customer.status}</Badge>
                  </TableCell>
                  <TableCell>{customer.siteCount ?? 0}</TableCell>
                  <TableCell>
                    {customer.customerCreditProfile ? "Configured" : "Not set"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/customers/${customer.id}`}
                    >
                      Open
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
