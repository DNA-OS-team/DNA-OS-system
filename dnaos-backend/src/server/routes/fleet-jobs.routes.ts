import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getTransportJob,
  listTransportJobs,
  updateTransportJobStatus,
} from "../services/transportService.js";
import { nextTransportStatuses } from "../../core/engines/dispatchEngine.js";
import type { TransportJobStatus } from "../../generated/prisma/client.js";

const updateStatusSchema = z.object({
  toStatus: z.enum(["ACCEPTED", "GOING_TO_PICKUP", "ARRIVED_PICKUP", "LOADED", "IN_TRANSIT", "ARRIVED_SITE", "DELIVERED"]),
  note: z.string().optional(),
});

export async function registerFleetJobRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = request.query as Record<string, string>;
    const appSession = (request as any).appSession;
    const fleetCompanyId = appSession?.companyId;

    if (!fleetCompanyId) {
      return { jobs: [], total: 0 };
    }

    return listTransportJobs({
      fleetCompanyId,
      status: (query.status as TransportJobStatus) || undefined,
      take: query.take ? Number(query.take) : undefined,
      skip: query.skip ? Number(query.skip) : undefined,
    });
  });

  app.get("/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const appSession = (request as any).appSession;
    const fleetCompanyId = appSession?.companyId;

    const job = await getTransportJob(jobId);

    if (job.fleetCompanyId && job.fleetCompanyId !== fleetCompanyId) {
      return reply.status(403).send({ error: "ไม่มีสิทธิ์เข้าถึงงานขนส่งนี้" });
    }

    return {
      job,
      nextStatuses: nextTransportStatuses(job.status).filter((s) =>
        ["ACCEPTED", "GOING_TO_PICKUP", "ARRIVED_PICKUP", "LOADED", "IN_TRANSIT", "ARRIVED_SITE", "DELIVERED"].includes(s)
      ),
    };
  });

  app.post("/:jobId/status", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const body = updateStatusSchema.parse(request.body);
    const appSession = (request as any).appSession;
    const fleetCompanyId = appSession?.companyId;

    const job = await getTransportJob(jobId);
    if (job.fleetCompanyId && job.fleetCompanyId !== fleetCompanyId) {
      return reply.status(403).send({ error: "ไม่มีสิทธิ์อัปเดตงานขนส่งนี้" });
    }

    const updated = await updateTransportJobStatus(jobId, body.toStatus as TransportJobStatus, {
      changedBy: appSession?.userId,
      note: body.note,
    });
    return { job: updated };
  });
}
