"use client";

import { zodResolver } from "@/lib/zod-resolver";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePartnerProductSubmission,
  getPartnerProductSubmission,
  rejectPartnerProductSubmission,
} from "./partner-product-api";
import { reviewSubmissionSchema, type ReviewSubmissionValues } from "./schemas";
import type { PartnerProductSubmission } from "./types";

type PartnerProductDetailProps = {
  submissionId: string;
};

export function PartnerProductDetail({ submissionId }: PartnerProductDetailProps) {
  const [submission, setSubmission] = useState<PartnerProductSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ReviewSubmissionValues>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: {
      adminReviewNote: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    getPartnerProductSubmission(submissionId)
      .then((result) => {
        if (isMounted) {
          setSubmission(result.submission);
          form.setValue("adminReviewNote", result.submission.adminReviewNote ?? "");
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "ไม่สามารถโหลดรายการสินค้าซัพพลายเออร์ได้"
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
  }, [form, submissionId]);

  async function review(action: "approve" | "reject", values: ReviewSubmissionValues) {
    setError(null);

    try {
      const result =
        action === "approve"
          ? await approvePartnerProductSubmission(submissionId, values)
          : await rejectPartnerProductSubmission(submissionId, values);

      setSubmission(result.submission);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ไม่สามารถตรวจสอบรายการได้"
      );
    }
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/partner-products"
      >
        <ArrowLeft />
        สินค้าซัพพลายเออร์
      </Link>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ตรวจสอบไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลดรายการ...</p>
      ) : null}

      {submission ? (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={submission.status === "PENDING" ? "secondary" : "outline"}>
                  {submission.status}
                </Badge>
                <Badge variant="outline">{submission.supplierCompany?.name}</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-normal">
                {submission.requestedProductName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {submission.requestedCategoryName || "ไม่มีหมวดหมู่"} / {submission.unit}
              </p>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/supplier-inventory"
            >
              คลังสินค้า
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดรายการ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Detail label="ซัพพลายเออร์" value={submission.supplierCompany?.name ?? "-"} />
              <Detail
                label="ตัวแปรหลัก"
                value={
                  submission.productVariant
                    ? `${submission.productVariant.product?.name ?? "-"} / ${submission.productVariant.name}`
                    : "ยังไม่เชื่อมโยง"
                }
              />
              <Detail label="ราคา" value={formatNumber(submission.price)} />
              <Detail
                label="สต็อกเริ่มต้น"
                value={`${formatNumber(submission.stockQty)} ${submission.unit}`}
              />
              <Detail label="จำนวนขั้นต่ำ" value={formatNumber(submission.minQty)} />
              <Detail label="พื้นที่บริการ" value={submission.serviceArea ?? "-"} />
              <Detail
                label="สินค้าในคลัง"
                value={submission.supplierProductId ?? "ยังไม่สร้าง"}
              />
              <Detail
                label="ตรวจสอบเมื่อ"
                value={
                  submission.reviewedAt
                    ? new Date(submission.reviewedAt).toLocaleString()
                    : "-"
                }
              />
              <div className="md:col-span-2">
                <p className="text-sm font-medium">คำอธิบาย</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {submission.description || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <form className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ตรวจสอบโดย Admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="adminReviewNote">หมายเหตุการตรวจสอบ</Label>
                <Textarea
                  id="adminReviewNote"
                  rows={4}
                  {...form.register("adminReviewNote")}
                />
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submission.status !== "PENDING" || form.formState.isSubmitting}
                  onClick={form.handleSubmit((values) => review("reject", values))}
                >
                  <X />
                  ปฏิเสธ
                </Button>
                <Button
                  type="button"
                  disabled={
                    submission.status !== "PENDING" ||
                    !submission.productVariantId ||
                    form.formState.isSubmitting
                  }
                  onClick={form.handleSubmit((values) => review("approve", values))}
                >
                  <Check />
                  อนุมัติ
                </Button>
              </CardFooter>
            </Card>
          </form>
        </>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 break-words text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
}
