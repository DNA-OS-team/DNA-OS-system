import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getCurrentLineSession } from "../services/authService.js";
import { getPrisma } from "../db/prisma.js";
import type { CustomerOrderStatus } from "../../generated/prisma/enums.js";

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

export async function registerCustomerPortalRoutes(app: FastifyInstance) {
  app.get("/me", async (request, reply) => {
    const session = await getCurrentLineSession(request);
    if (!session || session.user.status !== "ACTIVE") {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const prisma = getPrisma();
    const identity = await prisma.userIdentity.findFirst({
      where: { userId: session.userId, provider: "LINE" },
      select: { displayName: true, pictureUrl: true },
    });
    return {
      userId: session.userId,
      displayName: identity?.displayName ?? session.user.name ?? "",
      pictureUrl: identity?.pictureUrl ?? null,
      company: {
        id: session.company.id,
        name: session.company.name,
        taxId: session.company.taxId,
      },
    };
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
