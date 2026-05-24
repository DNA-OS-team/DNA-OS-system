import { Inngest } from "inngest";
import { env } from "../../config/env.js";
import { getPrisma } from "../db/prisma.js";
import {
  alertInvoiceOverdue,
  alertSupplierNotConfirmed,
  alertTruckNotAssigned,
  alertPaymentUnreconciled,
  createAlert,
} from "../services/alertService.js";

export const inngest = new Inngest({
  id: "dnaos",
  eventKey: env.INNGEST_EVENT_KEY ?? "local",
});

// ─── invoice.overdue.check ─────────────────────────────────────────────────────
export const checkOverdueInvoices = inngest.createFunction(
  { id: "invoice-overdue-check", name: "Invoice Overdue Check", triggers: [{ cron: "0 8 * * *" }] },
  async () => {
    const prisma = getPrisma();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
      },
      select: { id: true, invoiceNo: true, customerCompanyId: true },
    });

    await Promise.allSettled(
      overdueInvoices.map((inv) =>
        alertInvoiceOverdue(inv.id, inv.invoiceNo, inv.customerCompanyId)
      )
    );
    return { checked: overdueInvoices.length };
  }
);

// ─── daily.debt.snapshot ───────────────────────────────────────────────────────
export const dailyDebtSnapshot = inngest.createFunction(
  { id: "daily-debt-snapshot", name: "Daily Debt Snapshot", triggers: [{ cron: "0 7 * * *" }] },
  async () => {
    const prisma = getPrisma();
    const { refreshDebtSnapshot } = await import("../../core/engines/collectionEngine.js");

    const snapshots = await prisma.debtSnapshot.findMany({
      where: { collectionState: { notIn: ["CLOSED", "LEGAL"] } },
      select: { id: true },
    });

    await Promise.allSettled(snapshots.map((s) => refreshDebtSnapshot(s.id)));
    return { refreshed: snapshots.length };
  }
);

// ─── supplier.po.reminder ──────────────────────────────────────────────────────
export const supplierPoReminder = inngest.createFunction(
  { id: "supplier-po-reminder", name: "Supplier PO Reminder", triggers: [{ cron: "0 9 * * *" }] },
  async () => {
    const prisma = getPrisma();
    const cutoff = new Date(Date.now() - 48 * 3_600_000);

    const stalePOs = await prisma.supplierPurchaseOrder.findMany({
      where: { status: "SENT", updatedAt: { lt: cutoff } },
      select: { id: true, poNo: true },
    });

    await Promise.allSettled(
      stalePOs.map((po) => alertSupplierNotConfirmed(po.id, po.poNo))
    );
    return { reminded: stalePOs.length };
  }
);

// ─── fleet.job.reminder ────────────────────────────────────────────────────────
export const fleetJobReminder = inngest.createFunction(
  { id: "fleet-job-reminder", name: "Fleet Job Reminder", triggers: [{ cron: "0 10 * * *" }] },
  async () => {
    const prisma = getPrisma();
    const cutoff = new Date(Date.now() - 24 * 3_600_000);

    const unassigned = await prisma.customerOrder.findMany({
      where: {
        status: { in: ["CONFIRMED", "PROCUREMENT"] },
        createdAt: { lt: cutoff },
        transportJobs: { none: {} },
      },
      select: { id: true, orderNo: true },
    });

    await Promise.allSettled(
      unassigned.map((order) => alertTruckNotAssigned(order.id, order.orderNo))
    );
    return { reminded: unassigned.length };
  }
);

// ─── payment.reconciliation.run ────────────────────────────────────────────────
export const paymentReconciliationRun = inngest.createFunction(
  { id: "payment-reconciliation-run", name: "Payment Reconciliation Run", triggers: [{ cron: "0 11 * * *" }] },
  async () => {
    const prisma = getPrisma();

    const invoicesWithPending = await prisma.invoice.findMany({
      where: {
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] },
        payments: { some: { paymentStatus: "PENDING" } },
      },
      select: { id: true, invoiceNo: true, customerCompanyId: true },
    });

    await Promise.allSettled(
      invoicesWithPending.map((inv) =>
        alertPaymentUnreconciled(inv.id, inv.invoiceNo, inv.customerCompanyId)
      )
    );
    return { processed: invoicesWithPending.length };
  }
);

// ─── document.pdf.generate ─────────────────────────────────────────────────────
export const generatePdf = inngest.createFunction(
  { id: "document-pdf-generate", name: "Document PDF Generate", triggers: [{ event: "document/pdf.generate" }] },
  async ({ event }: { event: { data: { documentGroupId: string; documentType: string } } }) => {
    const { documentGroupId, documentType } = event.data;

    await createAlert({
      alertType: "PDF_GENERATION_FAILED",
      severity: "INFO",
      entityType: "DocumentGroup",
      entityId: documentGroupId,
      message: `PDF generation for ${documentType} queued (implementation pending)`,
    });

    return { documentGroupId, documentType, queued: true };
  }
);

// ─── All functions export ──────────────────────────────────────────────────────
export const allFunctions = [
  checkOverdueInvoices,
  dailyDebtSnapshot,
  supplierPoReminder,
  fleetJobReminder,
  paymentReconciliationRun,
  generatePdf,
];
