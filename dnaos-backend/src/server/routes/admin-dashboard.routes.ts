import type { FastifyInstance } from "fastify";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";

export async function registerAdminDashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async () => {
    const prisma = getPrisma();
    const [
      customerCount,
      supplierCount,
      productCount,
      projectCount,
      documentGroupCount,
      pendingPartnerProductCount,
      pendingPartnerProducts,
      recentProjects,
      inventories
    ] = await Promise.all([
      prisma.company.count({
        where: {
          type: "CUSTOMER"
        }
      }),
      prisma.company.count({
        where: {
          type: "SUPPLIER"
        }
      }),
      prisma.product.count(),
      prisma.project.count(),
      prisma.documentGroup.count(),
      prisma.partnerProductSubmission.count({
        where: {
          status: "PENDING"
        }
      }),
      prisma.partnerProductSubmission.findMany({
        where: {
          status: "PENDING"
        },
        include: {
          supplierCompany: true,
          productVariant: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }),
      prisma.project.findMany({
        include: {
          customerCompany: true,
          customerSite: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }),
      prisma.supplierInventory.findMany({
        include: {
          supplierProduct: {
            include: {
              supplierCompany: true,
              productVariant: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 50
      })
    ]);

    const lowStockItems = inventories
      .filter((inventory) =>
        inventory.availableQty.lessThanOrEqualTo(inventory.lowStockThreshold)
      )
      .slice(0, 5);

    return {
      metrics: {
        customers: customerCount,
        suppliers: supplierCount,
        products: productCount,
        projects: projectCount,
        documentGroups: documentGroupCount,
        pendingPartnerProducts: pendingPartnerProductCount,
        lowStockItems: lowStockItems.length
      },
      pendingPartnerProducts,
      lowStockItems,
      recentProjects
    };
  });
}
