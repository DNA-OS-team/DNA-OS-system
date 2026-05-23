import type { CollectionState } from "../../generated/prisma/enums.js";
import { getPrisma } from "../../server/db/prisma.js";

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function computeAutoState(maxDaysOverdue: number, totalOutstanding: number): CollectionState {
  if (totalOutstanding <= 0) return "CLOSED";
  if (maxDaysOverdue <= 0) return "CURRENT";
  if (maxDaysOverdue <= 7) return "OVERDUE";
  if (maxDaysOverdue <= 30) return "WARNING";
  return "COLLECTION";
}

export async function refreshDebtSnapshot(customerCompanyId: string) {
  const prisma = getPrisma();
  const now = new Date();

  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      customerCompanyId,
      invoiceStatus: { in: ["SENT", "PARTIALLY_PAID", "DRAFT"] },
    },
    select: { id: true, totalAmount: true, paidAmount: true, dueDate: true, invoiceStatus: true },
  });

  const totalOutstanding = unpaidInvoices.reduce(
    (s, inv) => s + Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
    0
  );

  let maxDaysOverdue = 0;
  let overdueAmount = 0;

  for (const inv of unpaidInvoices) {
    if (!inv.dueDate) continue;
    const days = daysBetween(new Date(inv.dueDate), now);
    if (days > 0) {
      maxDaysOverdue = Math.max(maxDaysOverdue, days);
      overdueAmount += Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
    }
  }

  const existing = await prisma.debtSnapshot.findUnique({
    where: { customerCompanyId },
    select: { collectionState: true },
  });

  const preservedStates: CollectionState[] = ["PROMISED", "LEGAL", "PARTIAL"];
  const autoState = computeAutoState(maxDaysOverdue, totalOutstanding);
  const collectionState =
    existing && preservedStates.includes(existing.collectionState) && autoState !== "CLOSED"
      ? existing.collectionState
      : autoState;

  const snapshot = await prisma.debtSnapshot.upsert({
    where: { customerCompanyId },
    create: {
      customerCompanyId,
      collectionState,
      totalOutstanding,
      overdueAmount,
      daysOverdue: maxDaysOverdue,
      openInvoiceCount: unpaidInvoices.length,
      lastRefreshedAt: now,
    },
    update: {
      collectionState,
      totalOutstanding,
      overdueAmount,
      daysOverdue: maxDaysOverdue,
      openInvoiceCount: unpaidInvoices.length,
      lastRefreshedAt: now,
    },
    include: {
      customerCompany: { select: { id: true, name: true } },
    },
  });

  // Auto-create alert when newly overdue
  const wasNotOverdue = !existing || existing.collectionState === "CURRENT" || existing.collectionState === "CLOSED";
  if (wasNotOverdue && (collectionState === "OVERDUE" || collectionState === "WARNING" || collectionState === "COLLECTION")) {
    const overdueInvoice = unpaidInvoices.find((inv) => inv.dueDate && daysBetween(new Date(inv.dueDate), now) > 0);
    await prisma.alert.create({
      data: {
        customerCompanyId,
        invoiceId: overdueInvoice?.id ?? null,
        alertType: collectionState === "OVERDUE" ? "OVERDUE" : "WARNING",
        message: `ลูกค้ามียอดค้างชำระ ${totalOutstanding.toLocaleString()} บาท เกินกำหนดแล้ว ${maxDaysOverdue} วัน`,
      },
    });
  }

  return snapshot;
}

export async function refreshAllDebtSnapshots() {
  const prisma = getPrisma();
  const customers = await prisma.company.findMany({
    where: { invoices: { some: { invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] } } } },
    select: { id: true },
  });
  const results = await Promise.allSettled(
    customers.map((c) => refreshDebtSnapshot(c.id))
  );
  return {
    total: results.length,
    success: results.filter((r) => r.status === "fulfilled").length,
  };
}
