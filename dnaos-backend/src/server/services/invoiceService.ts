import { getPrisma } from "../db/prisma.js";

async function generateInvoiceNo(date = new Date()) {
  const prisma = getPrisma();
  const year = date.getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  const seq = latest ? (Number(latest.invoiceNo.split("-").at(-1)) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

async function generateReceiptNo(date = new Date()) {
  const prisma = getPrisma();
  const year = date.getFullYear();
  const prefix = `RCP-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: "desc" },
    select: { receiptNo: true },
  });
  const seq = latest ? (Number(latest.receiptNo!.split("-").at(-1)) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

const invoiceInclude = {
  customerCompany: { select: { id: true, name: true, taxId: true, address: true } },
  customerOrder: { select: { id: true, orderNo: true } },
  project: { select: { id: true, projectNo: true, title: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
  payments: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function createInvoice(input: {
  customerCompanyId: string;
  customerOrderId?: string | null;
  projectId?: string | null;
  dueDate?: string | null;
  referenceNo?: string | null;
  recipientAddress?: string | null;
  notes?: string | null;
  vatRate?: number;
  items: { description: string; quantity: number; unit: string; unitPrice: number }[];
}) {
  const prisma = getPrisma();
  const vatRate = input.vatRate ?? 0.07;
  const items = input.items.map((item, i) => {
    const totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
    return { ...item, totalPrice, sortOrder: i };
  });
  const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const invoiceNo = await generateInvoiceNo();

  return prisma.invoice.create({
    data: {
      invoiceNo,
      customerCompanyId: input.customerCompanyId,
      customerOrderId: input.customerOrderId ?? null,
      projectId: input.projectId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      referenceNo: input.referenceNo ?? null,
      recipientAddress: input.recipientAddress ?? null,
      notes: input.notes ?? null,
      vatRate,
      subtotal,
      vatAmount,
      totalAmount,
      items: {
        create: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          sortOrder: it.sortOrder,
        })),
      },
    },
    include: invoiceInclude,
  });
}

export async function getInvoice(invoiceId: string) {
  const prisma = getPrisma();
  return prisma.invoice.findUnique({ where: { id: invoiceId }, include: invoiceInclude });
}

export async function listInvoices(filters?: {
  status?: string;
  customerCompanyId?: string;
  q?: string;
}) {
  const prisma = getPrisma();
  return prisma.invoice.findMany({
    where: {
      invoiceStatus: filters?.status as any,
      customerCompanyId: filters?.customerCompanyId,
      OR: filters?.q
        ? [
            { invoiceNo: { contains: filters.q, mode: "insensitive" } },
            { receiptNo: { contains: filters.q, mode: "insensitive" } },
            { customerCompany: { name: { contains: filters.q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      customerCompany: { select: { id: true, name: true } },
      customerOrder: { select: { id: true, orderNo: true } },
      project: { select: { id: true, projectNo: true, title: true } },
      _count: { select: { items: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function sendInvoice(invoiceId: string) {
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.invoiceStatus !== "DRAFT") throw new Error("เฉพาะ DRAFT เท่านั้นที่ส่งได้");
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { invoiceStatus: "SENT" },
    include: invoiceInclude,
  });
}

export async function voidInvoice(invoiceId: string) {
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.invoiceStatus === "PAID") throw new Error("ไม่สามารถยกเลิก invoice ที่ชำระแล้ว");
  if (inv.invoiceStatus === "VOID") throw new Error("invoice ถูกยกเลิกแล้ว");
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { invoiceStatus: "VOID" },
    include: invoiceInclude,
  });
}

export async function recordPayment(
  invoiceId: string,
  input: {
    paymentMethod: string;
    amount: number;
    paidAt: string;
    referenceNo?: string | null;
    bankRef?: string | null;
    slipUrl?: string | null;
    notes?: string | null;
  }
) {
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.invoiceStatus === "VOID") throw new Error("invoice ถูกยกเลิกแล้ว");
  if (inv.invoiceStatus === "PAID") throw new Error("invoice ชำระครบแล้ว");

  return prisma.payment.create({
    data: {
      invoiceId,
      paymentMethod: input.paymentMethod as any,
      amount: input.amount,
      paidAt: new Date(input.paidAt),
      referenceNo: input.referenceNo ?? null,
      bankRef: input.bankRef ?? null,
      slipUrl: input.slipUrl ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function confirmPayment(paymentId: string, adminId: string) {
  const prisma = getPrisma();
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.paymentStatus !== "PENDING") throw new Error("รายการนี้ไม่ได้อยู่ในสถานะ PENDING");

  await prisma.payment.update({
    where: { id: paymentId },
    data: { paymentStatus: "CONFIRMED", confirmedBy: adminId, confirmedAt: new Date() },
  });

  return recomputeInvoiceBalance(payment.invoiceId);
}

export async function rejectPayment(paymentId: string) {
  const prisma = getPrisma();
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.paymentStatus !== "PENDING") throw new Error("รายการนี้ไม่ได้อยู่ในสถานะ PENDING");

  await prisma.payment.update({
    where: { id: paymentId },
    data: { paymentStatus: "REJECTED" },
  });

  return recomputeInvoiceBalance(payment.invoiceId);
}

async function recomputeInvoiceBalance(invoiceId: string) {
  const prisma = getPrisma();
  const confirmedPayments = await prisma.payment.findMany({
    where: { invoiceId, paymentStatus: "CONFIRMED" },
    select: { amount: true },
  });
  const paidAmount = confirmedPayments.reduce((s, p) => s + Number(p.amount), 0);

  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const totalAmount = Number(inv.totalAmount);

  let invoiceStatus = inv.invoiceStatus;
  let receiptNo = inv.receiptNo;
  let receiptIssuedAt = inv.receiptIssuedAt;

  if (paidAmount >= totalAmount && totalAmount > 0) {
    invoiceStatus = "PAID";
    if (!receiptNo) {
      receiptNo = await generateReceiptNo();
      receiptIssuedAt = new Date();
    }
  } else if (paidAmount > 0) {
    invoiceStatus = "PARTIALLY_PAID";
  } else {
    invoiceStatus = inv.invoiceStatus === "DRAFT" ? "DRAFT" : "SENT";
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, invoiceStatus, receiptNo, receiptIssuedAt },
    include: invoiceInclude,
  });
}
