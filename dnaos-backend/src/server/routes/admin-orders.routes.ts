import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { calculateBoq } from "../../core/engines/boqEngine.js";
import { calculatePricing } from "../../core/engines/pricingEngine.js";
import { calculateQuotation } from "../../core/engines/quotationEngine.js";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  generateDocumentGroupNo,
  generateDocumentNo
} from "../services/documentNumberingService.js";
import {
  createSupplierPOsFromOrder,
  supplierPurchaseOrderInclude
} from "../services/procurementService.js";

const orderItemInputSchema = z.object({
  productVariantId: z.string().uuid(),
  description: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required")
});

const orderInputSchema = z.object({
  projectId: z.string().uuid(),
  customerCompanyId: z.string().uuid(),
  customerSiteId: z.string().uuid(),
  status: z.enum(["DRAFT", "SUBMITTED", "PRICING", "QUOTED", "CONFIRMED", "PROCUREMENT", "CANCELLED"]).optional().default("DRAFT"),
  requestedDeliveryAt: z.string().datetime().optional().nullable(),
  deliveryNote: z.string().trim().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "At least one order item is required")
});

const listOrdersQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["all", "DRAFT", "SUBMITTED", "PRICING", "QUOTED", "CONFIRMED", "PROCUREMENT", "CANCELLED"]).optional().default("all")
});

const idParamsSchema = z.object({
  id: z.string().uuid()
});

export async function registerAdminOrderRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/options", async () => {
    const prisma = getPrisma();
    const [projects, productVariants] = await Promise.all([
      prisma.project.findMany({
        where: {
          status: {
            in: ["ACTIVE", "ON_HOLD"]
          }
        },
        include: {
          customerCompany: true,
          customerSite: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.productVariant.findMany({
        where: {
          isActive: true,
          product: {
            isActive: true
          }
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      })
    ]);

    return { projects, productVariants };
  });

  app.get("/", async (request) => {
    const query = listOrdersQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const orders = await prisma.customerOrder.findMany({
      where: {
        status: query.status === "all" ? undefined : query.status,
        OR: query.q
          ? [
              {
                orderNo: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                project: {
                  projectNo: {
                    contains: query.q,
                    mode: "insensitive"
                  }
                }
              },
              {
                customerCompany: {
                  name: {
                    contains: query.q,
                    mode: "insensitive"
                  }
                }
              }
            ]
          : undefined
      },
      include: {
        project: true,
        documentGroup: true,
        customerCompany: true,
        customerSite: true,
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      orders: orders.map((order) => ({
        ...order,
        itemCount: order._count.items,
        _count: undefined
      }))
    };
  });

  app.post("/", async (request, reply) => {
    const input = orderInputSchema.parse(request.body);
    const [project, customerSite] = await Promise.all([
      getProjectOr404(input.projectId, reply),
      getCustomerSiteOr404(input.customerCompanyId, input.customerSiteId, reply)
    ]);

    if (!project || !customerSite) {
      return reply;
    }

    if (
      project.customerCompanyId !== input.customerCompanyId ||
      project.customerSiteId !== input.customerSiteId
    ) {
      reply.code(400);
      return { error: "Project must match customer and site" };
    }

    const prisma = getPrisma();
    const orderNo = await generateDocumentNo(project.projectNo, "ORD");
    const groupNo = await generateDocumentGroupNo();
    const order = await prisma.$transaction(async (tx) => {
      const documentGroup = await tx.documentGroup.create({
        data: {
          groupNo,
          projectId: project.id,
          projectNo: project.projectNo,
          customerCompanyId: project.customerCompanyId,
          title: `Order ${orderNo}`,
          status: "OPEN"
        }
      });

      const createdOrder = await tx.customerOrder.create({
        data: {
          orderNo,
          projectId: project.id,
          documentGroupId: documentGroup.id,
          customerCompanyId: input.customerCompanyId,
          customerSiteId: input.customerSiteId,
          status: input.status,
          requestedDeliveryAt: input.requestedDeliveryAt
            ? new Date(input.requestedDeliveryAt)
            : null,
          deliveryNote: input.deliveryNote || null,
          items: {
            create: input.items.map((item, index) => ({
              productVariantId: item.productVariantId,
              description: item.description || null,
              quantity: item.quantity,
              unit: item.unit,
              sortOrder: index
            }))
          }
        },
        include: orderInclude
      });

      await tx.documentGroup.update({
        where: {
          id: documentGroup.id
        },
        data: {
          rootOrderId: createdOrder.id,
          rootOrderNo: createdOrder.orderNo
        }
      });

      await tx.documentReference.create({
        data: {
          documentGroupId: documentGroup.id,
          documentId: createdOrder.orderNo,
          relatedDocumentId: project.projectNo,
          relationType: "SOURCE"
        }
      });

      return createdOrder;
    });

    await writeAuditLog({
      companyId: order.customerCompanyId,
      entityType: "customer_order",
      entityId: order.id,
      action: "CREATE",
      newValue: order
    });

    reply.code(201);
    return { order };
  });

  app.get("/:id/pricing", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    const pricingSnapshot = await getLatestPricingSnapshot(id);

    return { pricingSnapshot };
  });

  app.post("/:id/pricing/run", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    if (order.items.length === 0) {
      reply.code(400);
      return { error: "Order ต้องมีรายการสินค้าอย่างน้อย 1 รายการก่อนคำนวณราคา" };
    }

    const prisma = getPrisma();
    const productVariantIds = [...new Set(order.items.map((item) => item.productVariantId))];
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: {
        productVariantId: {
          in: productVariantIds
        }
      },
      include: {
        inventory: true
      }
    });
    const candidatesByVariant = supplierProducts.reduce<
      Record<string, Array<{
        id: string;
        supplierCompanyId: string;
        productVariantId: string;
        price: number;
        isAvailable: boolean;
        availableQty: number;
      }>>
    >((result, supplierProduct) => {
      const candidates = result[supplierProduct.productVariantId] ?? [];
      candidates.push({
        id: supplierProduct.id,
        supplierCompanyId: supplierProduct.supplierCompanyId,
        productVariantId: supplierProduct.productVariantId,
        price: Number(supplierProduct.price),
        isAvailable: supplierProduct.isAvailable,
        availableQty: supplierProduct.inventory
          ? Number(supplierProduct.inventory.availableQty)
          : 0
      });
      result[supplierProduct.productVariantId] = candidates;

      return result;
    }, {});
    const pricing = calculatePricing({
      items: order.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        quantity: Number(item.quantity),
        unit: item.unit
      })),
      candidatesByVariant
    });

    const pricingSnapshot = await prisma.$transaction(async (tx) => {
      const snapshot = await tx.pricingSnapshot.create({
        data: {
          customerOrderId: order.id,
          status: pricing.status,
          totalSupplierCost: pricing.totalSupplierCost,
          totalSellPrice: pricing.totalSellPrice,
          totalMargin: pricing.totalMargin,
          marginPercent: pricing.marginPercent,
          items: {
            create: pricing.items.map((item) => ({
              customerOrderItemId: item.customerOrderItemId,
              productVariantId: item.productVariantId,
              supplierProductId: item.supplierProductId,
              supplierCompanyId: item.supplierCompanyId,
              quantity: item.quantity,
              unit: item.unit,
              supplierUnitCost: item.supplierUnitCost,
              supplierTotalCost: item.supplierTotalCost,
              sellUnitPrice: item.sellUnitPrice,
              sellTotalPrice: item.sellTotalPrice,
              marginAmount: item.marginAmount,
              marginPercent: item.marginPercent,
              isAvailable: item.isAvailable,
              hasEnoughStock: item.hasEnoughStock,
              warning: item.warning
            }))
          }
        },
        include: pricingSnapshotInclude
      });

      if (!["CONFIRMED", "CANCELLED"].includes(order.status)) {
        await tx.customerOrder.update({
          where: {
            id: order.id
          },
          data: {
            status: "PRICING"
          }
        });
      }

      return snapshot;
    });

    await writeAuditLog({
      companyId: order.customerCompanyId,
      entityType: "pricing_snapshot",
      entityId: pricingSnapshot.id,
      action: "UPDATE",
      newValue: pricingSnapshot
    });

    return { pricingSnapshot };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    return { order };
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = orderInputSchema.parse(request.body);
    const [existingOrder, project, customerSite] = await Promise.all([
      getOrderOr404(id, reply),
      getProjectOr404(input.projectId, reply),
      getCustomerSiteOr404(input.customerCompanyId, input.customerSiteId, reply)
    ]);

    if (!existingOrder || !project || !customerSite) {
      return reply;
    }

    if (
      project.customerCompanyId !== input.customerCompanyId ||
      project.customerSiteId !== input.customerSiteId
    ) {
      reply.code(400);
      return { error: "Project must match customer and site" };
    }

    const prisma = getPrisma();
    const order = await prisma.$transaction(async (tx) => {
      await tx.customerOrderItem.deleteMany({
        where: {
          customerOrderId: id
        }
      });

      return tx.customerOrder.update({
        where: {
          id
        },
        data: {
          projectId: project.id,
          customerCompanyId: input.customerCompanyId,
          customerSiteId: input.customerSiteId,
          status: input.status,
          requestedDeliveryAt: input.requestedDeliveryAt
            ? new Date(input.requestedDeliveryAt)
            : null,
          deliveryNote: input.deliveryNote || null,
          items: {
            create: input.items.map((item, index) => ({
              productVariantId: item.productVariantId,
              description: item.description || null,
              quantity: item.quantity,
              unit: item.unit,
              sortOrder: index
            }))
          }
        },
        include: orderInclude
      });
    });

    await writeAuditLog({
      companyId: order.customerCompanyId,
      entityType: "customer_order",
      entityId: order.id,
      action: existingOrder.status !== order.status ? "STATUS_CHANGE" : "UPDATE",
      oldValue: existingOrder,
      newValue: order
    });

    return { order };
  });

  app.get("/:id/boq", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    const prisma = getPrisma();
    const boqs = await prisma.boq.findMany({
      where: { customerOrderId: id },
      include: boqInclude,
      orderBy: { createdAt: "desc" }
    });

    return { boqs };
  });

  app.post("/:id/boq", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    if (order.items.length === 0) {
      reply.code(400);
      return { error: "Order ต้องมีรายการสินค้าอย่างน้อย 1 รายการก่อนสร้าง BOQ" };
    }

    const pricingSnapshot = await getLatestPricingSnapshot(id);

    if (!pricingSnapshot) {
      reply.code(400);
      return { error: "ต้องคำนวณราคาก่อนสร้าง BOQ" };
    }

    const blockedPricingItem = pricingSnapshot.items.find(
      (item) =>
        item.warning ||
        !item.supplierCompanyId ||
        !item.supplierProductId ||
        !item.isAvailable ||
        !item.hasEnoughStock
    );

    if (blockedPricingItem) {
      reply.code(400);
      return {
        error:
          "ต้องให้ระบบเลือกพาร์ทเนอร์ที่มีสินค้าอนุมัติ พร้อมขาย และ stock เพียงพอก่อนสร้าง BOQ"
      };
    }

    const boqInput = pricingSnapshot.items.map((item, index) => ({
      customerOrderItemId: item.customerOrderItemId,
      productVariantId: item.productVariantId,
      description: item.customerOrderItem?.description ?? null,
      quantity: Number(item.quantity),
      unit: item.unit,
      supplierUnitCost: Number(item.supplierUnitCost),
      supplierTotalCost: Number(item.supplierTotalCost),
      sellUnitPrice: Number(item.sellUnitPrice),
      sellTotalPrice: Number(item.sellTotalPrice),
      marginAmount: Number(item.marginAmount),
      marginPercent: Number(item.marginPercent),
      sortOrder: index
    }));

    const boqResult = calculateBoq({ items: boqInput });

    const prisma = getPrisma();
    const boqNo = await generateDocumentNo(order.project.projectNo, "BOQ");

    const boq = await prisma.$transaction(async (tx) => {
      const createdBoq = await tx.boq.create({
        data: {
          boqNo,
          documentGroupId: order.documentGroupId,
          customerOrderId: order.id,
          customerCompanyId: order.customerCompanyId,
          pricingSnapshotId: pricingSnapshot.id,
          status: "DRAFT",
          subtotal: boqResult.subtotal,
          vatRate: boqResult.vatRate,
          vatAmount: boqResult.vatAmount,
          totalAmount: boqResult.totalAmount,
          items: {
            create: boqResult.items.map((item) => ({
              customerOrderItemId: item.customerOrderItemId,
              productVariantId: item.productVariantId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              supplierUnitCost: item.supplierUnitCost,
              supplierTotalCost: item.supplierTotalCost,
              sellUnitPrice: item.sellUnitPrice,
              sellTotalPrice: item.sellTotalPrice,
              marginAmount: item.marginAmount,
              marginPercent: item.marginPercent,
              sortOrder: item.sortOrder
            }))
          }
        },
        include: boqInclude
      });

      await tx.documentReference.create({
        data: {
          documentGroupId: order.documentGroupId,
          documentId: boqNo,
          relatedDocumentId: order.orderNo,
          relationType: "GENERATED_FROM"
        }
      });

      return createdBoq;
    });

    await writeAuditLog({
      companyId: order.customerCompanyId,
      entityType: "boq",
      entityId: boq.id,
      action: "CREATE",
      newValue: boq
    });

    reply.code(201);
    return { boq };
  });

  app.get("/:id/quotation", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    const prisma = getPrisma();
    const quotations = await prisma.quotation.findMany({
      where: { customerOrderId: id },
      include: quotationInclude,
      orderBy: { createdAt: "desc" }
    });

    return { quotations };
  });

  app.post("/:id/quotation", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    if (order.items.length === 0) {
      reply.code(400);
      return { error: "Order ต้องมีรายการสินค้าอย่างน้อย 1 รายการก่อนสร้าง QT" };
    }

    const prisma = getPrisma();
    const latestBoq = await prisma.boq.findFirst({
      where: { customerOrderId: id, status: { in: ["DRAFT", "FINALIZED"] } },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    if (!latestBoq) {
      reply.code(400);
      return { error: "ต้องสร้าง BOQ ก่อนสร้าง QT" };
    }

    const creditProfile = await prisma.customerCreditProfile.findUnique({
      where: { customerCompanyId: order.customerCompanyId }
    });

    const qtResult = calculateQuotation({
      boqItems: latestBoq.items,
      customerCreditStatus: creditProfile?.creditStatus ?? null
    });

    const quotationNo = await generateDocumentNo(order.project.projectNo, "QT");

    const quotation = await prisma.$transaction(async (tx) => {
      const createdQt = await tx.quotation.create({
        data: {
          quotationNo,
          documentGroupId: order.documentGroupId,
          customerOrderId: order.id,
          customerCompanyId: order.customerCompanyId,
          boqId: latestBoq.id,
          status: "DRAFT",
          subtotal: qtResult.subtotal,
          vatRate: qtResult.vatRate,
          vatAmount: qtResult.vatAmount,
          totalAmount: qtResult.totalAmount,
          requiresApproval: qtResult.requiresApproval,
          approvalReason: qtResult.approvalReason,
          items: {
            create: qtResult.items.map((item) => ({
              customerOrderItemId: item.customerOrderItemId,
              productVariantId: item.productVariantId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              sortOrder: item.sortOrder
            }))
          }
        },
        include: quotationInclude
      });

      await tx.documentReference.create({
        data: {
          documentGroupId: order.documentGroupId,
          documentId: quotationNo,
          relatedDocumentId: latestBoq.boqNo,
          relationType: "GENERATED_FROM"
        }
      });

      if (!["CONFIRMED", "CANCELLED"].includes(order.status)) {
        await tx.customerOrder.update({
          where: { id: order.id },
          data: { status: "QUOTED" }
        });
      }

      return createdQt;
    });

    await writeAuditLog({
      companyId: order.customerCompanyId,
      entityType: "quotation",
      entityId: quotation.id,
      action: "CREATE",
      newValue: quotation
    });

    reply.code(201);
    return { quotation };
  });

  app.get("/:id/purchase-orders", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    const prisma = getPrisma();
    const supplierPurchaseOrders = await prisma.supplierPurchaseOrder.findMany({
      where: { customerOrderId: id },
      include: supplierPurchaseOrderInclude,
      orderBy: { createdAt: "desc" }
    });

    return { supplierPurchaseOrders };
  });

  app.post("/:id/purchase-orders", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const order = await getOrderOr404(id, reply);

    if (!order) {
      return reply;
    }

    try {
      const supplierPurchaseOrders = await createSupplierPOsFromOrder(id);

      reply.code(201);
      return { supplierPurchaseOrders };
    } catch (error) {
      reply.code(400);
      return {
        error:
          error instanceof Error
            ? error.message
            : "สร้าง Supplier PO ไม่สำเร็จ"
      };
    }
  });
}

const orderInclude = {
  project: true,
  documentGroup: true,
  customerCompany: true,
  customerSite: true,
  items: {
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

const pricingSnapshotInclude = {
  items: {
    include: {
      customerOrderItem: true,
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      },
      supplierProduct: {
        include: {
          supplierCompany: true,
          inventory: true
        }
      },
      supplierCompany: true
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
};

const boqInclude = {
  items: {
    include: {
      customerOrderItem: true,
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

const quotationInclude = {
  items: {
    include: {
      customerOrderItem: true,
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

async function getProjectOr404(
  projectId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project) {
    reply.code(404);
    return null;
  }

  return project;
}

async function getCustomerSiteOr404(
  customerCompanyId: string,
  customerSiteId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const customerSite = await prisma.customerSite.findFirst({
    where: {
      id: customerSiteId,
      customerCompanyId,
      customerCompany: {
        type: "CUSTOMER"
      }
    }
  });

  if (!customerSite) {
    reply.code(404);
    return null;
  }

  return customerSite;
}

async function getOrderOr404(
  id: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const order = await prisma.customerOrder.findUnique({
    where: {
      id
    },
    include: orderInclude
  });

  if (!order) {
    reply.code(404);
    return null;
  }

  return order;
}

async function getLatestPricingSnapshot(customerOrderId: string) {
  const prisma = getPrisma();

  return prisma.pricingSnapshot.findFirst({
    where: {
      customerOrderId
    },
    include: pricingSnapshotInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}
