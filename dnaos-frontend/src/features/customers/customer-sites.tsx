"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createCustomerSite, listCustomerSites } from "./customer-api";
import {
  customerSiteFormSchema,
  type CustomerSiteFormValues,
} from "./schemas";
import type { Customer, CustomerSite } from "./types";

type CustomerSitesProps = {
  customerId: string;
};

export function CustomerSites({ customerId }: CustomerSitesProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CustomerSiteFormValues>({
    resolver: zodResolver(customerSiteFormSchema),
    defaultValues: {
      siteName: "",
      address: "",
      province: "",
      district: "",
      subdistrict: "",
      postalCode: "",
      gpsLat: "",
      gpsLng: "",
      contactName: "",
      contactPhone: "",
      deliveryNote: "",
      accessRestriction: "",
      preferredDeliveryTime: "",
      isActive: true,
    },
  });
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  async function refreshSites() {
    const result = await listCustomerSites(customerId);
    setCustomer(result.customer);
    setSites(result.sites);
  }

  useEffect(() => {
    let isMounted = true;

    listCustomerSites(customerId)
      .then((result) => {
        if (isMounted) {
          setCustomer(result.customer);
          setSites(result.sites);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : "ไม่สามารถโหลดสถานที่ได้");
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

  async function onSubmit(values: CustomerSiteFormValues) {
    setFormError(null);

    try {
      await createCustomerSite(customerId, values);
      form.reset();
      await refreshSites();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ไม่สามารถบันทึกสถานที่ได้");
    }
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href={`/admin/customers/${customerId}`}
      >
        <ArrowLeft />
        รายละเอียดลูกค้า
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {customer?.name ?? "ลูกค้า"} สถานที่
        </h1>
        <p className="text-sm text-muted-foreground">
          เพิ่มสถานที่จัดส่งสำหรับ order ในอนาคต
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการสถานที่ไม่สำเร็จ</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มสถานที่</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field message={form.formState.errors.siteName?.message}>
              <Label htmlFor="siteName">ชื่อสถานที่</Label>
              <Input id="siteName" {...form.register("siteName")} />
            </Field>
            <Field message={form.formState.errors.contactPhone?.message}>
              <Label htmlFor="contactPhone">โทรศัพท์ติดต่อ</Label>
              <Input id="contactPhone" {...form.register("contactPhone")} />
            </Field>
            <Field className="md:col-span-2" message={form.formState.errors.address?.message}>
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea id="address" rows={3} {...form.register("address")} />
            </Field>
            <Field>
              <Label htmlFor="province">จังหวัด</Label>
              <Input id="province" {...form.register("province")} />
            </Field>
            <Field>
              <Label htmlFor="district">อำเภอ</Label>
              <Input id="district" {...form.register("district")} />
            </Field>
            <Field>
              <Label htmlFor="subdistrict">ตำบล</Label>
              <Input id="subdistrict" {...form.register("subdistrict")} />
            </Field>
            <Field>
              <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
            </Field>
            <Field>
              <Label htmlFor="gpsLat">ละติจูด GPS</Label>
              <Input id="gpsLat" inputMode="decimal" {...form.register("gpsLat")} />
            </Field>
            <Field>
              <Label htmlFor="gpsLng">ลองจิจูด GPS</Label>
              <Input id="gpsLng" inputMode="decimal" {...form.register("gpsLng")} />
            </Field>
            <Field>
              <Label htmlFor="contactName">ชื่อผู้ติดต่อ</Label>
              <Input id="contactName" {...form.register("contactName")} />
            </Field>
            <Field>
              <Label htmlFor="preferredDeliveryTime">เวลาจัดส่งที่ต้องการ</Label>
              <Input
                id="preferredDeliveryTime"
                {...form.register("preferredDeliveryTime")}
              />
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="deliveryNote">หมายเหตุการจัดส่ง</Label>
              <Textarea id="deliveryNote" rows={2} {...form.register("deliveryNote")} />
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="accessRestriction">ข้อจำกัดการเข้าถึง</Label>
              <Textarea
                id="accessRestriction"
                rows={2}
                {...form.register("accessRestriction")}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">สถานที่ใช้งานอยู่</Label>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus />
              {form.formState.isSubmitting ? "กำลังบันทึก..." : "เพิ่มสถานที่"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลดสถานที่...</p>
        ) : null}
        {!isLoading && sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีสถานที่</p>
        ) : null}
        {sites.map((site) => (
          <Card key={site.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div className="font-medium">{site.siteName}</div>
                  <Badge variant={site.isActive ? "secondary" : "outline"}>
                    {site.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{site.address}</p>
                <p className="text-xs text-muted-foreground">
                  {[site.subdistrict, site.district, site.province, site.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {site.contactName || site.contactPhone || "ยังไม่มีข้อมูลติดต่อ"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
