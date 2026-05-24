import type { FastifyInstance } from "fastify";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { getDashboardData } from "../services/dashboardService.js";

export async function registerAdminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async () => {
    const prisma = getPrisma();
    const now = new Date();

    const [dashData, pendingPartnerProducts, recentProjects, inventories] = await Promise.all([
      getDashboardData(),
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
    ]);

    const lowStockItems = inventories
      .filter((inv) => inv.availableQty.lessThanOrEqualTo(inv.lowStockThreshold))
      .slice(0, 5);

    const { executive, operation, finance, alerts, recentAlerts } = dashData;

    return {
      metrics: {
        // Executive
        customers: executive.customers,
        suppliers: executive.suppliers,
        products: executive.products,
        projects: executive.projects,
        documentGroups: executive.documentGroups,
        pendingPartnerProducts: executive.pendingPartnerProducts,
        grossMarginPct: executive.grossMarginPct,
        revenueLast30d: executive.revenueLast30d,
        // Operations
        newOrders: operation.newOrders,
        pendingPOs: operation.pendingPOs,
        trucksNotAssigned: operation.trucksNotAssigned,
        lowStockItems: lowStockItems.length,
        // Finance
        unpaidInvoices: finance.unpaidInvoices,
        overdueInvoices: finance.overdueInvoices,
        paymentUnreconciled: finance.paymentUnreconciled,
        totalOutstanding: finance.totalOutstanding,
        supplierPayable: finance.supplierPayable,
        fleetPayable: finance.fleetPayable,
        // Alerts
        alerts,
      },
      recentAlerts,
      pendingPartnerProducts,
      lowStockItems,
      recentProjects,
    };
  });
}
