import { InvoiceForm } from "@/features/invoices/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">ออก Invoice ใหม่</h1>
        <p className="text-sm text-muted-foreground">สร้างใบแจ้งหนี้ให้ลูกค้า</p>
      </div>
      <InvoiceForm />
    </div>
  );
}
