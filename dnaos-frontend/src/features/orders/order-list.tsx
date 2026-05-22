"use client";

import { ClipboardList, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listOrders } from "./order-api";
import type { CustomerOrder, CustomerOrderStatus } from "./types";

const statuses: Array<"all" | CustomerOrderStatus> = [
  "all",
  "DRAFT",
  "SUBMITTED",
  "PRICING",
  "QUOTED",
  "CONFIRMED",
  "CANCELLED",
];

export function OrderList() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CustomerOrderStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      listOrders({ q: query, status })
        .then((result) => {
          if (isMounted) {
            setOrders(result.orders);
          }
        })
        .catch((requestError: unknown) => {
          if (isMounted) {
            setError(
              requestError instanceof Error ? requestError.message : "Unable to load orders"
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Create customer orders before pricing, BOQ, and quotation.
          </p>
        </div>
        <Link className={buttonVariants()} href="/admin/orders/new">
          <Plus />
          New order
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Orders unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Order filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search order, project, or customer"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "all" | CustomerOrderStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {statusOption === "all" ? "All statuses" : statusOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : null}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-mono text-sm">{order.orderNo}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.project?.projectNo ?? "-"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{order.customerCompany?.name ?? "-"}</TableCell>
                  <TableCell>{order.customerSite?.siteName ?? "-"}</TableCell>
                  <TableCell>{order.itemCount ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "DRAFT" ? "secondary" : "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/orders/${order.id}`}
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
