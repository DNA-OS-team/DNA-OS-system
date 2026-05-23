"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { createTransportJob, listFleetCompanies } from "./transport-job-api";
import type { FleetCompany } from "./types";

const schema = z.object({
  pickupAddress: z.string().min(1, "กรุณาระบุที่อยู่รับสินค้า"),
  fleetCompanyId: z.string().optional(),
  scheduledPickupAt: z.string().optional(),
  scheduledDeliveryAt: z.string().optional(),
  transportCost: z.number().min(0).optional(),
  customerDeliveryFee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  orderId: string;
  supplierPurchaseOrderId?: string;
  onSuccess?: () => void;
};

export function TransportJobForm({ orderId, supplierPurchaseOrderId, onSuccess }: Props) {
  const [fleetCompanies, setFleetCompanies] = useState<FleetCompany[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pickupAddress: "",
      transportCost: 0,
      customerDeliveryFee: 0,
    },
  });

  useEffect(() => {
    listFleetCompanies()
      .then((r) => setFleetCompanies(r.companies))
      .catch(() => {});
  }, []);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await createTransportJob({
        orderId,
        supplierPurchaseOrderId,
        ...values,
        fleetCompanyId: selectedFleet || undefined,
      });
      form.reset();
      setSelectedFleet("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างงานขนส่งไม่สำเร็จ");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldError message={form.formState.errors.pickupAddress?.message}>
        <Label htmlFor="pickupAddress">ที่อยู่รับสินค้า *</Label>
        <Input id="pickupAddress" placeholder="ชื่อโรงงาน / คลังสินค้า / ที่อยู่" {...form.register("pickupAddress")} />
      </FieldError>

      <div className="space-y-2">
        <Label>Fleet (ไม่บังคับ)</Label>
        <Select value={selectedFleet} onValueChange={(v) => setSelectedFleet(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="เลือก fleet หรือมอบหมายทีหลัง" />
          </SelectTrigger>
          <SelectContent>
            {fleetCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldError message={form.formState.errors.scheduledPickupAt?.message}>
          <Label htmlFor="scheduledPickupAt">วัน-เวลารับสินค้า</Label>
          <Input id="scheduledPickupAt" type="datetime-local" {...form.register("scheduledPickupAt")} />
        </FieldError>
        <FieldError message={form.formState.errors.scheduledDeliveryAt?.message}>
          <Label htmlFor="scheduledDeliveryAt">วัน-เวลาส่งสินค้า</Label>
          <Input id="scheduledDeliveryAt" type="datetime-local" {...form.register("scheduledDeliveryAt")} />
        </FieldError>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldError message={form.formState.errors.transportCost?.message}>
          <Label htmlFor="transportCost">ต้นทุนขนส่ง (บาท)</Label>
          <Input id="transportCost" type="number" step="0.01" min="0" {...form.register("transportCost", { valueAsNumber: true })} />
        </FieldError>
        <FieldError message={form.formState.errors.customerDeliveryFee?.message}>
          <Label htmlFor="customerDeliveryFee">ค่าส่งที่คิดลูกค้า (บาท)</Label>
          <Input id="customerDeliveryFee" type="number" step="0.01" min="0" {...form.register("customerDeliveryFee", { valueAsNumber: true })} />
        </FieldError>
      </div>

      <FieldError message={form.formState.errors.notes?.message}>
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea id="notes" placeholder="รายละเอียดเพิ่มเติม" rows={3} {...form.register("notes")} />
      </FieldError>

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "กำลังสร้าง..." : "สร้างงานขนส่ง"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ children, message }: { children: ReactNode; message?: string }) {
  return (
    <div className="space-y-2">
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
