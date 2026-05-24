import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";

const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0)
});

const productInputSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().optional().nullable(),
  defaultUnit: z.string().trim().min(1, "Default unit is required"),
  isActive: z.boolean().optional().default(true)
});

const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required"),
  unit: z.string().trim().min(1, "Variant unit is required"),
  specs: z.record(z.string(), z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true)
});

const listProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.enum(["all", "true", "false"]).optional().default("all")
});

const idParamsSchema = z.object({
  id: z.string().uuid()
});

const categoryParamsSchema = z.object({
  categoryId: z.string().uuid()
});

const variantParamsSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid()
});

export async function registerAdminProductRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/categories", async () => {
    const prisma = getPrisma();
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: [
        {
          sortOrder: "asc"
        },
        {
          name: "asc"
        }
      ]
    });

    return {
      categories: categories.map((category) => ({
        ...category,
        productCount: category._count.products,
        _count: undefined
      }))
    };
  });

  app.post("/categories", async (request, reply) => {
    const input = categoryInputSchema.parse(request.body);
    const prisma = getPrisma();
    const category = await prisma.productCategory.create({
      data: normalizeEmptyStrings(input)
    });

    await writeAuditLog({
      entityType: "product_category",
      entityId: category.id,
      action: "CREATE",
      newValue: category
    });

    reply.code(201);
    return { category };
  });

  app.patch("/categories/:categoryId", async (request, reply) => {
    const { categoryId } = categoryParamsSchema.parse(request.params);
    const input = categoryInputSchema.parse(request.body);
    const existingCategory = await getCategoryOr404(categoryId, reply);

    if (!existingCategory) {
      return reply;
    }

    const prisma = getPrisma();
    const category = await prisma.productCategory.update({
      where: { id: categoryId },
      data: normalizeEmptyStrings(input)
    });

    await writeAuditLog({
      entityType: "product_category",
      entityId: category.id,
      action: "UPDATE",
      oldValue: existingCategory,
      newValue: category
    });

    return { category };
  });

  app.get("/", async (request) => {
    const query = listProductsQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      where: {
        categoryId: query.categoryId,
        isActive:
          query.isActive === "all" ? undefined : query.isActive === "true",
        OR: query.q
          ? [
              {
                name: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                description: {
                  contains: query.q,
                  mode: "insensitive"
                }
              }
            ]
          : undefined
      },
      include: {
        category: true,
        _count: {
          select: {
            variants: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      products: products.map((product) => ({
        ...product,
        variantCount: product._count.variants,
        _count: undefined
      }))
    };
  });

  app.post("/", async (request, reply) => {
    const input = productInputSchema.parse(request.body);
    const category = await getCategoryOr404(input.categoryId, reply);

    if (!category) {
      return reply;
    }

    const prisma = getPrisma();
    const product = await prisma.product.create({
      data: normalizeEmptyStrings(input),
      include: {
        category: true
      }
    });

    await writeAuditLog({
      entityType: "product",
      entityId: product.id,
      action: "CREATE",
      newValue: product
    });

    reply.code(201);
    return { product };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const product = await getProductOr404(id, reply);

    if (!product) {
      return reply;
    }

    return { product };
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = productInputSchema.parse(request.body);
    const [existingProduct, category] = await Promise.all([
      getProductOr404(id, reply),
      getCategoryOr404(input.categoryId, reply)
    ]);

    if (!existingProduct || !category) {
      return reply;
    }

    const prisma = getPrisma();
    const product = await prisma.product.update({
      where: { id },
      data: normalizeEmptyStrings(input),
      include: {
        category: true
      }
    });

    await writeAuditLog({
      entityType: "product",
      entityId: product.id,
      action: "UPDATE",
      oldValue: existingProduct,
      newValue: product
    });

    return { product };
  });

  app.get("/:id/variants", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const product = await getProductOr404(id, reply);

    if (!product) {
      return reply;
    }

    const prisma = getPrisma();
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { product, variants };
  });

  app.post("/:id/variants", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = variantInputSchema.parse(request.body);
    const product = await getProductOr404(id, reply);

    if (!product) {
      return reply;
    }

    const prisma = getPrisma();
    const variant = await prisma.productVariant.create({
      data: {
        ...normalizeEmptyStrings(input),
        specs: input.specs as Prisma.InputJsonValue,
        productId: id
      }
    });

    await writeAuditLog({
      entityType: "product_variant",
      entityId: variant.id,
      action: "CREATE",
      newValue: variant
    });

    reply.code(201);
    return { variant };
  });

  app.patch("/:id/variants/:variantId", async (request, reply) => {
    const { id, variantId } = variantParamsSchema.parse(request.params);
    const input = variantInputSchema.parse(request.body);
    const product = await getProductOr404(id, reply);

    if (!product) {
      return reply;
    }

    const prisma = getPrisma();
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    });

    if (!existingVariant) {
      reply.code(404);
      return { error: "Product variant not found" };
    }

    const variant = await prisma.productVariant.update({
      where: {
        id: variantId
      },
      data: {
        ...normalizeEmptyStrings(input),
        specs: input.specs as Prisma.InputJsonValue
      }
    });

    await writeAuditLog({
      entityType: "product_variant",
      entityId: variant.id,
      action: "UPDATE",
      oldValue: existingVariant,
      newValue: variant
    });

    return { variant };
  });
}

async function getCategoryOr404(
  id: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const category = await prisma.productCategory.findUnique({
    where: { id }
  });

  if (!category) {
    reply.code(404);
    return null;
  }

  return category;
}

async function getProductOr404(
  id: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true
    }
  });

  if (!product) {
    reply.code(404);
    return null;
  }

  return product;
}

function normalizeEmptyStrings<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value
    ])
  ) as T;
}
