import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  assignFleetToJob,
  createTransportJobFromOrder,
  getTransportJob,
  listFleetCompanies,
  listTransportJobs,
  updateTransportJobStatus,
} from "../services/transportService.js";
import {
  nextTransportStatuses,
} from "../../core/engines/dispatchEngine.js";
import type { TransportJobStatus } from "../../generated/prisma/client.js";

const createJobSchema = z.object({
  orderId: z.string().uuid(),
  supplierPurchaseOrderId: z.string().uuid().optional(),
  pickupAddress: z.string().min(1),
  fleetCompanyId: z.string().uuid().optional(),
  scheduledPickupAt: z.string().datetime().optional(),
  scheduledDeliveryAt: z.string().datetime().optional(),
  transportCost: z.number().min(0).optional(),
  customerDeliveryFee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const assignFleetSchema = z.object({
  fleetCompanyId: z.string().uuid(),
});

const updateStatusSchema = z.object({
  toStatus: z.string(),
  note: z.string().optional(),
});

export async function registerAdminLogisticsRoutes(app: FastifyInstance) {
  app.get("/jobs", async (request) => {
    const query = request.query as Record<string, string>;
    return listTransportJobs({
      status: (query.status as TransportJobStatus) || undefined,
      customerOrderId: query.orderId || undefined,
      q: query.q || undefined,
      take: query.take ? Number(query.take) : undefined,
      skip: query.skip ? Number(query.skip) : undefined,
    });
  });

  app.post("/jobs", async (request, reply) => {
    const body = createJobSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    const job = await createTransportJobFromOrder(body.orderId, {
      supplierPurchaseOrderId: body.supplierPurchaseOrderId,
      pickupAddress: body.pickupAddress,
      fleetCompanyId: body.fleetCompanyId,
      scheduledPickupAt: body.scheduledPickupAt
        ? new Date(body.scheduledPickupAt)
        : undefined,
      scheduledDeliveryAt: body.scheduledDeliveryAt
        ? new Date(body.scheduledDeliveryAt)
        : undefined,
      transportCost: body.transportCost,
      customerDeliveryFee: body.customerDeliveryFee,
      notes: body.notes,
      assignedBy: adminSession?.adminId,
    });
    return reply.status(201).send({ job });
  });

  app.get("/jobs/:jobId", async (request) => {
    const { jobId } = request.params as { jobId: string };
    const job = await getTransportJob(jobId);
    return {
      job,
      nextStatuses: nextTransportStatuses(job.status),
    };
  });

  app.post("/jobs/:jobId/assign", async (request) => {
    const { jobId } = request.params as { jobId: string };
    const body = assignFleetSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    const job = await assignFleetToJob(
      jobId,
      body.fleetCompanyId,
      adminSession?.adminId
    );
    return { job };
  });

  app.post("/jobs/:jobId/status", async (request) => {
    const { jobId } = request.params as { jobId: string };
    const body = updateStatusSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    const job = await updateTransportJobStatus(
      jobId,
      body.toStatus as TransportJobStatus,
      {
        changedBy: adminSession?.adminId,
        note: body.note,
      }
    );
    return { job };
  });

  app.get("/fleet-companies", async () => {
    const companies = await listFleetCompanies();
    return { companies };
  });
}
