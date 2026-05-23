"use client";

import { CheckCircle, Plus, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  addDeliveryProof,
  deleteDeliveryProof,
  listDeliveryProofs,
  type DeliveryProof,
  type DeliveryProofType,
} from "./dispute-api";

const PROOF_TYPE_LABEL: Record<DeliveryProofType, string> = {
  PHOTO_BEFORE_LOADING: "รูปก่อนโหลดสินค้า",
  PHOTO_AFTER_LOADING: "รูปหลังโหลดสินค้า",
  PHOTO_AT_SITE: "รูปที่ไซต์งาน",
  SCALE_TICKET: "ใบชั่งน้ำหนัก",
  DELIVERY_NOTE: "ใบส่งสินค้า",
  CUSTOMER_SIGNATURE: "ลายเซ็นลูกค้า",
  GPS_LOCATION: "พิกัด GPS",
  OTHER: "อื่นๆ",
};

const PROOF_TYPES = Object.entries(PROOF_TYPE_LABEL) as [DeliveryProofType, string][];

type Props = { jobId: string };

export function DeliveryProofPanel({ jobId }: Props) {
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [hasRequired, setHasRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [proofType, setProofType] = useState<DeliveryProofType>("PHOTO_AT_SITE");
  const [fileUrl, setFileUrl] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const result = await listDeliveryProofs(jobId);
      setProofs(result.proofs);
      setHasRequired(result.hasRequiredProofs);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [jobId]);

  async function handleAdd() {
    setIsSaving(true);
    setError(null);
    try {
      await addDeliveryProof(jobId, {
        proofType,
        fileUrl: fileUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      setShowForm(false);
      setFileUrl("");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มหลักฐานไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(proofId: string) {
    try {
      await deleteDeliveryProof(jobId, proofId);
      await load();
    } catch {
      // silent
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          หลักฐานการส่งของ
          {!isLoading && (
            hasRequired ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="size-3" />
                ครบถ้วน
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" />
                ยังไม่ครบ
              </Badge>
            )
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus />
          เพิ่มหลักฐาน
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm ? (
          <div className="rounded-md border p-3 space-y-3">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-1.5">
              <Label className="text-xs">ประเภทหลักฐาน</Label>
              <Select
                value={proofType}
                onValueChange={(v) => v && setProofType(v as DeliveryProofType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROOF_TYPES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proof-url" className="text-xs">URL ไฟล์ (ไม่บังคับ)</Label>
              <Input
                id="proof-url"
                placeholder="https://..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proof-note" className="text-xs">หมายเหตุ</Label>
              <Textarea
                id="proof-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ประเภท</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead>เวลา</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && proofs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  ยังไม่มีหลักฐาน
                </TableCell>
              </TableRow>
            ) : null}
            {proofs.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {PROOF_TYPE_LABEL[p.proofType]}
                  {p.fileUrl ? (
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs text-blue-600 underline"
                    >
                      ไฟล์
                    </a>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.note ?? "-"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString("th-TH")}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(p.id)}
                    aria-label="ลบหลักฐาน"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
