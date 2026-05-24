import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess, getCurrentAdminSession } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  setInventoryStock,
  setInventoryStockInTransaction
} from "../services/inventoryService.js";

const submissionInputSchema = z.object({
  supplierCompanyId: z.string().uuid(),
  productVariantId: z.string().uuid().optional().nullable(),
  requestedProductName: z.string().trim().min(1, "Product name is required"),
  requestedCategoryName: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  unit: z.string().trim().min(1, "Unit is required"),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  stockQty: z.coerce.number().min(0, "Stock quantity must be 0 or more"),
  minQty: z.coerce.number().min(0, "Minimum quantity must be 0 or more"),
  serviceArea: z.string().trim().optional().nullable()
});

const listSubmissionQuerySchema = z.object({
  status: z.enum(["all", "PENDING", "APPROVED", "REJECTED"]).optional().default("all"),
  q: z.string().trim().optional()
});

const idParamsSchema = z.object({
  id: z.string().uuid()
});

const reviewInputSchema = z.object({
  adminReviewNote: z.string().trim().optional().nullable()
});

const inventoryQuerySchema = z.object({
  q: z.string().trim().optional(),
  lowStockOnly: z.enum(["true", "false"]).optional().default("false")
});

const inventoryParamsSchema = z.object({
  supplierProductId: z.string().uuid()
});

const inventoryUpdateSchema = z.object({
  stockQty: z.coerce.number().min(0, "Stock quantity must be 0 or more"),
  lowStockThreshold: z.coerce.number().min(0).optional().default(0),
  note: z.string().trim().optional().nullable()
});

export async function registerAdminPartnerProductRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/suppliers", async () => {
    const prisma = getPrisma();
    const suppliers = await prisma.company.findMany({
      where: { type: "SUPPLIER" },
      include: {
        _count: {
          select: {
            supplierProducts: true,
            partnerProductSubmissions: true,
          },
        },
        members: {
          where: { status: "ACTIVE" },
          include: { user: { select: { name: true, phone: true, identities: { where: { provider: "LINE" }, select: { displayName: true, pictureUrl: true }, take: 1 } } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      suppliers: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        taxId: s.taxId,
        phone: s.phone,
        email: s.email,
        address: s.address,
        status: s.status,
        createdAt: s.createdAt,
        productCount: s._count.supplierProducts,
        submissionCount: s._count.partnerProductSubmissions,
        contactName: s.members[0]?.user.name ?? null,
        contactPhone: s.members[0]?.user.phone ?? null,
        lineDisplayName: s.members[0]?.user.identities[0]?.displayName ?? null,
        linePictureUrl: s.members[0]?.user.identities[0]?.pictureUrl ?? null,
      })),
    };
  });

  app.post("/suppliers", async (request, reply) => {
    const input = z.object({
      name: z.string().trim().min(1, "ชื่อบริษัทจำเป็น"),
      taxId: z.string().trim().optional().nullable(),
      phone: z.string().trim().optional().nullable(),
      email: z.string().trim().email().optional().nullable(),
      address: z.string().trim().optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
    }).parse(request.body);

    const prisma = getPrisma();
    const company = await prisma.company.create({
      data: {
        name: input.name,
        taxId: input.taxId || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        status: input.status,
        type: "SUPPLIER",
        isIndividual: false,
      },
      include: {
        _count: { select: { supplierProducts: true, partnerProductSubmissions: true } },
        members: {
          where: { status: "ACTIVE" },
          include: { user: { select: { name: true, phone: true, identities: { where: { provider: "LINE" }, select: { displayName: true, pictureUrl: true }, take: 1 } } } },
          take: 1,
        },
      },
    });

    reply.code(201);
    return {
      supplier: {
        id: company.id,
        name: company.name,
        taxId: company.taxId,
        phone: company.phone,
        email: company.email,
        address: company.address,
        status: company.status,
        createdAt: company.createdAt,
        productCount: company._count.supplierProducts,
        submissionCount: company._count.partnerProductSubmissions,
        contactName: company.members[0]?.user.name ?? null,
        contactPhone: company.members[0]?.user.phone ?? null,
        lineDisplayName: company.members[0]?.user.identities[0]?.displayName ?? null,
        linePictureUrl: company.members[0]?.user.identities[0]?.pictureUrl ?? null,
      },
    };
  });

  app.patch("/suppliers/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = z.object({
      name: z.string().trim().min(1).optional(),
      taxId: z.string().trim().optional().nullable(),
      phone: z.string().trim().optional().nullable(),
      email: z.string().trim().email().optional().nullable(),
      address: z.string().trim().optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    }).parse(request.body);

    const prisma = getPrisma();
    const company = await prisma.company.findFirst({ where: { id, type: "SUPPLIER" } });
    if (!company) {
      reply.code(404);
      return { error: "ไม่พบซัพพลายเออร์" };
    }

    const updated = await prisma.company.update({
      where: { id },
      data: input,
      include: {
        _count: { select: { supplierProducts: true, partnerProductSubmissions: true } },
        members: {
          where: { status: "ACTIVE" },
          include: { user: { select: { name: true, phone: true, identities: { where: { provider: "LINE" }, select: { displayName: true, pictureUrl: true }, take: 1 } } } },
          take: 1,
        },
      },
    });

    return {
      supplier: {
        id: updated.id,
        name: updated.name,
        taxId: updated.taxId,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        status: updated.status,
        createdAt: updated.createdAt,
        productCount: updated._count.supplierProducts,
        submissionCount: updated._count.partnerProductSubmissions,
        contactName: updated.members[0]?.user.name ?? null,
        contactPhone: updated.members[0]?.user.phone ?? null,
        lineDisplayName: updated.members[0]?.user.identities[0]?.displayName ?? null,
        linePictureUrl: updated.members[0]?.user.identities[0]?.pictureUrl ?? null,
      },
    };
  });

  app.delete("/suppliers/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const prisma = getPrisma();

    const company = await prisma.company.findFirst({
      where: { id, type: "SUPPLIER" },
      include: { _count: { select: { supplierProducts: true, partnerProductSubmissions: true } } },
    });

    if (!company) {
      reply.code(404);
      return { error: "ไม่พบซัพพลายเออร์" };
    }

    if (company._count.supplierProducts > 0 || company._count.partnerProductSubmissions > 0) {
      reply.code(409);
      return { error: "ไม่สามารถลบซัพพลายเออร์ที่มีสินค้าหรือ Submission ในระบบ กรุณาเปลี่ยนสถานะเป็น 'ปิดใช้งาน' แทน" };
    }

    await prisma.$transaction([
      prisma.appSession.deleteMany({ where: { companyId: id } }),
      prisma.companyMember.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    return { ok: true };
  });

  app.get("/partner-products/options", async () => {
    const prisma = getPrisma();
    const [suppliers, productVariants] = await Promise.all([
      prisma.company.findMany({
        where: {
          type: "SUPPLIER",
          status: "ACTIVE"
        },
        orderBy: {
          name: "asc"
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

    return { suppliers, productVariants };
  });

  app.get("/partner-products", async (request) => {
    const query = listSubmissionQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const submissions = await prisma.partnerProductSubmission.findMany({
      where: {
        status: query.status === "all" ? undefined : query.status,
        OR: query.q
          ? [
              {
                requestedProductName: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                requestedCategoryName: {
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
              }
            ]
          : undefined
      },
      include: {
        supplierCompany: true,
        productVariant: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        supplierProduct: true,
        reviewer: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { submissions };
  });

  app.post("/partner-products", async (request, reply) => {
    const input = submissionInputSchema.parse(request.body);
    const [supplier, productVariant] = await Promise.all([
      getSupplierOr404(input.supplierCompanyId, reply),
      input.productVariantId ? getProductVariantOr404(input.productVariantId, reply) : null
    ]);

    if (!supplier || (input.productVariantId && !productVariant)) {
      return reply;
    }

    const prisma = getPrisma();
    const submission = await prisma.partnerProductSubmission.create({
      data: {
        supplierCompanyId: input.supplierCompanyId,
        productVariantId: input.productVariantId ?? null,
        requestedProductName: input.requestedProductName,
        requestedCategoryName: input.requestedCategoryName || null,
        description: input.description || null,
        unit: input.unit,
        price: input.price,
        stockQty: input.stockQty,
        minQty: input.minQty,
        serviceArea: input.serviceArea || null
      },
      include: {
        supplierCompany: true,
        productVariant: true
      }
    });

    await writeAuditLog({
      companyId: submission.supplierCompanyId,
      entityType: "partner_product_submission",
      entityId: submission.id,
      action: "CREATE",
      newValue: submission
    });

    reply.code(201);
    return { submission };
  });

  app.get("/partner-products/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const submission = await getSubmissionOr404(id, reply);

    if (!submission) {
      return reply;
    }

    return { submission };
  });

  app.post("/partner-products/:id/approve", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = reviewInputSchema.parse(request.body);
    const submission = await getSubmissionOr404(id, reply);

    if (!submission) {
      return reply;
    }

    if (submission.status !== "PENDING") {
      reply.code(409);
      return { error: "Only pending submissions can be approved" };
    }

    if (!submission.productVariantId) {
      reply.code(400);
      return { error: "Product variant is required before approval" };
    }

    const adminSession = await getCurrentAdminSession(request);
    const reviewerId = adminSession?.admin.id ?? null;
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (tx) => {
      const supplierProduct = await tx.supplierProduct.create({
        data: {
          supplierCompanyId: submission.supplierCompanyId,
          productVariantId: submission.productVariantId as string,
          sku: null,
          price: submission.price,
          minQty: submission.minQty,
          serviceArea: submission.serviceArea,
          leadTimeHours: 0,
          isAvailable: true
        }
      });

      await tx.priceHistory.create({
        data: {
          entityType: "supplier_product",
          entityId: supplierProduct.id,
          oldPrice: null,
          newPrice: submission.price,
          changedBy: null,
          reason: "Partner product submission approved",
          effectiveAt: new Date()
        }
      });

      const inventoryResult = await setInventoryStockInTransaction(tx, {
        supplierProductId: supplierProduct.id,
        stockQty: submission.stockQty,
        unit: submission.unit,
        lowStockThreshold: 0,
        movementType: "INITIAL",
        sourceType: "partner_product_submission",
        sourceId: submission.id,
        note: "Initial stock from approved product submission",
        updatedBy: null
      });

      const reviewedSubmission = await tx.partnerProductSubmission.update({
        where: {
          id: submission.id
        },
        data: {
          status: "APPROVED",
          adminReviewNote: input.adminReviewNote || null,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          supplierProductId: supplierProduct.id
        },
        include: {
          supplierCompany: true,
          productVariant: true,
          supplierProduct: true,
          reviewer: true
        }
      });

      return {
        submission: reviewedSubmission,
        supplierProduct,
        inventory: inventoryResult.inventory,
        movement: inventoryResult.movement
      };
    });

    await writeAuditLog({
      companyId: result.submission.supplierCompanyId,
      entityType: "partner_product_submission",
      entityId: result.submission.id,
      action: "APPROVE",
      oldValue: submission,
      newValue: result.submission
    });

    return result;
  });

  app.post("/partner-products/:id/reject", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = reviewInputSchema.parse(request.body);
    const submission = await getSubmissionOr404(id, reply);

    if (!submission) {
      return reply;
    }

    if (submission.status !== "PENDING") {
      reply.code(409);
      return { error: "Only pending submissions can be rejected" };
    }

    const adminSession = await getCurrentAdminSession(request);
    const prisma = getPrisma();
    const reviewedSubmission = await prisma.partnerProductSubmission.update({
      where: {
        id
      },
      data: {
        status: "REJECTED",
        adminReviewNote: input.adminReviewNote || null,
        reviewedBy: adminSession?.admin.id ?? null,
        reviewedAt: new Date()
      },
      include: {
        supplierCompany: true,
        productVariant: true,
        supplierProduct: true,
        reviewer: true
      }
    });

    await writeAuditLog({
      companyId: reviewedSubmission.supplierCompanyId,
      entityType: "partner_product_submission",
      entityId: reviewedSubmission.id,
      action: "REJECT",
      oldValue: submission,
      newValue: reviewedSubmission
    });

    return { submission: reviewedSubmission };
  });

  app.get("/supplier-inventory", async (request) => {
    const query = inventoryQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const inventories = await prisma.supplierInventory.findMany({
      where: {
        supplierProduct: {
          OR: query.q
            ? [
                {
                  supplierCompany: {
                    name: {
                      contains: query.q,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  productVariant: {
                    name: {
                      contains: query.q,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  productVariant: {
                    product: {
                      name: {
                        contains: query.q,
                        mode: "insensitive"
                      }
                    }
                  }
                }
              ]
            : undefined
        }
      },
      include: {
        supplierProduct: {
          include: {
            supplierCompany: true,
            productVariant: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            },
            inventoryMovements: {
              take: 5,
              orderBy: {
                createdAt: "desc"
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return {
      inventories:
        query.lowStockOnly === "true"
          ? inventories.filter((inventory) =>
              inventory.availableQty.lessThanOrEqualTo(inventory.lowStockThreshold)
            )
          : inventories
    };
  });

  app.patch("/supplier-inventory/:supplierProductId", async (request, reply) => {
    const { supplierProductId } = inventoryParamsSchema.parse(request.params);
    const input = inventoryUpdateSchema.parse(request.body);
    const supplierProduct = await getSupplierProductOr404(supplierProductId, reply);

    if (!supplierProduct) {
      return reply;
    }

    const result = await setInventoryStock({
      supplierProductId,
      stockQty: input.stockQty,
      unit: supplierProduct.productVariant.unit,
      lowStockThreshold: input.lowStockThreshold,
      movementType: "ADJUST",
      sourceType: "admin_stock_update",
      sourceId: supplierProductId,
      note: input.note || null,
      updatedBy: null
    });

    await writeAuditLog({
      companyId: supplierProduct.supplierCompanyId,
      entityType: "supplier_inventory",
      entityId: result.inventory.id,
      action: "UPDATE",
      newValue: {
        inventory: result.inventory,
        movement: result.movement
      }
    });

    return result;
  });
}

async function getSupplierOr404(
  supplierCompanyId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const supplier = await prisma.company.findFirst({
    where: {
      id: supplierCompanyId,
      type: "SUPPLIER"
    }
  });

  if (!supplier) {
    reply.code(404);
    return null;
  }

  return supplier;
}

async function getProductVariantOr404(
  productVariantId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const productVariant = await prisma.productVariant.findUnique({
    where: {
      id: productVariantId
    }
  });

  if (!productVariant) {
    reply.code(404);
    return null;
  }

  return productVariant;
}

async function getSubmissionOr404(
  id: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const submission = await prisma.partnerProductSubmission.findUnique({
    where: {
      id
    },
    include: {
      supplierCompany: true,
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      },
      supplierProduct: true,
      reviewer: true
    }
  });

  if (!submission) {
    reply.code(404);
    return null;
  }

  return submission;
}

async function getSupplierProductOr404(
  supplierProductId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const supplierProduct = await prisma.supplierProduct.findUnique({
    where: {
      id: supplierProductId
    },
    include: {
      productVariant: true
    }
  });

  if (!supplierProduct) {
    reply.code(404);
    return null;
  }

  return supplierProduct;
}
