import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { getCurrentLineSession } from "../services/authService.js";
import { supplierPurchaseOrderInclude } from "../services/procurementService.js";

async function requireSupplier(request: FastifyRequest, reply: FastifyReply) {
  const session = await getCurrentLineSession(request);
  if (
    !session ||
    session.user.status !== "ACTIVE" ||
    session.company.status !== "ACTIVE" ||
    session.company.type !== "SUPPLIER"
  ) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  return session;
}

function fmtDecimal(v: unknown) {
  return Number(v);
}

const rejectSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผล"),
});

const poStatusSchema = z.object({
  status: z.enum(["ACKNOWLEDGED", "PARTIALLY_FULFILLED"]),
  note: z.string().trim().optional(),
});

const stockUpdateSchema = z.object({
  stockQty: z.coerce.number().min(0),
  note: z.string().trim().optional(),
});

export async function registerLiffSupplierRoutes(app: FastifyInstance) {
  // ── PO list ────────────────────────────────────────────────────────────────
  app.get("/po", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const q = (request.query as Record<string, string>).filter ?? "pending";
    const prisma = getPrisma();

    const where: Record<string, unknown> = { supplierCompanyId: session.companyId };
    if (q === "pending") where.status = { in: ["SENT", "ACKNOWLEDGED"] };

    const pos = await prisma.supplierPurchaseOrder.findMany({
      where,
      include: supplierPurchaseOrderInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { pos };
  });

  // ── PO detail ──────────────────────────────────────────────────────────────
  app.get("/po/:id", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const prisma = getPrisma();

    const po = await prisma.supplierPurchaseOrder.findFirst({
      where: { id, supplierCompanyId: session.companyId },
      include: supplierPurchaseOrderInclude,
    });

    if (!po) {
      reply.code(404);
      return { error: "ไม่พบ PO" };
    }

    return { po };
  });

  // ── Confirm PO ─────────────────────────────────────────────────────────────
  app.post("/po/:id/confirm", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const prisma = getPrisma();

    const po = await prisma.supplierPurchaseOrder.findFirst({
      where: { id, supplierCompanyId: session.companyId },
    });

    if (!po) {
      reply.code(404);
      return { error: "ไม่พบ PO" };
    }
    if (!["SENT", "ACKNOWLEDGED"].includes(po.status)) {
      reply.code(409);
      return { error: "ไม่สามารถยืนยัน PO ในสถานะนี้ได้" };
    }

    const updated = await prisma.supplierPurchaseOrder.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        supplierRespondedAt: new Date(),
      },
      include: supplierPurchaseOrderInclude,
    });

    return { po: updated };
  });

  // ── Reject PO ──────────────────────────────────────────────────────────────
  app.post("/po/:id/reject", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const { reason } = rejectSchema.parse(request.body);
    const prisma = getPrisma();

    const po = await prisma.supplierPurchaseOrder.findFirst({
      where: { id, supplierCompanyId: session.companyId },
    });

    if (!po) {
      reply.code(404);
      return { error: "ไม่พบ PO" };
    }
    if (!["SENT", "ACKNOWLEDGED"].includes(po.status)) {
      reply.code(409);
      return { error: "ไม่สามารถปฏิเสธ PO ในสถานะนี้ได้" };
    }

    const updated = await prisma.supplierPurchaseOrder.update({
      where: { id },
      data: {
        status: "REJECTED",
        supplierRespondedAt: new Date(),
        supplierResponseNote: reason,
      },
      include: supplierPurchaseOrderInclude,
    });

    return { po: updated };
  });

  // ── Update PO status (ACKNOWLEDGED / PARTIALLY_FULFILLED) ──────────────────
  app.post("/po/:id/status", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const { status, note } = poStatusSchema.parse(request.body);
    const prisma = getPrisma();

    const po = await prisma.supplierPurchaseOrder.findFirst({
      where: { id, supplierCompanyId: session.companyId },
    });

    if (!po) {
      reply.code(404);
      return { error: "ไม่พบ PO" };
    }

    const updated = await prisma.supplierPurchaseOrder.update({
      where: { id },
      data: {
        status,
        ...(note ? { supplierResponseNote: note } : {}),
      },
      include: supplierPurchaseOrderInclude,
    });

    return { po: updated };
  });

  // ── Inventory list ─────────────────────────────────────────────────────────
  app.get("/inventory", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const prisma = getPrisma();

    const products = await prisma.supplierProduct.findMany({
      where: { supplierCompanyId: session.companyId },
      include: {
        productVariant: {
          include: { product: { include: { category: { select: { name: true } } } } },
        },
        inventory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      products: products.map((sp) => ({
        id: sp.id,
        isAvailable: sp.isAvailable,
        productName: sp.productVariant.product.name,
        variantName: sp.productVariant.name,
        unit: sp.productVariant.unit,
        category: sp.productVariant.product.category.name,
        stockQty: sp.inventory ? fmtDecimal(sp.inventory.stockQty) : null,
        availableQty: sp.inventory ? fmtDecimal(sp.inventory.availableQty) : null,
        reservedQty: sp.inventory ? fmtDecimal(sp.inventory.reservedQty) : null,
        lowStockThreshold: sp.inventory ? fmtDecimal(sp.inventory.lowStockThreshold) : null,
        inventoryId: sp.inventory?.id ?? null,
      })),
    };
  });

  // ── Update stock qty ────────────────────────────────────────────────────────
  app.post("/inventory/:supplierProductId/stock", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const { supplierProductId } = request.params as { supplierProductId: string };
    const { stockQty, note } = stockUpdateSchema.parse(request.body);
    const prisma = getPrisma();

    const sp = await prisma.supplierProduct.findFirst({
      where: { id: supplierProductId, supplierCompanyId: session.companyId },
      include: { inventory: true },
    });

    if (!sp) {
      reply.code(404);
      return { error: "ไม่พบสินค้า" };
    }

    const newAvailable = Math.max(0, stockQty - fmtDecimal(sp.inventory?.reservedQty ?? 0));

    if (sp.inventory) {
      const beforeQty = fmtDecimal(sp.inventory.stockQty);
      await prisma.$transaction([
        prisma.supplierInventory.update({
          where: { id: sp.inventory.id },
          data: {
            stockQty,
            availableQty: newAvailable,
            updatedBy: session.userId,
          },
        }),
        prisma.supplierInventoryMovement.create({
          data: {
            supplierProductId,
            movementType: stockQty >= beforeQty ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
            qty: Math.abs(stockQty - beforeQty),
            beforeQty,
            afterQty: stockQty,
            sourceType: "LIFF_MANUAL",
            note: note ?? null,
            createdBy: session.userId,
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.supplierInventory.create({
          data: {
            supplierProductId,
            stockQty,
            availableQty: newAvailable,
            reservedQty: 0,
            unit: sp.productVariant?.unit ?? "",
            updatedBy: session.userId,
          },
        }),
        prisma.supplierInventoryMovement.create({
          data: {
            supplierProductId,
            movementType: "ADJUSTMENT_IN",
            qty: stockQty,
            beforeQty: 0,
            afterQty: stockQty,
            sourceType: "LIFF_MANUAL",
            note: note ?? null,
            createdBy: session.userId,
          },
        }),
      ]);
    }

    return { ok: true };
  });

  // ── Settlement / payment history ───────────────────────────────────────────
  app.get("/settlements", async (request, reply) => {
    const session = await requireSupplier(request, reply);
    if (!session) return reply;

    const prisma = getPrisma();

    const batches = await prisma.settlementBatch.findMany({
      where: { partnerCompanyId: session.companyId, partnerType: "SUPPLIER" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { batches };
  });
}
