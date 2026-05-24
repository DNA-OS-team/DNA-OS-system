import { getPrisma } from "../db/prisma.js";
import { getAlertCounts, listOpenAlerts } from "./alertService.js";

const SIX_MONTHS_MS = 180 * 86_400_000;
const DAY_MS = 86_400_000;
const MONTH_MS = 30 * DAY_MS;

export async function getExecutiveMetrics() {
  const prisma = getPrisma();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - MONTH_MS);

  const [
    customerCount,
    supplierCount,
    productCount,
    projectCount,
    documentGroupCount,
    pendingPartnerProducts,
  ] = await Promise.all([
    prisma.company.count({ where: { type: "CUSTOMER" } }),
    prisma.company.count({ where: { type: "SUPPLIER" } }),
    prisma.product.count(),
    prisma.project.count(),
    prisma.documentGroup.count(),
    prisma.partnerProductSubmission.count({ where: { status: "PENDING" } }),
  ]);

  // Gross margin estimate: (revenue - COGS) / revenue for last 30 days
  const [revResult, cogsResult] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID", "PAID"] },
        createdAt: { gte: monthAgo },
      },
    }),
    prisma.supplierPurchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: ["FULFILLED", "BILLED", "PAID"] },
        updatedAt: { gte: monthAgo },
      },
    }),
  ]);

  const revenue = Number(revResult._sum.totalAmount ?? 0);
  const cogs = Number(cogsResult._sum.totalAmount ?? 0);
  const grossMarginPct = revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 100) : null;

  return {
    customers: customerCount,
    suppliers: supplierCount,
    products: productCount,
    projects: projectCount,
    documentGroups: documentGroupCount,
    pendingPartnerProducts,
    grossMarginPct,
    revenueLast30d: revenue,
    cogsLast30d: cogs,
  };
}

export async function getOperationMetrics() {
  const prisma = getPrisma();
  const now = new Date();

  const [
    newOrderCount,
    pendingPOCount,
    trucksNotAssignedCount,
    inventories,
  ] = await Promise.all([
    prisma.customerOrder.count({
      where: { createdAt: { gte: new Date(now.getTime() - DAY_MS) } },
    }),
    prisma.supplierPurchaseOrder.count({
      where: { status: { in: ["SENT", "ACKNOWLEDGED"] } },
    }),
    prisma.customerOrder.count({
      where: {
        status: { in: ["CONFIRMED", "PROCUREMENT"] },
        transportJobs: { none: {} },
      },
    }),
    prisma.supplierInventory.findMany({
      select: { availableQty: true, lowStockThreshold: true },
      take: 200,
    }),
  ]);

  const lowStockCount = inventories.filter((i) =>
    i.availableQty.lessThanOrEqualTo(i.lowStockThreshold)
  ).length;

  return {
    newOrders: newOrderCount,
    pendingPOs: pendingPOCount,
    trucksNotAssigned: trucksNotAssignedCount,
    lowStockItems: lowStockCount,
  };
}

export async function getFinanceMetrics() {
  const prisma = getPrisma();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - SIX_MONTHS_MS);

  const [
    unpaidInvoiceCount,
    overdueInvoiceCount,
    unreconciledCount,
    invoiceTotals,
    supplierPayableResult,
    fleetPayableResult,
  ] = await Promise.all([
    prisma.invoice.count({
      where: { invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] } },
    }),
    prisma.invoice.count({
      where: {
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
      },
    }),
    prisma.invoice.count({
      where: {
        invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] },
        payments: { some: { paymentStatus: "PENDING" } },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: { invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] } },
    }),
    prisma.supplierPurchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: "FULFILLED", updatedAt: { gte: sixMonthsAgo } },
    }),
    prisma.transportJob.aggregate({
      _sum: { transportCost: true },
      where: { status: "COMPLETED", updatedAt: { gte: sixMonthsAgo } },
    }),
  ]);

  const totalOutstanding =
    Number(invoiceTotals._sum.totalAmount ?? 0) -
    Number(invoiceTotals._sum.paidAmount ?? 0);

  return {
    unpaidInvoices: unpaidInvoiceCount,
    overdueInvoices: overdueInvoiceCount,
    paymentUnreconciled: unreconciledCount,
    totalOutstanding,
    supplierPayable: Number(supplierPayableResult._sum.totalAmount ?? 0),
    fleetPayable: Number(fleetPayableResult._sum.transportCost ?? 0),
  };
}

export async function getDashboardData() {
  const [executive, operation, finance, alertCounts, recentAlerts] = await Promise.all([
    getExecutiveMetrics(),
    getOperationMetrics(),
    getFinanceMetrics(),
    getAlertCounts(),
    listOpenAlerts({ take: 8 }),
  ]);

  return { executive, operation, finance, alerts: alertCounts, recentAlerts };
}
