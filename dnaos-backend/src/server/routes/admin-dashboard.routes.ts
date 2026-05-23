import type { FastifyInstance } from "fastify";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { getAlertCounts } from "../services/alertService.js";

export async function registerAdminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async () => {
    const prisma = getPrisma();

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86_400_000);

    const [
      customerCount,
      supplierCount,
      productCount,
      projectCount,
      documentGroupCount,
      pendingPartnerProductCount,
      pendingPartnerProducts,
      recentProjects,
      inventories,
      // Operations KPIs
      newOrderCount,
      pendingPOCount,
      trucksNotAssignedCount,
      // Finance KPIs
      unpaidInvoiceCount,
      overdueInvoiceCount,
      invoiceTotals,
      supplierPayableResult,
      fleetPayableResult,
      // Alert counts
      alertCounts,
    ] = await Promise.all([
      prisma.company.count({ where: { type: "CUSTOMER" } }),
      prisma.company.count({ where: { type: "SUPPLIER" } }),
      prisma.product.count(),
      prisma.project.count(),
      prisma.documentGroup.count(),
      prisma.partnerProductSubmission.count({ where: { status: "PENDING" } }),
      prisma.partnerProductSubmission.findMany({
        where: { status: "PENDING" },
        include: {
          supplierCompany: true,
          productVariant: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.project.findMany({
        include: { customerCompany: true, customerSite: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.supplierInventory.findMany({
        include: {
          supplierProduct: {
            include: {
              supplierCompany: true,
              productVariant: { include: { product: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      // New orders in last 24h
      prisma.customerOrder.count({
        where: { createdAt: { gte: new Date(now.getTime() - 86_400_000) } },
      }),
      // Supplier POs sent but not yet confirmed/acknowledged
      prisma.supplierPurchaseOrder.count({
        where: { status: { in: ["SENT", "ACKNOWLEDGED"] } },
      }),
      // Orders confirmed/in procurement with no transport job yet
      prisma.customerOrder.count({
        where: {
          status: { in: ["CONFIRMED", "PROCUREMENT"] },
          transportJobs: { none: {} },
        },
      }),
      // Unpaid invoices (SENT or PARTIALLY_PAID)
      prisma.invoice.count({
        where: { invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] } },
      }),
      // Overdue invoices
      prisma.invoice.count({
        where: {
          invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] },
          dueDate: { lt: now },
        },
      }),
      // Outstanding = sum(totalAmount) - sum(paidAmount) for open invoices
      prisma.invoice.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { invoiceStatus: { in: ["SENT", "PARTIALLY_PAID"] } },
      }),
      // Supplier payable: FULFILLED POs within 6 months
      prisma.supplierPurchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "FULFILLED",
          updatedAt: { gte: sixMonthsAgo },
        },
      }),
      // Fleet payable: COMPLETED jobs within 6 months
      prisma.transportJob.aggregate({
        _sum: { transportCost: true },
        where: {
          status: "COMPLETED",
          updatedAt: { gte: sixMonthsAgo },
        },
      }),
      getAlertCounts(),
    ]);

    const lowStockItems = inventories
      .filter((inv) => inv.availableQty.lessThanOrEqualTo(inv.lowStockThreshold))
      .slice(0, 5);

    const totalOutstanding =
      Number(invoiceTotals._sum.totalAmount ?? 0) -
      Number(invoiceTotals._sum.paidAmount ?? 0);

    return {
      metrics: {
        // Entity counts
        customers: customerCount,
        suppliers: supplierCount,
        products: productCount,
        projects: projectCount,
        documentGroups: documentGroupCount,
        pendingPartnerProducts: pendingPartnerProductCount,
        lowStockItems: lowStockItems.length,
        // Operations
        newOrders: newOrderCount,
        pendingPOs: pendingPOCount,
        trucksNotAssigned: trucksNotAssignedCount,
        // Finance
        unpaidInvoices: unpaidInvoiceCount,
        overdueInvoices: overdueInvoiceCount,
        totalOutstanding,
        supplierPayable: Number(supplierPayableResult._sum.totalAmount ?? 0),
        fleetPayable: Number(fleetPayableResult._sum.transportCost ?? 0),
        // Alerts
        alerts: alertCounts,
      },
      pendingPartnerProducts,
      lowStockItems,
      recentProjects,
    };
  });
}
