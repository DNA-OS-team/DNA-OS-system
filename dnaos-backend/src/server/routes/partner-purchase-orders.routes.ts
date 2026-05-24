import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { getCurrentLineSession } from "../services/authService.js";
import { supplierPurchaseOrderInclude } from "../services/procurementService.js";

const idParamsSchema = z.object({
  id: z.string().uuid()
});

const responseInputSchema = z.object({
  note: z.string().trim().optional().nullable()
});

export async function registerPartnerPurchaseOrderRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const session = await requireSupplierSession(request, reply);

    if (!session) {
      return reply;
    }

    const prisma = getPrisma();
    const supplierPurchaseOrders = await prisma.supplierPurchaseOrder.findMany({
      where: {
        supplierCompanyId: session.companyId
      },
      include: supplierPurchaseOrderInclude,
      orderBy: { createdAt: "desc" }
    });

    return { supplierPurchaseOrders };
  });

  app.get("/:id", async (request, reply) => {
    const session = await requireSupplierSession(request, reply);

    if (!session) {
      return reply;
    }

    const { id } = idParamsSchema.parse(request.params);
    const prisma = getPrisma();
    const supplierPurchaseOrder = await prisma.supplierPurchaseOrder.findFirst({
      where: {
        id,
        supplierCompanyId: session.companyId
      },
      include: supplierPurchaseOrderInclude
    });

    if (!supplierPurchaseOrder) {
      reply.code(404);
      return { error: "ไม่พบ Supplier PO" };
    }

    return { supplierPurchaseOrder };
  });

  app.post("/:id/confirm", async (request, reply) => {
    return updateSupplierResponse(request, reply, "CONFIRMED");
  });

  app.post("/:id/reject", async (request, reply) => {
    return updateSupplierResponse(request, reply, "REJECTED");
  });
}

async function updateSupplierResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  status: "CONFIRMED" | "REJECTED"
) {
  const session = await requireSupplierSession(request, reply);

  if (!session) {
    return reply;
  }

  const { id } = idParamsSchema.parse(request.params);
  const input = responseInputSchema.parse(request.body ?? {});
  const prisma = getPrisma();
  const supplierPurchaseOrder = await prisma.supplierPurchaseOrder.findFirst({
    where: {
      id,
      supplierCompanyId: session.companyId
    }
  });

  if (!supplierPurchaseOrder) {
    reply.code(404);
    return { error: "ไม่พบ Supplier PO" };
  }

  const updatedSupplierPurchaseOrder = await prisma.supplierPurchaseOrder.update({
    where: { id },
    data: {
      status,
      supplierRespondedAt: new Date(),
      supplierResponseNote: input.note || null
    },
    include: supplierPurchaseOrderInclude
  });

  return { supplierPurchaseOrder: updatedSupplierPurchaseOrder };
}

async function requireSupplierSession(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await getCurrentLineSession(request);

  if (
    session?.user.status === "ACTIVE" &&
    session.company.status === "ACTIVE" &&
    session.company.type === "SUPPLIER"
  ) {
    return session;
  }

  reply.code(401);
  return null;
}
