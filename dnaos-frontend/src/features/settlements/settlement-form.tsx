"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  createSettlement,
  previewSettlement,
  type SettlementPartnerType,
  type SettlementPreview,
} from "./settlement-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CompanyOption = { id: string; name: string; isIndividual: boolean };

async function fetchPartners(type: SettlementPartnerType): Promise<CompanyOption[]> {
  const companyType = type === "SUPPLIER" ? "SUPPLIER" : "FLEET";
  const res = await fetch(`${API_BASE}/admin/customers?type=${companyType}`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json() as { customers?: CompanyOption[] };
  return data.customers ?? [];
}

export function SettlementForm() {
  const router = useRouter();
  const [partnerType, setPartnerType] = useState<SettlementPartnerType>("SUPPLIER");
  const [partners, setPartners] = useState<CompanyOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [periodFrom, setPeriodFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners(partnerType).then(setPartners);
    setSelectedPartnerId("");
    setPreview(null);
  }, [partnerType]);

  async function handlePreview() {
    if (!selectedPartnerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await previewSettlement(selectedPartnerId, partnerType);
      setPreview(data.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่สามารถดูตัวอย่างได้");
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartnerId || !preview) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await createSettlement({
        partnerCompanyId: selectedPartnerId,
        partnerType,
        periodFrom,
        periodTo,
        notes: notes.trim() || undefined,
      });
      router.push(`/admin/settlements/${data.settlement.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">สร้าง Settlement Batch</h1>
        <p className="text-sm text-muted-foreground">คำนวณยอดจ่ายให้ซัพพลายเออร์หรือผู้ขนส่ง</p>
      </div>

      {error && <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>ข้อมูล Settlement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>ประเภทคู่ค้า</Label>
              <Select value={partnerType} onValueChange={(v) => setPartnerType(v as SettlementPartnerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER">ซัพพลายเออร์</SelectItem>
                  <SelectItem value="FLEET">ผู้ขนส่ง (Fleet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>บริษัทคู่ค้า</Label>
              <Select value={selectedPartnerId} onValueChange={(v) => setSelectedPartnerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบริษัท" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.isIndividual ? "(บุคคลธรรมดา)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ตั้งแต่</Label>
                <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>ถึง</Label>
                <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <Button type="button" variant="outline" onClick={handlePreview} disabled={!selectedPartnerId || isLoading}>
              {isLoading ? "กำลังคำนวณ..." : "ดูตัวอย่าง"}
            </Button>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader><CardTitle>ตัวอย่างรายการ ({preview.items.length} รายการ)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {preview.items.length === 0 ? (
                <div className="text-muted-foreground text-sm">ไม่มีรายการที่รอรับเงิน</div>
              ) : (
                <>
                  <div className="divide-y">
                    {preview.items.map((item, i) => (
                      <div key={i} className="py-2 flex justify-between text-sm">
                        <div>
                          <Badge variant="outline" className="text-xs mr-2">
                            {item.refType === "PURCHASE_ORDER" ? "PO" : "Transport"}
                          </Badge>
                          {item.description}
                        </div>
                        <div className="text-right">
                          <div>{item.grossAmount.toLocaleString("th-TH")} บาท</div>
                          {item.whtAmount > 0 && (
                            <div className="text-xs text-destructive">WHT -{item.whtAmount.toLocaleString("th-TH")}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>ยอดสุทธิ</span>
                    <span className="text-green-700">{preview.netAmount.toLocaleString("th-TH")} บาท</span>
                  </div>
                  {preview.whtAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      หัก WHT 3%: {preview.whtAmount.toLocaleString("th-TH")} บาท
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !preview || preview.items.length === 0}
          >
            {isSubmitting ? "กำลังสร้าง..." : "สร้าง Settlement"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  );
}
