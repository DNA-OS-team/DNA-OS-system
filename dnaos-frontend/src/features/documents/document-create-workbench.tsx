"use client";

import { Eye, FilePlus2, Plus, Printer, Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
  createStandaloneDocument,
  getDocumentCreateOptions,
  listStandaloneDocuments,
  type CreateOption,
  type DocumentCreateOptions,
  type DocumentTypeCode,
  type PartnerOption,
  type StandaloneDocument,
} from "./document-standalone-api";

type DraftItem = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type Draft = {
  documentType: DocumentTypeCode;
  documentDate: string;
  customerCompanyId: string;
  partnerCompanyId: string;
  projectId: string;
  customerOrderId: string;
  referenceNo: string;
  recipientAddress: string;
  notes: string;
  vatRate: string;
  items: DraftItem[];
};

const documentTypeOptions: Array<{
  value: DocumentTypeCode;
  label: string;
  title: string;
}> = [
  { value: "QT", label: "QT — ใบเสนอราคา", title: "ใบเสนอราคา" },
  { value: "INV", label: "INV — ใบแจ้งหนี้", title: "ใบแจ้งหนี้" },
  { value: "RCP", label: "RCP — ใบเสร็จรับเงิน", title: "ใบเสร็จรับเงิน" },
  { value: "PV", label: "PV — ใบสำคัญจ่าย", title: "ใบสำคัญจ่าย" },
  { value: "PMT", label: "PMT — คำสั่งจ่ายเงิน", title: "คำสั่งจ่ายเงิน" },
  { value: "BOQ", label: "BOQ — ใบปริมาณงานและราคา", title: "ใบปริมาณงานและราคา" },
  { value: "PO", label: "PO — ใบสั่งซื้อ", title: "ใบสั่งซื้อ" },
  { value: "ORD", label: "ORD — ใบสั่งซื้อจากลูกค้า", title: "ใบสั่งซื้อจากลูกค้า" },
];

function getDocumentTitle(type: DocumentTypeCode) {
  return documentTypeOptions.find((t) => t.value === type)?.title ?? type;
}

function newItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unit: "หน่วย",
    unitPrice: "0",
  };
}

function defaultDraft(): Draft {
  return {
    documentType: "QT",
    documentDate: new Date().toISOString().slice(0, 10),
    customerCompanyId: "",
    partnerCompanyId: "",
    projectId: "",
    customerOrderId: "",
    referenceNo: "",
    recipientAddress: "",
    notes: "",
    vatRate: "7",
    items: [newItem()],
  };
}

function calcTotals(draft: Draft) {
  const subtotal = draft.items.reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vat = subtotal * ((Number(draft.vatRate) || 0) / 100);
  return { subtotal, vat, total: subtotal + vat };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00`));
}

export function DocumentCreateWorkbench() {
  const [options, setOptions] = useState<DocumentCreateOptions>({
    customers: [],
    partners: [],
    projects: [],
    orders: [],
  });
  const [savedDocs, setSavedDocs] = useState<StandaloneDocument[]>([]);
  const [draft, setDraft] = useState<Draft>(() => defaultDraft());
  const [previewDoc, setPreviewDoc] = useState<StandaloneDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDocumentCreateOptions(), listStandaloneDocuments()])
      .then(([opts, list]) => {
        if (!mounted) return;
        setOptions(opts);
        setSavedDocs(list.documents);
      })
      .catch((err: unknown) => {
        if (mounted) {
          setLoadError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCustomer = useMemo(
    () => options.customers.find((c) => c.id === draft.customerCompanyId) ?? null,
    [options.customers, draft.customerCompanyId]
  );

  const selectedPartner = useMemo(
    () => options.partners.find((p) => p.id === draft.partnerCompanyId) ?? null,
    [options.partners, draft.partnerCompanyId]
  );

  const selectedProject = useMemo(
    () => options.projects.find((p) => p.id === draft.projectId) ?? null,
    [options.projects, draft.projectId]
  );

  const filteredProjects = useMemo(() => {
    if (!draft.customerCompanyId) return options.projects;
    return options.projects.filter(
      (p) => p.customerCompanyId === draft.customerCompanyId
    );
  }, [options.projects, draft.customerCompanyId]);

  const filteredOrders = useMemo(() => {
    if (!draft.customerCompanyId) return options.orders;
    return options.orders.filter(
      (o) => o.customerCompanyId === draft.customerCompanyId
    );
  }, [options.orders, draft.customerCompanyId]);

  const totals = useMemo(() => calcTotals(draft), [draft]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setItem(id: string, key: keyof DraftItem, value: string) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    }));
  }

  function addItem() {
    setDraft((d) => ({ ...d, items: [...d.items, newItem()] }));
  }

  function removeItem(id: string) {
    setDraft((d) => ({
      ...d,
      items: d.items.length === 1 ? d.items : d.items.filter((it) => it.id !== id),
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const validItems = draft.items.filter((it) => it.description.trim());
    if (validItems.length === 0) {
      setFormError("กรุณาเพิ่มรายการสินค้าหรือบริการอย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStandaloneDocument({
        documentType: draft.documentType,
        documentDate: draft.documentDate,
        customerCompanyId: draft.customerCompanyId || null,
        partnerCompanyId: draft.partnerCompanyId || null,
        projectId: draft.projectId || null,
        customerOrderId: draft.customerOrderId || null,
        referenceNo: draft.referenceNo || null,
        recipientAddress:
          draft.recipientAddress || selectedCustomer?.address || null,
        notes: draft.notes || null,
        vatRate: Number(draft.vatRate) || 7,
        items: validItems.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit: it.unit,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      });

      const created = result.document;
      setSavedDocs((prev) => [created, ...prev]);
      setPreviewDoc(created);
      setDraft(defaultDraft());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "สร้างเอกสารไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewTotals = useMemo(() => {
    if (!previewDoc) return totals;
    return {
      subtotal: Number(previewDoc.subtotal),
      vat: Number(previewDoc.vatAmount),
      total: Number(previewDoc.totalAmount),
    };
  }, [previewDoc, totals]);

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #document-print-preview,
          #document-print-preview * { visibility: visible !important; }
          #document-print-preview {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">สร้างเอกสาร</h1>
          <p className="text-sm text-muted-foreground">
            เลือกลูกค้า / พาร์ทเนอร์จากระบบ กรอกรายการ แล้วบันทึกเพื่อออกเลขเอกสาร
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer />
          พิมพ์พรีวิว
        </Button>
      </div>

      {loadError ? (
        <Alert variant="destructive" className="no-print">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(620px,1.2fr)]">
        {/* Left: form */}
        <div className="no-print space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus2 className="size-5 text-muted-foreground" />
                ฟอร์มออกเอกสาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={formRef} className="space-y-4" onSubmit={onSubmit}>
                {formError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                ) : null}

                {/* Document type + date */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="ประเภทเอกสาร">
                    <Select
                      value={draft.documentType}
                      onValueChange={(v) => v && set("documentType", v as DocumentTypeCode)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypeOptions.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="วันที่เอกสาร" htmlFor="document-date">
                    <Input
                      id="document-date"
                      type="date"
                      value={draft.documentDate}
                      onChange={(e) => set("documentDate", e.target.value)}
                    />
                  </Field>
                </div>

                {/* Document number — read-only */}
                <div className="rounded-md border bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">เลขเอกสาร</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-muted-foreground">
                    จะสร้างอัตโนมัติเมื่อบันทึก
                  </p>
                </div>

                {/* Customer */}
                <Field label="ลูกค้า">
                  <Select
                    value={draft.customerCompanyId}
                    onValueChange={(v) => {
                      set("customerCompanyId", v ?? "");
                      set("projectId", "");
                      set("customerOrderId", "");
                      const customer = options.customers.find((c) => c.id === v);
                      if (customer?.address) {
                        set("recipientAddress", customer.address);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกลูกค้า (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer?.taxId ? (
                    <p className="text-xs text-muted-foreground">
                      เลขภาษี: {selectedCustomer.taxId}
                    </p>
                  ) : null}
                </Field>

                {/* Partner */}
                <Field label="พาร์ทเนอร์ / ซัพพลายเออร์">
                  <Select
                    value={draft.partnerCompanyId}
                    onValueChange={(v) => set("partnerCompanyId", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกพาร์ทเนอร์ (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({p.type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Project + Order */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="โปรเจกต์">
                    <Select
                      value={draft.projectId}
                      onValueChange={(v) => set("projectId", v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกโปรเจกต์" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.projectNo} — {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="เลข Order อ้างอิง">
                    <Select
                      value={draft.customerOrderId}
                      onValueChange={(v) => {
                        set("customerOrderId", v ?? "");
                        const order = options.orders.find((o) => o.id === v);
                        if (order) set("referenceNo", order.orderNo);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือก Order" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOrders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.orderNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Reference No */}
                <Field label="เลขอ้างอิง" htmlFor="reference-no">
                  <Input
                    id="reference-no"
                    value={draft.referenceNo}
                    onChange={(e) => set("referenceNo", e.target.value)}
                    placeholder="เช่น ORD-2026-0001"
                  />
                </Field>

                {/* Recipient address */}
                <Field label="ที่อยู่ผู้รับเอกสาร" htmlFor="recipient-address">
                  <Textarea
                    id="recipient-address"
                    value={draft.recipientAddress}
                    onChange={(e) => set("recipientAddress", e.target.value)}
                    rows={2}
                    placeholder="ที่อยู่จะถูกดึงอัตโนมัติเมื่อเลือกลูกค้า"
                  />
                </Field>

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>รายการในเอกสาร</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus />
                      เพิ่มรายการ
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {draft.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-lg border bg-background p-3 lg:grid-cols-[1fr_80px_90px_110px_auto]"
                      >
                        <Field label={`รายการ ${idx + 1}`} htmlFor={`item-${item.id}`}>
                          <Input
                            id={`item-${item.id}`}
                            value={item.description}
                            onChange={(e) => setItem(item.id, "description", e.target.value)}
                            placeholder="สินค้า งาน หรือบริการ"
                          />
                        </Field>
                        <Field label="จำนวน">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => setItem(item.id, "quantity", e.target.value)}
                          />
                        </Field>
                        <Field label="หน่วย">
                          <Input
                            value={item.unit}
                            onChange={(e) => setItem(item.id, "unit", e.target.value)}
                          />
                        </Field>
                        <Field label="ราคา/หน่วย">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => setItem(item.id, "unitPrice", e.target.value)}
                          />
                        </Field>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={draft.items.length === 1}
                            aria-label="ลบรายการ"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VAT + notes */}
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <Field label="VAT %" htmlFor="vat-rate">
                    <Input
                      id="vat-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.vatRate}
                      onChange={(e) => set("vatRate", e.target.value)}
                    />
                  </Field>
                  <Field label="หมายเหตุ" htmlFor="document-notes">
                    <Input
                      id="document-notes"
                      value={draft.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <FilePlus2 />
                    {isSubmitting ? "กำลังออกเอกสาร..." : "ออกเอกสาร"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(defaultDraft());
                      setPreviewDoc(null);
                      setFormError(null);
                    }}
                  >
                    ล้างฟอร์ม
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Saved documents list */}
          <Card>
            <CardHeader>
              <CardTitle>เอกสารที่ออกแล้ว</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขเอกสาร</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-right">พรีวิว</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        ยังไม่มีเอกสาร
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {savedDocs.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className={previewDoc?.id === doc.id ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <div className="font-mono text-sm font-medium">
                          {doc.documentNo}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.customerCompany?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatMoney(Number(doc.totalAmount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPreviewDoc(previewDoc?.id === doc.id ? null : doc)
                          }
                          aria-label="ดูพรีวิว"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right: preview */}
        <section className="space-y-3">
          <div className="no-print flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">พรีวิวเอกสาร</h2>
              <p className="text-sm text-muted-foreground">
                {previewDoc
                  ? `กำลังแสดง: ${previewDoc.documentNo}`
                  : "แสดงตามข้อมูลปัจจุบัน (ยังไม่ได้บันทึก)"}
              </p>
            </div>
            <Badge variant="outline">{previewDoc?.documentType ?? draft.documentType}</Badge>
          </div>

          {previewDoc ? (
            <SavedDocumentPreview doc={previewDoc} />
          ) : (
            <DraftPreview
              draft={draft}
              totals={totals}
              customer={selectedCustomer}
              partner={selectedPartner}
              projectNo={selectedProject?.projectNo ?? null}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor?: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SavedDocumentPreview({ doc }: { doc: StandaloneDocument }) {
  const subtotal = Number(doc.subtotal);
  const vat = Number(doc.vatAmount);
  const total = Number(doc.totalAmount);
  const vatPct = Math.round(Number(doc.vatRate) * 100);

  return (
    <DocumentPrintFrame
      documentType={doc.documentType}
      documentNo={doc.documentNo}
      documentDate={doc.documentDate.slice(0, 10)}
      customerName={doc.customerCompany?.name ?? ""}
      customerTaxId={doc.customerCompany?.taxId ?? ""}
      partnerName={doc.partnerCompany?.name ?? ""}
      projectNo={doc.project?.projectNo ?? ""}
      orderNo={doc.customerOrder?.orderNo ?? ""}
      referenceNo={doc.referenceNo ?? ""}
      recipientAddress={doc.recipientAddress ?? ""}
      notes={doc.notes ?? ""}
      vatPct={vatPct}
      subtotal={subtotal}
      vat={vat}
      total={total}
      items={(doc.items ?? []).map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      }))}
    />
  );
}

function DraftPreview({
  draft,
  totals,
  customer,
  partner,
  projectNo,
}: {
  draft: Draft;
  totals: { subtotal: number; vat: number; total: number };
  customer: CreateOption | null;
  partner: PartnerOption | null;
  projectNo: string | null;
}) {
  return (
    <DocumentPrintFrame
      documentType={draft.documentType}
      documentNo="(จะออกเลขอัตโนมัติ)"
      documentDate={draft.documentDate}
      customerName={customer?.name ?? ""}
      customerTaxId={customer?.taxId ?? ""}
      partnerName={partner?.name ?? ""}
      projectNo={projectNo ?? ""}
      orderNo=""
      referenceNo={draft.referenceNo}
      recipientAddress={draft.recipientAddress || customer?.address || ""}
      notes={draft.notes}
      vatPct={Number(draft.vatRate) || 0}
      subtotal={totals.subtotal}
      vat={totals.vat}
      total={totals.total}
      items={draft.items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 0,
          unit: it.unit,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        }))}
    />
  );
}

function DocumentPrintFrame({
  documentType,
  documentNo,
  documentDate,
  customerName,
  customerTaxId,
  partnerName,
  projectNo,
  orderNo,
  referenceNo,
  recipientAddress,
  notes,
  vatPct,
  subtotal,
  vat,
  total,
  items,
}: {
  documentType: DocumentTypeCode;
  documentNo: string;
  documentDate: string;
  customerName: string;
  customerTaxId: string;
  partnerName: string;
  projectNo: string;
  orderNo: string;
  referenceNo: string;
  recipientAddress: string;
  notes: string;
  vatPct: number;
  subtotal: number;
  vat: number;
  total: number;
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
}) {
  return (
    <div
      id="document-print-preview"
      className="min-h-[297mm] w-full overflow-hidden rounded-lg border bg-white p-8 text-slate-950 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-8 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xl font-bold">DNA OS Construction Platform</div>
          <div className="mt-1 text-sm text-slate-500">บริษัทกลาง / ผู้ออกเอกสาร</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{getDocumentTitle(documentType)}</div>
          <div className="mt-1 font-mono text-sm text-slate-600">{documentNo}</div>
          <div className="mt-1 text-sm text-slate-500">วันที่ {formatDate(documentDate)}</div>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid gap-6 border-b border-slate-200 py-6 text-sm md:grid-cols-2">
        <div>
          {customerName ? (
            <>
              <div className="text-xs font-semibold uppercase text-slate-500">ลูกค้า</div>
              <div className="mt-1 text-base font-semibold">{customerName}</div>
              {customerTaxId ? (
                <div className="text-xs text-slate-500">เลขภาษี: {customerTaxId}</div>
              ) : null}
              {recipientAddress ? (
                <div className="mt-2 whitespace-pre-line text-slate-600 text-xs">
                  {recipientAddress}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-slate-400 italic">ยังไม่ได้เลือกลูกค้า</div>
          )}
        </div>
        <div className="space-y-1">
          {referenceNo ? <PreviewMeta label="เลขอ้างอิง" value={referenceNo} /> : null}
          {orderNo ? <PreviewMeta label="Order" value={orderNo} /> : null}
          {projectNo ? <PreviewMeta label="โปรเจกต์" value={projectNo} /> : null}
          {partnerName ? <PreviewMeta label="พาร์ทเนอร์" value={partnerName} /> : null}
          <PreviewMeta label="รับชำระโดย" value="DNA OS Construction Platform" />
        </div>
      </div>

      {/* Items */}
      <div className="py-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50">
              <th className="w-10 px-2 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">รายการ</th>
              <th className="w-20 px-2 py-2 text-right font-semibold">จำนวน</th>
              <th className="w-16 px-2 py-2 text-left font-semibold">หน่วย</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">ราคา/หน่วย</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">รวม</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-slate-400 italic">
                  ยังไม่มีรายการ
                </td>
              </tr>
            ) : null}
            {items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-2 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2.5">{it.description}</td>
                <td className="px-2 py-2.5 text-right">{it.quantity.toLocaleString("th-TH")}</td>
                <td className="px-2 py-2.5 text-slate-600">{it.unit}</td>
                <td className="px-2 py-2.5 text-right">{formatMoney(it.unitPrice)}</td>
                <td className="px-2 py-2.5 text-right font-medium">{formatMoney(it.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + notes */}
      <div className="grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-[1fr_260px]">
        <div className="text-sm">
          <div className="font-semibold text-slate-700">หมายเหตุ</div>
          <div className="mt-1 whitespace-pre-line text-slate-500">{notes || "-"}</div>
        </div>
        <div className="space-y-1.5 text-sm">
          <PreviewAmount label="รวมก่อนภาษี" value={subtotal} />
          <PreviewAmount label={`VAT ${vatPct}%`} value={vat} />
          <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base font-bold">
            <span>ยอดสุทธิ</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Signature boxes */}
      <div className="mt-16 grid gap-8 text-center text-sm md:grid-cols-2">
        <SigBox label="ผู้จัดทำ / ผู้เสนอ" />
        <SigBox label="ผู้อนุมัติ / ผู้รับเอกสาร" />
      </div>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PreviewAmount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{formatMoney(value)}</span>
    </div>
  );
}

function SigBox({ label }: { label: string }) {
  return (
    <div>
      <div className="mx-auto h-10 w-52 border-b border-slate-400" />
      <div className="mt-2 text-slate-600">{label}</div>
      <div className="mt-1 text-xs text-slate-400">วันที่ ____ / ____ / ______</div>
    </div>
  );
}
