import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getCurrentLineSession } from "../services/authService.js";
import { getPrisma } from "../db/prisma.js";
import type { CustomerOrderStatus } from "../../generated/prisma/enums.js";

function fmtPrice(n: unknown) {
  return Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

async function generateReqNo(): Promise<string> {
  const prisma = getPrisma();
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `REQ-${yymm}-`;
  const latest = await prisma.customerOrderRequest.findFirst({
    where: { reqNo: { startsWith: prefix } },
    orderBy: { reqNo: "desc" },
  });
  const next = latest
    ? parseInt(latest.reqNo.replace(prefix, ""), 10) + 1
    : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

const listQuerySchema = z.object({
  status: z.string().optional(),
  q: z.string().optional(),
});

async function requireCustomer(request: Parameters<typeof getCurrentLineSession>[0], reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const session = await getCurrentLineSession(request);
  if (!session || session.user.status !== "ACTIVE" || session.company.type !== "CUSTOMER") {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  return session;
}

const updateMeSchema = z.object({
  contactName: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
});

const createSiteSchema = z.object({
  siteName: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1),
  province: z.string().trim().default(""),
  district: z.string().trim().default(""),
  subdistrict: z.string().trim().default(""),
  postalCode: z.string().trim().default(""),
  gpsLat: z.coerce.number().optional().nullable(),
  gpsLng: z.coerce.number().optional().nullable(),
});

export async function registerCustomerPortalRoutes(app: FastifyInstance) {
  app.get("/me", async (request, reply) => {
    const session = await getCurrentLineSession(request);
    if (!session || session.user.status !== "ACTIVE" || session.company.type !== "CUSTOMER") {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const prisma = getPrisma();
    const [identity, user] = await Promise.all([
      prisma.userIdentity.findFirst({
        where: { userId: session.userId, provider: "LINE" },
        select: { displayName: true, pictureUrl: true },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, phone: true },
      }),
    ]);
    return {
      userId: session.userId,
      displayName: identity?.displayName ?? session.user.name ?? "",
      pictureUrl: identity?.pictureUrl ?? null,
      contactName: user?.name ?? null,
      phone: user?.phone ?? null,
      company: {
        id: session.company.id,
        name: session.company.name,
        taxId: session.company.taxId,
      },
    };
  });

  app.patch("/me", async (request, reply) => {
    const session = await getCurrentLineSession(request);
    if (!session || session.user.status !== "ACTIVE") {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const input = updateMeSchema.parse(request.body);
    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(input.contactName !== undefined ? { name: input.contactName || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      },
    });
    return { ok: true };
  });

  app.get("/sites", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;
    const prisma = getPrisma();
    const sites = await prisma.customerSite.findMany({
      where: { customerCompanyId: session.company.id },
      select: { id: true, siteName: true, address: true, gpsLat: true, gpsLng: true, province: true },
      orderBy: { createdAt: "desc" },
    });
    return { sites };
  });

  app.post("/sites", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;
    const input = createSiteSchema.parse(request.body);
    const prisma = getPrisma();
    const site = await prisma.customerSite.create({
      data: {
        customerCompanyId: session.company.id,
        siteName: input.siteName,
        address: input.address,
        province: input.province,
        district: input.district,
        subdistrict: input.subdistrict,
        postalCode: input.postalCode,
        gpsLat: input.gpsLat ?? null,
        gpsLng: input.gpsLng ?? null,
      },
      select: { id: true, siteName: true, address: true, gpsLat: true, gpsLng: true, province: true },
    });
    reply.code(201);
    return { site };
  });

  app.delete("/sites/:id", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const prisma = getPrisma();
    const site = await prisma.customerSite.findFirst({
      where: { id, customerCompanyId: session.company.id },
    });
    if (!site) return reply.code(404).send({ error: "ไม่พบโลเคชั่น" });
    await prisma.customerSite.delete({ where: { id } });
    return { ok: true };
  });

  app.get("/orders", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const { status, q } = listQuerySchema.parse(request.query);
    const prisma = getPrisma();

    const orders = await prisma.customerOrder.findMany({
      where: {
        customerCompanyId: session.company.id,
        ...(status ? { status: status as CustomerOrderStatus } : {}),
        ...(q ? {
          OR: [
            { orderNo: { contains: q, mode: "insensitive" } },
            { project: { title: { contains: q, mode: "insensitive" } } },
          ],
        } : {}),
      },
      include: {
        project: { select: { id: true, projectNo: true, title: true } },
        customerSite: { select: { id: true, siteName: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        createdAt: o.createdAt,
        requestedDeliveryAt: o.requestedDeliveryAt,
        deliveryNote: o.deliveryNote,
        itemCount: o.items.length,
        project: o.project,
        customerSite: o.customerSite,
      })),
    };
  });

  app.get("/orders/:id", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const prisma = getPrisma();

    const order = await prisma.customerOrder.findFirst({
      where: { id, customerCompanyId: session.company.id },
      include: {
        project: { select: { id: true, projectNo: true, title: true } },
        customerSite: { select: { id: true, siteName: true } },
        items: {
          include: {
            productVariant: {
              include: { product: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!order) return reply.code(404).send({ error: "ไม่พบคำสั่งซื้อ" });

    return { order };
  });

  // ─── Products (available supplier products) ────────────────────────────────
  app.get("/products", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const prisma = getPrisma();
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { isAvailable: true },
      include: {
        productVariant: {
          include: {
            product: {
              include: { category: { select: { name: true } } },
            },
          },
        },
        supplierCompany: { select: { id: true, name: true } },
      },
      orderBy: { productVariant: { product: { name: "asc" } } },
    });

    // Group by Product — show cheapest price per unit
    const productMap = new Map<string, {
      id: string; name: string; imageUrl: string | null; category: string;
      pricePerTon: number | null; pricePerCubic: number | null;
      variants: { variantId: string; variantName: string; unit: string; price: number }[];
    }>();

    for (const sp of supplierProducts) {
      const pv = sp.productVariant;
      const prod = pv.product;
      const price = Number(sp.price);
      const unit = pv.unit.toLowerCase();
      const isTon = unit.includes("ตัน") || unit === "ton" || unit === "t";
      const isCubic = unit.includes("คิว") || unit.includes("ลูกบาศก์") || unit.includes("m3") || unit === "cubic";

      if (!productMap.has(prod.id)) {
        productMap.set(prod.id, {
          id: prod.id, name: prod.name, imageUrl: prod.imageUrl,
          category: prod.category.name,
          pricePerTon: isTon ? price : null,
          pricePerCubic: isCubic ? price : null,
          variants: [],
        });
      }
      const entry = productMap.get(prod.id)!;
      if (isTon && (entry.pricePerTon === null || price < entry.pricePerTon)) entry.pricePerTon = price;
      if (isCubic && (entry.pricePerCubic === null || price < entry.pricePerCubic)) entry.pricePerCubic = price;
      entry.variants.push({ variantId: pv.id, variantName: pv.name, unit: pv.unit, price });
    }

    return { products: Array.from(productMap.values()) };
  });

  // ─── Order Requests ─────────────────────────────────────────────────────────
  app.post("/orders/request", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const body = z.object({
      items: z.array(z.object({
        productVariantId: z.string().uuid(),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      })).min(1),
      deliveryAddress: z.string().trim().min(1),
      requestedDeliveryAt: z.string().datetime().optional().nullable(),
      note: z.string().trim().optional().nullable(),
    }).parse(request.body);

    const prisma = getPrisma();
    const reqNo = await generateReqNo();

    const req = await prisma.customerOrderRequest.create({
      data: {
        reqNo,
        customerCompanyId: session.company.id,
        deliveryAddress: body.deliveryAddress,
        requestedDeliveryAt: body.requestedDeliveryAt ? new Date(body.requestedDeliveryAt) : null,
        note: body.note ?? null,
        items: {
          create: body.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
      include: { items: true },
    });

    reply.code(201);
    return { ok: true, reqNo: req.reqNo, id: req.id };
  });

  app.get("/orders/requests", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const prisma = getPrisma();
    const requests = await prisma.customerOrderRequest.findMany({
      where: { customerCompanyId: session.company.id },
      include: {
        items: {
          include: {
            productVariant: { include: { product: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { requests };
  });

  app.get("/dashboard", async (request, reply) => {
    const session = await requireCustomer(request, reply as Parameters<typeof requireCustomer>[1]);
    if (!session) return;

    const prisma = getPrisma();

    const [orders, statusCounts] = await Promise.all([
      prisma.customerOrder.findMany({
        where: { customerCompanyId: session.company.id },
        include: {
          project: { select: { title: true } },
          customerSite: { select: { siteName: true } },
          items: {
            include: {
              productVariant: {
                include: { product: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.customerOrder.groupBy({
        by: ["status"],
        where: { customerCompanyId: session.company.id },
        _count: { id: true },
      }),
    ]);

    const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));

    return { orders, counts };
  });
}
