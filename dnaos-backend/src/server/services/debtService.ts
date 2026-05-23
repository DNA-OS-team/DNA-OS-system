import { getPrisma } from "../db/prisma.js";
import type { CollectionState } from "../../generated/prisma/enums.js";
import {
  calculateDebtStartDate,
  canTransition,
  refreshDebtSnapshot,
} from "../../core/engines/collectionEngine.js";

const debtInclude = {
  customerCompany: { select: { id: true, name: true, taxId: true, address: true } },
  collectionNotes: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: { createdByAdmin: { select: { id: true, username: true } } },
  },
} as const;

export async function getDebtList(filters?: { state?: CollectionState; q?: string }) {
  const prisma = getPrisma();
  return prisma.debtSnapshot.findMany({
    where: {
      collectionState: filters?.state,
      customerCompany: filters?.q
        ? { name: { contains: filters.q, mode: "insensitive" } }
        : undefined,
    },
    include: {
      customerCompany: { select: { id: true, name: true } },
      _count: { select: { collectionNotes: true } },
    },
    orderBy: [{ daysOverdue: "desc" }, { totalOutstanding: "desc" }],
  });
}

export async function getDebtDetail(customerCompanyId: string) {
  const prisma = getPrisma();
  const [snapshot, invoices] = await Promise.all([
    prisma.debtSnapshot.findUnique({
      where: { customerCompanyId },
      include: debtInclude,
    }),
    prisma.invoice.findMany({
      where: {
        customerCompanyId,
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID", "DRAFT"] },
      },
      include: {
        customerOrder: { select: { id: true, orderNo: true } },
        items: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);
  return { snapshot, invoices };
}

export async function recordFirstContact(customerCompanyId: string, contactedByAdminId: string, note: string) {
  const prisma = getPrisma();
  const now = new Date();
  const debtStartAt = calculateDebtStartDate(now);

  const snapshot = await prisma.debtSnapshot.upsert({
    where: { customerCompanyId },
    create: {
      customerCompanyId,
      firstContactAt: now,
      debtStartAt,
    },
    update: {
      firstContactAt: now,
      debtStartAt,
    },
  });

  await prisma.collectionNote.create({
    data: {
      customerCompanyId,
      note: note || "บันทึกการติดต่อลูกค้าครั้งแรก",
      collectionState: snapshot.collectionState,
      createdByAdminId: contactedByAdminId,
    },
  });

  return refreshDebtSnapshot(customerCompanyId);
}

export async function addCollectionNote(input: {
  customerCompanyId: string;
  adminId: string;
  note: string;
  promisedPayDate?: string | null;
}) {
  const prisma = getPrisma();
  const snapshot = await prisma.debtSnapshot.findUnique({
    where: { customerCompanyId: input.customerCompanyId },
    select: { collectionState: true },
  });
  if (!snapshot) throw new Error("ไม่พบข้อมูลหนี้ของลูกค้านี้");

  return prisma.collectionNote.create({
    data: {
      customerCompanyId: input.customerCompanyId,
      note: input.note,
      collectionState: snapshot.collectionState,
      promisedPayDate: input.promisedPayDate ? new Date(input.promisedPayDate) : null,
      createdByAdminId: input.adminId,
    },
  });
}

export async function manualStateTransition(input: {
  customerCompanyId: string;
  adminId: string;
  toState: CollectionState;
  note?: string;
}) {
  const prisma = getPrisma();
  const snapshot = await prisma.debtSnapshot.findUnique({
    where: { customerCompanyId: input.customerCompanyId },
    select: { collectionState: true },
  });
  if (!snapshot) throw new Error("ไม่พบข้อมูลหนี้");
  if (!canTransition(snapshot.collectionState, input.toState)) {
    throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${snapshot.collectionState} เป็น ${input.toState} ได้`);
  }

  const updated = await prisma.debtSnapshot.update({
    where: { customerCompanyId: input.customerCompanyId },
    data: { collectionState: input.toState },
  });

  if (input.note) {
    await prisma.collectionNote.create({
      data: {
        customerCompanyId: input.customerCompanyId,
        note: input.note,
        collectionState: input.toState,
        createdByAdminId: input.adminId,
      },
    });
  }

  return updated;
}

export async function checkAutoInvoiceTrigger(orderId: string): Promise<boolean> {
  const prisma = getPrisma();
  const items = await prisma.customerOrderItem.findMany({
    where: { customerOrderId: orderId },
    select: { totalTrips: true, deliveredTrips: true },
  });
  if (items.length === 0) return false;
  return items.every((item) => item.deliveredTrips >= item.totalTrips);
}

export async function incrementDeliveredTrips(customerOrderItemId: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.customerOrderItem.update({
    where: { id: customerOrderItemId },
    data: { deliveredTrips: { increment: 1 } },
  });
}

export async function createInvoiceFromCompletedTrips(orderId: string) {
  const prisma = getPrisma();

  const [existingInvoice, allTripsComplete] = await Promise.all([
    prisma.invoice.findFirst({ where: { customerOrderId: orderId, invoiceStatus: { not: "VOID" } } }),
    checkAutoInvoiceTrigger(orderId),
  ]);
  if (existingInvoice) throw new Error("มี invoice สำหรับ order นี้แล้ว");
  if (!allTripsComplete) throw new Error("ยังส่งของไม่ครบทุกเที่ยว");

  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    select: {
      customerCompanyId: true,
      customerCompany: { select: { address: true } },
      quotations: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { items: { select: { description: true, quantity: true, unit: true, unitPrice: true, totalPrice: true, sortOrder: true } } },
      },
      items: {
        select: {
          description: true,
          quantity: true,
          unit: true,
          sortOrder: true,
          productVariant: { select: { product: { select: { name: true } } } },
        },
      },
    },
  });
  if (!order) throw new Error("ไม่พบ order");

  const qtItems = order.quotations[0]?.items ?? [];
  const invoiceItems: { description: string; quantity: number; unit: string; unitPrice: number; totalPrice: number; sortOrder: number }[] =
    qtItems.map((qi, i) => ({
      description: qi.description ?? "",
      quantity: Number(qi.quantity),
      unit: qi.unit,
      unitPrice: Number(qi.unitPrice),
      totalPrice: Number(qi.totalPrice),
      sortOrder: i,
    }));

  if (invoiceItems.length === 0) {
    order.items.forEach((oi, i) => {
      invoiceItems.push({
        description: oi.description ?? oi.productVariant.product.name,
        quantity: Number(oi.quantity),
        unit: oi.unit,
        unitPrice: 0,
        totalPrice: 0,
        sortOrder: i,
      });
    });
  }

  const subtotal = invoiceItems.reduce((s, it) => s + it.totalPrice, 0);
  const vatRate = 0.07;
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  const seq = latest ? (Number(latest.invoiceNo.split("-").at(-1)) || 0) + 1 : 1;
  const invoiceNo = `${prefix}${String(seq).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      customerCompanyId: order.customerCompanyId,
      customerOrderId: orderId,
      invoiceStatus: "SENT",
      recipientAddress: order.customerCompany?.address ?? null,
      vatRate,
      subtotal,
      vatAmount,
      totalAmount,
      items: { create: invoiceItems },
    },
  });

  // Trigger debt snapshot refresh
  await refreshDebtSnapshot(order.customerCompanyId);

  return invoice;
}
