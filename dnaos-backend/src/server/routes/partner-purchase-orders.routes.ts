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

const supplierProductInclude = {
  productVariant: {
    include: {
      product: { include: { category: { select: { name: true } } } },
    },
  },
  inventory: { select: { stockQty: true } },
} as const;

const createSupplierProductSchema = z.object({
  productVariantId: z.string().uuid(),
  price: z.coerce.number().positive(),
  sku: z.string().trim().optional().nullable(),
  minQty: z.coerce.number().min(0).optional(),
  serviceArea: z.string().trim().optional().nullable(),
  leadTimeHours: z.coerce.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

function mapSupplierProduct(sp: {
  id: string;
  sku: string | null;
  price: unknown;
  minQty: unknown;
  isAvailable: boolean;
  serviceArea: string | null;
  inventory?: { stockQty: unknown } | null;
  productVariant: {
    id: string;
    name: string;
    unit: string;
    product: {
      id: string;
      name: string;
      imageUrl?: string | null;
      category: { name: string };
    };
  };
}) {
  return {
    id: sp.id,
    sku: sp.sku,
    price: sp.price,
    minQty: sp.minQty,
    isAvailable: sp.isAvailable,
    serviceArea: sp.serviceArea,
    stockQty: sp.inventory?.stockQty ?? null,
    productVariant: {
      id: sp.productVariant.id,
      name: sp.productVariant.name,
      unit: sp.productVariant.unit,
      product: {
        id: sp.productVariant.product.id,
        name: sp.productVariant.product.name,
        imageUrl: sp.productVariant.product.imageUrl ?? null,
        category: sp.productVariant.product.category.name,
      },
    },
  };
}

export async function registerSupplierProductRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const session = await requireSupplierSession(request, reply);
    if (!session) return reply;

    const prisma = getPrisma();
    const products = await prisma.supplierProduct.findMany({
      where: { supplierCompanyId: session.companyId },
      include: supplierProductInclude,
      orderBy: { createdAt: "desc" },
    });

    return { products: products.map(mapSupplierProduct) };
  });

  app.get("/available-variants", async (request, reply) => {
    const session = await requireSupplierSession(request, reply);
    if (!session) return reply;

    const prisma = getPrisma();
    const listed = await prisma.supplierProduct.findMany({
      where: { supplierCompanyId: session.companyId },
      select: { productVariantId: true },
    });
    const listedIds = listed.map((r) => r.productVariantId);

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        ...(listedIds.length > 0 ? { id: { notIn: listedIds } } : {}),
      },
      include: {
        product: { include: { category: { select: { name: true } } } },
      },
      orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
    });

    return {
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        unit: v.unit,
        product: {
          id: v.product.id,
          name: v.product.name,
          imageUrl: (v.product as { imageUrl?: string | null }).imageUrl ?? null,
          category: v.product.category.name,
        },
      })),
    };
  });

  app.post("/", async (request, reply) => {
    const session = await requireSupplierSession(request, reply);
    if (!session) return reply;

    const input = createSupplierProductSchema.parse(request.body);
    const prisma = getPrisma();

    const existing = await prisma.supplierProduct.findFirst({
      where: { supplierCompanyId: session.companyId, productVariantId: input.productVariantId },
    });
    if (existing) {
      reply.code(409);
      return { error: "สินค้านี้มีอยู่ในรายการแล้ว" };
    }

    const sp = await prisma.supplierProduct.create({
      data: {
        supplierCompanyId: session.companyId,
        productVariantId: input.productVariantId,
        price: input.price,
        sku: input.sku ?? null,
        minQty: input.minQty ?? 0,
        serviceArea: input.serviceArea ?? null,
        leadTimeHours: input.leadTimeHours ?? 0,
        isAvailable: input.isAvailable ?? true,
      },
      include: supplierProductInclude,
    });

    reply.code(201);
    return { product: mapSupplierProduct(sp) };
  });
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
