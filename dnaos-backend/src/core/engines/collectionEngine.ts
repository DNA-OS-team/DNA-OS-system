import type { CollectionState } from "../../generated/prisma/enums.js";
import { getPrisma } from "../../server/db/prisma.js";

const DEBT_GRACE_HOURS = 24;

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function calculateDebtStartDate(firstContactAt: Date): Date {
  return new Date(firstContactAt.getTime() + DEBT_GRACE_HOURS * 3_600_000);
}

export function isDebtStarted(debtStartAt: Date | null, now: Date): boolean {
  return debtStartAt !== null && debtStartAt <= now;
}

// Allowed manual transitions (admin-initiated state overrides)
const ALLOWED_TRANSITIONS: Record<CollectionState, CollectionState[]> = {
  CURRENT:    ["OVERDUE", "PROMISED", "CLOSED"],
  OVERDUE:    ["WARNING", "PROMISED", "PARTIAL", "LEGAL", "CLOSED"],
  WARNING:    ["COLLECTION", "PROMISED", "PARTIAL", "LEGAL", "CLOSED"],
  COLLECTION: ["PROMISED", "PARTIAL", "LEGAL", "CLOSED"],
  PROMISED:   ["CURRENT", "OVERDUE", "WARNING", "COLLECTION", "PARTIAL", "LEGAL", "CLOSED"],
  PARTIAL:    ["OVERDUE", "WARNING", "COLLECTION", "PROMISED", "LEGAL", "CLOSED"],
  LEGAL:      ["COLLECTION", "PARTIAL", "CLOSED"],
  CLOSED:     [],
};

export function canTransition(from: CollectionState, to: CollectionState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextActions(state: CollectionState): string[] {
  switch (state) {
    case "CURRENT":    return ["บันทึกการติดต่อ"];
    case "OVERDUE":    return ["บันทึกการติดต่อ", "บันทึกสัญญาชำระ", "ดำเนินคดี"];
    case "WARNING":    return ["บันทึกการติดต่อ", "บันทึกสัญญาชำระ", "ดำเนินคดี"];
    case "COLLECTION": return ["บันทึกสัญญาชำระ", "ดำเนินคดี"];
    case "PROMISED":   return ["ยืนยันการชำระ", "ดำเนินคดีถ้าผิดสัญญา"];
    case "PARTIAL":    return ["บันทึกส่วนที่เหลือ", "ดำเนินคดี"];
    case "LEGAL":      return ["บันทึกผลคดี"];
    case "CLOSED":     return [];
  }
}

function computeAutoState(debtAgeDays: number, totalOutstanding: number): CollectionState {
  if (totalOutstanding <= 0) return "CLOSED";
  if (debtAgeDays <= 0) return "CURRENT";
  if (debtAgeDays <= 7) return "OVERDUE";
  if (debtAgeDays <= 30) return "WARNING";
  return "COLLECTION";
}

export async function refreshDebtSnapshot(customerCompanyId: string) {
  const prisma = getPrisma();
  const now = new Date();

  const [unpaidInvoices, existing] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        customerCompanyId,
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID", "DRAFT"] },
      },
      select: { id: true, totalAmount: true, paidAmount: true, dueDate: true },
    }),
    prisma.debtSnapshot.findUnique({
      where: { customerCompanyId },
      select: { collectionState: true, firstContactAt: true, debtStartAt: true },
    }),
  ]);

  const totalOutstanding = unpaidInvoices.reduce(
    (s, inv) => s + Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
    0
  );

  let overdueAmount = 0;
  for (const inv of unpaidInvoices) {
    if (inv.dueDate && daysBetween(new Date(inv.dueDate), now) > 0) {
      overdueAmount += Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
    }
  }

  // Debt age is counted from debtStartAt (firstContactAt + 24h), not from dueDate
  const debtStartAt = existing?.debtStartAt ?? null;
  const debtAgeDays = isDebtStarted(debtStartAt, now) ? daysBetween(debtStartAt!, now) : 0;

  const preservedStates: CollectionState[] = ["PROMISED", "LEGAL", "PARTIAL"];
  const autoState = computeAutoState(debtAgeDays, totalOutstanding);
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
      daysOverdue: debtAgeDays,
      openInvoiceCount: unpaidInvoices.length,
      lastRefreshedAt: now,
    },
    update: {
      collectionState,
      totalOutstanding,
      overdueAmount,
      daysOverdue: debtAgeDays,
      openInvoiceCount: unpaidInvoices.length,
      lastRefreshedAt: now,
    },
    include: {
      customerCompany: { select: { id: true, name: true } },
    },
  });

  // Auto-create alert when transitioning into overdue state
  const wasNotOverdue = !existing || existing.collectionState === "CURRENT" || existing.collectionState === "CLOSED";
  if (wasNotOverdue && (collectionState === "OVERDUE" || collectionState === "WARNING" || collectionState === "COLLECTION")) {
    const overdueInvoice = unpaidInvoices.find((inv) => inv.dueDate && daysBetween(new Date(inv.dueDate), now) > 0);
    await prisma.alert.create({
      data: {
        customerCompanyId,
        invoiceId: overdueInvoice?.id ?? null,
        alertType: collectionState === "OVERDUE" ? "OVERDUE" : "WARNING",
        message: `ลูกค้ามียอดค้างชำระ ${totalOutstanding.toLocaleString()} บาท เริ่มนับหนี้แล้ว ${debtAgeDays} วัน`,
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
