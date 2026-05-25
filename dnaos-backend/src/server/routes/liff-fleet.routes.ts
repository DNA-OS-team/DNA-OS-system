import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { getCurrentLineSession } from "../services/authService.js";
import {
  listTransportJobs,
  getTransportJob,
  updateTransportJobStatus,
  transportJobInclude,
} from "../services/transportService.js";
import { nextTransportStatuses } from "../../core/engines/dispatchEngine.js";
import type { TransportJobStatus } from "../../generated/prisma/client.js";

async function requireFleet(request: FastifyRequest, reply: FastifyReply) {
  const session = await getCurrentLineSession(request);
  if (
    !session ||
    session.user.status !== "ACTIVE" ||
    session.company.status !== "ACTIVE" ||
    session.company.type !== "FLEET"
  ) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  return session;
}

const FLEET_STATUSES = [
  "ACCEPTED",
  "GOING_TO_PICKUP",
  "ARRIVED_PICKUP",
  "LOADED",
  "IN_TRANSIT",
  "ARRIVED_SITE",
  "DELIVERED",
] as const;

const updateStatusSchema = z.object({
  toStatus: z.enum(FLEET_STATUSES),
  note: z.string().trim().optional(),
});

const proofSchema = z.object({
  proofType: z.enum([
    "PHOTO_BEFORE_LOADING",
    "PHOTO_AFTER_LOADING",
    "PHOTO_AT_SITE",
    "SCALE_TICKET",
    "DELIVERY_NOTE",
    "CUSTOMER_SIGNATURE",
    "OTHER",
  ]),
  fileUrl: z.string().url().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export async function registerLiffFleetRoutes(app: FastifyInstance) {
  // ── Job list ────────────────────────────────────────────────────────────────
  app.get("/jobs", async (request, reply) => {
    const session = await requireFleet(request, reply);
    if (!session) return reply;

    const q = (request.query as Record<string, string>);
    const filter = q.filter ?? "active";

    if (filter === "active") {
      const prisma = getPrisma();
      const jobs = await prisma.transportJob.findMany({
        where: {
          fleetCompanyId: session.companyId,
          status: {
            in: ["ASSIGNED", "ACCEPTED", "GOING_TO_PICKUP", "ARRIVED_PICKUP", "LOADED", "IN_TRANSIT", "ARRIVED_SITE"],
          },
        },
        include: transportJobInclude,
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return { jobs };
    }

    return listTransportJobs({
      fleetCompanyId: session.companyId,
      take: 30,
      skip: q.skip ? Number(q.skip) : 0,
    });
  });

  // ── Job detail ─────────────────────────────────────────────────────────────
  app.get("/jobs/:id", async (request, reply) => {
    const session = await requireFleet(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const job = await getTransportJob(id);

    if (job.fleetCompanyId && job.fleetCompanyId !== session.companyId) {
      reply.code(403);
      return { error: "ไม่มีสิทธิ์เข้าถึงงานนี้" };
    }

    const prisma = getPrisma();
    const proofs = await prisma.deliveryProof.findMany({
      where: { transportJobId: id },
      orderBy: { createdAt: "asc" },
    });

    return {
      job,
      proofs,
      nextStatuses: nextTransportStatuses(job.status).filter((s) =>
        FLEET_STATUSES.includes(s as typeof FLEET_STATUSES[number])
      ),
    };
  });

  // ── Update job status ───────────────────────────────────────────────────────
  app.post("/jobs/:id/status", async (request, reply) => {
    const session = await requireFleet(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const { toStatus, note } = updateStatusSchema.parse(request.body);

    const job = await getTransportJob(id);
    if (job.fleetCompanyId && job.fleetCompanyId !== session.companyId) {
      reply.code(403);
      return { error: "ไม่มีสิทธิ์อัปเดตงานนี้" };
    }

    const updated = await updateTransportJobStatus(id, toStatus as TransportJobStatus, {
      changedBy: session.userId,
      note,
    });

    return { job: updated };
  });

  // ── Submit delivery proof ───────────────────────────────────────────────────
  app.post("/jobs/:id/proof", async (request, reply) => {
    const session = await requireFleet(request, reply);
    if (!session) return reply;

    const { id } = request.params as { id: string };
    const { proofType, fileUrl, note } = proofSchema.parse(request.body);

    const prisma = getPrisma();

    const job = await prisma.transportJob.findFirst({
      where: { id, fleetCompanyId: session.companyId },
    });

    if (!job) {
      reply.code(404);
      return { error: "ไม่พบงาน" };
    }

    const proof = await prisma.deliveryProof.create({
      data: {
        transportJobId: id,
        proofType,
        fileUrl: fileUrl ?? null,
        note: note ?? null,
      },
    });

    return { proof };
  });

  // ── Earnings / settlement history ───────────────────────────────────────────
  app.get("/earnings", async (request, reply) => {
    const session = await requireFleet(request, reply);
    if (!session) return reply;

    const prisma = getPrisma();

    const batches = await prisma.settlementBatch.findMany({
      where: { partnerCompanyId: session.companyId, partnerType: "FLEET" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const totalPaid = batches
      .filter((b) => b.status === "PAID")
      .reduce((sum, b) => sum + Number(b.netAmount), 0);

    const totalPending = batches
      .filter((b) => ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAYMENT_ORDERED"].includes(b.status))
      .reduce((sum, b) => sum + Number(b.netAmount), 0);

    return { batches, totalPaid, totalPending };
  });
}
