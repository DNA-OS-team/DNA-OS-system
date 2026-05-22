import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import {
  createSupplierPODocument,
  supplierPurchaseOrderInclude
} from "../services/procurementService.js";

const supplierPoStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACKNOWLEDGED",
  "CONFIRMED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "BILLED",
  "PAID",
  "CANCELLED",
  "REJECTED"
]);

const listPurchaseOrdersQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z
    .union([z.literal("all"), supplierPoStatusSchema])
    .optional()
    .default("all")
});

const idParamsSchema = z.object({
  id: z.string().uuid()
});

const updateStatusSchema = z.object({
  status: supplierPoStatusSchema,
  supplierResponseNote: z.string().trim().optional().nullable()
});

export async function registerAdminProcurementRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/purchase-orders", async (request) => {
    const query = listPurchaseOrdersQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const supplierPurchaseOrders = await prisma.supplierPurchaseOrder.findMany({
      where: {
        status: query.status === "all" ? undefined : query.status,
        OR: query.q
          ? [
              {
                poNo: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                supplierCompany: {
                  name: {
                    contains: query.q,
                    mode: "insensitive"
                  }
                }
              },
              {
                customerOrder: {
                  orderNo: {
                    contains: query.q,
                    mode: "insensitive"
                  }
                }
              }
            ]
          : undefined
      },
      include: supplierPurchaseOrderInclude,
      orderBy: { createdAt: "desc" }
    });

    return { supplierPurchaseOrders };
  });

  app.get("/purchase-orders/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const prisma = getPrisma();
    const supplierPurchaseOrder = await prisma.supplierPurchaseOrder.findUnique({
      where: { id },
      include: supplierPurchaseOrderInclude
    });

    if (!supplierPurchaseOrder) {
      reply.code(404);
      return { error: "ไม่พบ Supplier PO" };
    }

    return { supplierPurchaseOrder };
  });

  app.post("/purchase-orders/:id/document", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);

    try {
      const supplierPurchaseOrder = await createSupplierPODocument(id);

      return { supplierPurchaseOrder };
    } catch (error) {
      reply.code(400);
      return {
        error:
          error instanceof Error
            ? error.message
            : "สร้างเอกสาร Supplier PO ไม่สำเร็จ"
      };
    }
  });

  app.patch("/purchase-orders/:id/status", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = updateStatusSchema.parse(request.body);
    const prisma = getPrisma();
    const supplierPurchaseOrder = await prisma.supplierPurchaseOrder.update({
      where: { id },
      data: {
        status: input.status,
        sentAt: input.status === "SENT" ? new Date() : undefined,
        supplierRespondedAt: ["ACKNOWLEDGED", "CONFIRMED", "REJECTED"].includes(
          input.status
        )
          ? new Date()
          : undefined,
        supplierResponseNote: input.supplierResponseNote || undefined
      },
      include: supplierPurchaseOrderInclude
    });

    return { supplierPurchaseOrder };
  });
}
