"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  createAdminSupplier,
  updateAdminSupplier,
  deleteAdminSupplier,
  type AdminSupplier,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from "./partner-product-api";

type View = "detail" | "edit" | "confirmDelete";

type Props = {
  supplier: AdminSupplier | null;
  onClose: () => void;
  onUpdated: (supplier: AdminSupplier) => void;
  onDeleted: (id: string) => void;
};

const STATUS_LABELS: Record<AdminSupplier["status"], string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ปิดใช้งาน",
  SUSPENDED: "ระงับ",
};

export function SupplierDialog({ supplier, onClose, onUpdated, onDeleted }: Props) {
  const [view, setView] = useState<View>("detail");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateSupplierInput>({});

  function openEdit() {
    if (!supplier) return;
    setForm({
      name: supplier.name,
      taxId: supplier.taxId ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      status: supplier.status,
    });
    setError(null);
    setView("edit");
  }

  function handleClose() {
    setView("detail");
    setError(null);
    onClose();
  }

  async function handleSave() {
    if (!supplier) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateAdminSupplier(supplier.id, {
        ...form,
        taxId: form.taxId || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      });
      onUpdated(result.supplier);
      setView("detail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!supplier) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAdminSupplier(supplier.id);
      onDeleted(supplier.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      setDeleting(false);
      setView("confirmDelete");
    }
  }

  return (
    <Dialog
      open={supplier !== null}
      onOpenChange={(open) => { if (!open) handleClose(); }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={view !== "confirmDelete"}>
        {supplier && view === "detail" && (
          <DetailView
            supplier={supplier}
            onEdit={openEdit}
            onDelete={() => { setError(null); setView("confirmDelete"); }}
          />
        )}

        {supplier && view === "edit" && (
          <EditView
            form={form}
            onChange={setForm}
            error={error}
            saving={saving}
            onSave={handleSave}
            onCancel={() => { setError(null); setView("detail"); }}
          />
        )}

        {supplier && view === "confirmDelete" && (
          <ConfirmDeleteView
            supplier={supplier}
            error={error}
            deleting={deleting}
            onConfirm={handleDelete}
            onCancel={() => { setError(null); setView("detail"); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────────────

function DetailView({
  supplier,
  onEdit,
  onDelete,
}: {
  supplier: AdminSupplier;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          {supplier.linePictureUrl ? (
            <Image
              src={supplier.linePictureUrl}
              alt={supplier.name}
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
              {supplier.name.charAt(0)}
            </div>
          )}
          <div>
            <DialogTitle>{supplier.name}</DialogTitle>
            {supplier.lineDisplayName && (
              <p className="text-xs text-muted-foreground">{supplier.lineDisplayName}</p>
            )}
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <InfoRow label="สถานะ">
          <Badge variant={supplier.status === "ACTIVE" ? "default" : "secondary"}>
            {STATUS_LABELS[supplier.status]}
          </Badge>
        </InfoRow>
        <InfoRow label="LINE">
          {supplier.lineDisplayName ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755]/10 px-2 py-0.5 text-xs font-medium text-[#06C755]">
              <span className="size-1.5 rounded-full bg-[#06C755]" />
              เชื่อมต่อแล้ว
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              ยังไม่เชื่อมต่อ
            </span>
          )}
        </InfoRow>
        <InfoRow label="เลขภาษี">{supplier.taxId ?? "-"}</InfoRow>
        <InfoRow label="เบอร์โทร">{supplier.phone ?? "-"}</InfoRow>
        <InfoRow label="อีเมล">{supplier.email ?? "-"}</InfoRow>
        <InfoRow label="ผู้ติดต่อ">{supplier.contactName ?? "-"}</InfoRow>
        <InfoRow label="เบอร์ผู้ติดต่อ">{supplier.contactPhone ?? "-"}</InfoRow>
        {supplier.address && (
          <InfoRow label="ที่อยู่" className="col-span-2">{supplier.address}</InfoRow>
        )}
        <InfoRow label="สินค้าในระบบ">{supplier.productCount} รายการ</InfoRow>
        <InfoRow label="Submission">{supplier.submissionCount} รายการ</InfoRow>
        <InfoRow label="สมัครเมื่อ">
          {new Date(supplier.createdAt).toLocaleDateString("th-TH", {
            year: "numeric", month: "short", day: "numeric",
          })}
        </InfoRow>
      </div>

      <DialogFooter>
        <Button variant="destructive" size="sm" onClick={onDelete} className="mr-auto">
          <Trash2 className="size-4" />
          ลบ
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          แก้ไข
        </Button>
      </DialogFooter>
    </>
  );
}

function InfoRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

// ─── Edit View ────────────────────────────────────────────────────────────────

function EditView({
  form,
  onChange,
  error,
  saving,
  onSave,
  onCancel,
}: {
  form: UpdateSupplierInput;
  onChange: (f: UpdateSupplierInput) => void;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  function set(key: keyof UpdateSupplierInput, value: string) {
    onChange({ ...form, [key]: value });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>แก้ไขข้อมูลซัพพลายเออร์</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">ชื่อบริษัท</Label>
            <Input
              id="edit-name"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">สถานะ</Label>
            <Select
              value={form.status ?? "ACTIVE"}
              onValueChange={(v) => { if (v) set("status", v); }}
            >
              <SelectTrigger id="edit-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                <SelectItem value="INACTIVE">ปิดใช้งาน</SelectItem>
                <SelectItem value="SUSPENDED">ระงับ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-taxId">เลขประจำตัวผู้เสียภาษี</Label>
            <Input
              id="edit-taxId"
              value={form.taxId ?? ""}
              onChange={(e) => set("taxId", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">เบอร์โทร</Label>
            <Input
              id="edit-phone"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-email">อีเมล</Label>
          <Input
            id="edit-email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-address">ที่อยู่</Label>
          <Textarea
            id="edit-address"
            rows={2}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Confirm Delete View ──────────────────────────────────────────────────────

function ConfirmDeleteView({
  supplier,
  error,
  deleting,
  onConfirm,
  onCancel,
}: {
  supplier: AdminSupplier;
  error: string | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <DialogTitle className="text-destructive">ยืนยันการลบ</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-2 text-sm">
        <p>
          คุณต้องการลบซัพพลายเออร์{" "}
          <span className="font-semibold">{supplier.name}</span> ออกจากระบบหรือไม่?
        </p>
        <p className="text-muted-foreground">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={deleting}>ยกเลิก</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
          {deleting ? "กำลังลบ..." : "ลบ"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Create Supplier Dialog ───────────────────────────────────────────────────

const EMPTY_CREATE: CreateSupplierInput = {
  name: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  status: "ACTIVE",
};

type CreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (supplier: AdminSupplier) => void;
};

export function CreateSupplierDialog({ open, onClose, onCreated }: CreateDialogProps) {
  const [form, setForm] = useState<CreateSupplierInput>(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setForm(EMPTY_CREATE);
    setError(null);
    onClose();
  }

  function set(key: keyof CreateSupplierInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อบริษัท");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createAdminSupplier({
        ...form,
        taxId: form.taxId || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      });
      onCreated(result.supplier);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มซัพพลายเออร์</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="create-name">ชื่อบริษัท <span className="text-destructive">*</span></Label>
              <Input
                id="create-name"
                placeholder="ชื่อบริษัทหรือร้านค้า"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-taxId">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                id="create-taxId"
                placeholder="0000000000000"
                value={form.taxId ?? ""}
                onChange={(e) => set("taxId", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-status">สถานะ</Label>
              <Select
                value={form.status ?? "ACTIVE"}
                onValueChange={(v) => { if (v) set("status", v); }}
              >
                <SelectTrigger id="create-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                  <SelectItem value="INACTIVE">ปิดใช้งาน</SelectItem>
                  <SelectItem value="SUSPENDED">ระงับ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-phone">เบอร์โทร</Label>
              <Input
                id="create-phone"
                placeholder="0xx-xxx-xxxx"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">อีเมล</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@example.com"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-address">ที่อยู่</Label>
            <Textarea
              id="create-address"
              rows={2}
              placeholder="ที่อยู่บริษัท"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "เพิ่มซัพพลายเออร์"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
