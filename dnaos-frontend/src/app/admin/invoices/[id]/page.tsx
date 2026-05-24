import { InvoiceDetail } from "@/features/invoices/invoice-detail";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  return <InvoiceDetail invoiceId={id} />;
}
