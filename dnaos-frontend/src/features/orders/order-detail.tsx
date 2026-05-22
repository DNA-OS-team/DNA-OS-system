"use client";

import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrder } from "./order-api";
import { BoqPanel } from "./boq-panel";
import { OrderForm } from "./order-form";
import { PricingPanel } from "./pricing-panel";
import { PurchaseOrderPanel } from "./purchase-order-panel";
import { QuotationPanel } from "./quotation-panel";
import type { CustomerOrder } from "./types";

type OrderDetailProps = {
  orderId: string;
};

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOrder(orderId)
      .then((result) => {
        if (isMounted) {
          setOrder(result.order);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error ? requestError.message : "โหลด order ไม่สำเร็จ"
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
  }, [orderId]);

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/orders"
      >
        <ArrowLeft />
        กลับไปหน้า order
      </Link>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ไม่พบข้อมูล order</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด order...</p>
      ) : null}

      {order ? (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={order.status === "DRAFT" ? "secondary" : "outline"}>
                  {order.status}
                </Badge>
                <Badge variant="outline">{order.project?.projectNo}</Badge>
              </div>
              <h1 className="font-mono text-2xl font-semibold tracking-normal">
                {order.orderNo}
              </h1>
              <p className="text-sm text-muted-foreground">
                {order.customerCompany?.name ?? "-"} / {order.customerSite?.siteName ?? "-"}
              </p>
            </div>
            {order.documentGroup?.groupNo ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/admin/document-groups/${order.documentGroup.groupNo}`}
              >
                <FileText />
                ชุดเอกสาร
              </Link>
            ) : null}
          </div>
          <Separator />
          <PricingPanel orderId={order.id} />
          <BoqPanel orderId={order.id} />
          <QuotationPanel orderId={order.id} />
          <PurchaseOrderPanel orderId={order.id} />
          <OrderForm order={order} />
        </>
      ) : null}
    </div>
  );
}
