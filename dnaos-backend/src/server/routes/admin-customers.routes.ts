import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";

const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  taxId: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  bankName: z.string().trim().optional().nullable(),
  bankAccountNo: z.string().trim().optional().nullable()
});

const siteInputSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  address: z.string().trim().min(1, "Address is required"),
  province: z.string().trim().optional().default(""),
  district: z.string().trim().optional().default(""),
  subdistrict: z.string().trim().optional().default(""),
  postalCode: z.string().trim().optional().default(""),
  gpsLat: z.coerce.number().optional().nullable(),
  gpsLng: z.coerce.number().optional().nullable(),
  contactName: z.string().trim().optional().nullable(),
  contactPhone: z.string().trim().optional().nullable(),
  deliveryNote: z.string().trim().optional().nullable(),
  accessRestriction: z.string().trim().optional().nullable(),
  preferredDeliveryTime: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

const creditInputSchema = z.object({
  creditLimit: z.coerce.number().min(0, "Credit limit must be 0 or more"),
  creditTermDays: z.coerce.number().int().min(0, "Credit term must be 0 or more"),
  currentOutstanding: z.coerce.number().min(0).optional().default(0),
  overdueAmount: z.coerce.number().min(0).optional().default(0),
  creditStatus: z.enum(["NORMAL", "WATCH", "HOLD", "BLOCKED"]).optional().default("NORMAL"),
  paymentBehaviorScore: z.coerce.number().int().min(0).max(100).optional().default(0)
});

const idParamsSchema = z.object({
  id: z.string().uuid()
});

const siteParamsSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid()
});

export async function registerAdminCustomerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async () => {
    const prisma = getPrisma();
    const customers = await prisma.company.findMany({
      where: { type: "CUSTOMER" },
      include: {
        _count: { select: { customerSites: true } },
        customerCreditProfile: true,
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                identities: {
                  where: { provider: "LINE" },
                  select: { displayName: true, pictureUrl: true },
                  take: 1
                }
              }
            }
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      customers: customers.map((c) => ({
        ...c,
        siteCount: c._count.customerSites,
        lineDisplayName: c.members[0]?.user.identities[0]?.displayName ?? null,
        linePictureUrl: c.members[0]?.user.identities[0]?.pictureUrl ?? null,
        contactName: c.members[0]?.user.name ?? null,
        contactPhone: c.members[0]?.user.phone ?? null,
        _count: undefined,
        members: undefined,
      }))
    };
  });

  app.post("/", async (request, reply) => {
    const input = customerInputSchema.parse(request.body);
    const prisma = getPrisma();

    const customer = await prisma.company.create({
      data: {
        ...normalizeEmptyStrings(input),
        email: normalizeOptionalEmail(input.email),
        type: "CUSTOMER"
      }
    });

    await writeAuditLog({
      companyId: customer.id,
      entityType: "customer",
      entityId: customer.id,
      action: "CREATE",
      newValue: {
        id: customer.id,
        name: customer.name,
        type: customer.type
      }
    });

    reply.code(201);
    return { customer };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const prisma = getPrisma();
    const customer = await prisma.company.findFirst({
      where: { id, type: "CUSTOMER" },
      include: {
        _count: { select: { customerSites: true } },
        customerCreditProfile: true,
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                identities: {
                  where: { provider: "LINE" },
                  select: { displayName: true, pictureUrl: true },
                  take: 1
                }
              }
            }
          },
          take: 1,
        },
      },
    });

    if (!customer) {
      reply.code(404);
      return { error: "Customer not found" };
    }

    return {
      customer: {
        ...customer,
        siteCount: customer._count.customerSites,
        lineDisplayName: customer.members[0]?.user.identities[0]?.displayName ?? null,
        linePictureUrl: customer.members[0]?.user.identities[0]?.pictureUrl ?? null,
        contactName: customer.members[0]?.user.name ?? null,
        contactPhone: customer.members[0]?.user.phone ?? null,
        _count: undefined,
        members: undefined,
      }
    };
  });

  app.get("/:id/orders", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const customer = await getCustomerOr404(id, reply);
    if (!customer) return reply;

    const prisma = getPrisma();
    const [orders, orderRequests] = await Promise.all([
      prisma.customerOrder.findMany({
        where: { customerCompanyId: id },
        select: {
          id: true,
          orderNo: true,
          status: true,
          requestedDeliveryAt: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productVariant: {
                select: {
                  name: true,
                  unit: true,
                  product: { select: { name: true } }
                }
              }
            },
            take: 3,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.customerOrderRequest.findMany({
        where: { customerCompanyId: id },
        select: {
          id: true,
          reqNo: true,
          status: true,
          deliveryAddress: true,
          requestedDeliveryAt: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              unit: true,
              productVariant: {
                select: {
                  name: true,
                  product: { select: { name: true } }
                }
              }
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return { orders, orderRequests };
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const prisma = getPrisma();

    const company = await prisma.company.findFirst({
      where: { id, type: "CUSTOMER" },
      include: {
        _count: { select: { customerOrders: true, orderRequests: true } },
      },
    });

    if (!company) {
      reply.code(404);
      return { error: "ไม่พบลูกค้า" };
    }

    if (company._count.customerOrders > 0 || company._count.orderRequests > 0) {
      reply.code(409);
      return { error: "ไม่สามารถลบลูกค้าที่มีออร์เดอร์ในระบบ กรุณาเปลี่ยนสถานะเป็น 'ปิดใช้งาน' แทน" };
    }

    await prisma.$transaction([
      prisma.customerSite.deleteMany({ where: { customerCompanyId: id } }),
      prisma.customerCreditProfile.deleteMany({ where: { customerCompanyId: id } }),
      prisma.appSession.deleteMany({ where: { companyId: id } }),
      prisma.companyMember.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    await writeAuditLog({
      companyId: id,
      entityType: "customer",
      entityId: id,
      action: "DELETE",
      newValue: { id, name: company.name },
    });

    return { ok: true };
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = customerInputSchema.parse(request.body);
    const existingCustomer = await getCustomerOr404(id, reply);

    if (!existingCustomer) {
      return reply;
    }

    const prisma = getPrisma();
    const customer = await prisma.company.update({
      where: { id },
      data: {
        ...normalizeEmptyStrings(input),
        email: normalizeOptionalEmail(input.email)
      }
    });

    await writeAuditLog({
      companyId: customer.id,
      entityType: "customer",
      entityId: customer.id,
      action: "UPDATE",
      oldValue: existingCustomer,
      newValue: customer
    });

    return { customer };
  });

  app.get("/:id/sites", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const customer = await getCustomerOr404(id, reply);

    if (!customer) {
      return reply;
    }

    const prisma = getPrisma();
    const sites = await prisma.customerSite.findMany({
      where: {
        customerCompanyId: id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { customer, sites };
  });

  app.post("/:id/sites", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = siteInputSchema.parse(request.body);
    const customer = await getCustomerOr404(id, reply);

    if (!customer) {
      return reply;
    }

    const prisma = getPrisma();
    const site = await prisma.customerSite.create({
      data: {
        ...normalizeEmptyStrings(input),
        gpsLat: input.gpsLat ?? null,
        gpsLng: input.gpsLng ?? null,
        customerCompanyId: id
      }
    });

    await writeAuditLog({
      companyId: id,
      entityType: "customer_site",
      entityId: site.id,
      action: "CREATE",
      newValue: site
    });

    reply.code(201);
    return { site };
  });

  app.patch("/:id/sites/:siteId", async (request, reply) => {
    const { id, siteId } = siteParamsSchema.parse(request.params);
    const input = siteInputSchema.parse(request.body);
    const customer = await getCustomerOr404(id, reply);

    if (!customer) {
      return reply;
    }

    const prisma = getPrisma();
    const existingSite = await prisma.customerSite.findFirst({
      where: {
        id: siteId,
        customerCompanyId: id
      }
    });

    if (!existingSite) {
      reply.code(404);
      return { error: "Customer site not found" };
    }

    const site = await prisma.customerSite.update({
      where: { id: siteId },
      data: {
        ...normalizeEmptyStrings(input),
        gpsLat: input.gpsLat ?? null,
        gpsLng: input.gpsLng ?? null
      }
    });

    await writeAuditLog({
      companyId: id,
      entityType: "customer_site",
      entityId: site.id,
      action: "UPDATE",
      oldValue: existingSite,
      newValue: site
    });

    return { site };
  });

  app.get("/:id/credit", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const customer = await getCustomerOr404(id, reply);

    if (!customer) {
      return reply;
    }

    const prisma = getPrisma();
    const creditProfile = await prisma.customerCreditProfile.findUnique({
      where: {
        customerCompanyId: id
      }
    });

    return { customer, creditProfile };
  });

  app.put("/:id/credit", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = creditInputSchema.parse(request.body);
    const customer = await getCustomerOr404(id, reply);

    if (!customer) {
      return reply;
    }

    const prisma = getPrisma();
    const existingCreditProfile = await prisma.customerCreditProfile.findUnique({
      where: {
        customerCompanyId: id
      }
    });

    const creditProfile = await prisma.customerCreditProfile.upsert({
      where: {
        customerCompanyId: id
      },
      create: {
        ...input,
        customerCompanyId: id
      },
      update: input
    });

    await writeAuditLog({
      companyId: id,
      entityType: "customer_credit_profile",
      entityId: creditProfile.id,
      action: existingCreditProfile ? "UPDATE" : "CREATE",
      oldValue: existingCreditProfile,
      newValue: creditProfile
    });

    return { creditProfile };
  });
}

async function getCustomerOr404(id: string, reply: { code: (statusCode: number) => void }) {
  const prisma = getPrisma();
  const customer = await prisma.company.findFirst({
    where: {
      id,
      type: "CUSTOMER"
    }
  });

  if (!customer) {
    reply.code(404);
    return null;
  }

  return customer;
}

function normalizeOptionalEmail(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  return email;
}

function normalizeEmptyStrings<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value
    ])
  ) as T;
}
