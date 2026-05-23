"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createDispute, type DisputeType } from "./dispute-api";

const DISPUTE_TYPES: [DisputeType, string][] = [
  ["SHORT_DELIVERY", "ส่งของขาด"],
  ["WRONG_MATERIAL", "วัสดุผิด"],
  ["LATE_DELIVERY", "ส่งช้า"],
  ["DAMAGED_MATERIAL", "วัสดุเสียหาย"],
  ["PRICE_DISPUTE", "ข้อพิพาทราคา"],
  ["PAYMENT_DISPUTE", "ข้อพิพาทชำระเงิน"],
  ["CUSTOMER_REJECTED", "ลูกค้าปฏิเสธ"],
  ["TRANSPORT_FAILED", "การขนส่งล้มเหลว"],
  ["OTHER", "อื่นๆ"],
];

export function DisputeForm() {
  const router = useRouter();
  const [disputeType, setDisputeType] = useState<DisputeType>("OTHER");
  const [description, setDescription] = useState("");
  const [customerOrderId, setCustomerOrderId] = useState("");
  const [transportJobId, setTransportJobId] = useState("");
  const [supplierPoId, setSupplierPoId] = useState("");
  const [financialImpact, setFinancialImpact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("กรุณาระบุรายละเอียด");
      return;
    }
    if (!customerOrderId.trim() && !transportJobId.trim() && !supplierPoId.trim()) {
      setError("กรุณาระบุ Order ID, Transport Job ID หรือ Supplier PO ID อย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createDispute({
        disputeType,
        description: description.trim(),
        customerOrderId: customerOrderId.trim() || null,
        transportJobId: transportJobId.trim() || null,
        supplierPoId: supplierPoId.trim() || null,
        financialImpact: financialImpact ? Number(financialImpact) : null,
      });
      router.push(`/admin/disputes/${result.dispute.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปิด dispute ไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>เปิด Dispute ใหม่</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label>ประเภทปัญหา</Label>
            <Select
              value={disputeType}
              onValueChange={(v) => v && setDisputeType(v as DisputeType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">รายละเอียดปัญหา *</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาที่เกิดขึ้น..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="order-id">Customer Order ID (UUID)</Label>
            <Input
              id="order-id"
              value={customerOrderId}
              onChange={(e) => setCustomerOrderId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-id">Transport Job ID (UUID)</Label>
            <Input
              id="job-id"
              value={transportJobId}
              onChange={(e) => setTransportJobId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="po-id">Supplier PO ID (UUID)</Label>
            <Input
              id="po-id"
              value={supplierPoId}
              onChange={(e) => setSupplierPoId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="financial-impact">ผลกระทบทางการเงิน (บาท)</Label>
            <Input
              id="financial-impact"
              type="number"
              min="0"
              step="0.01"
              value={financialImpact}
              onChange={(e) => setFinancialImpact(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "กำลังเปิด..." : "เปิด Dispute"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
