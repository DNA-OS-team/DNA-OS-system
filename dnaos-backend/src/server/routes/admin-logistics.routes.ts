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
import type { DeliveryProofType, TransportJobStatus } from "../../generated/prisma/enums.js";
import {
  addDeliveryProof,
  deleteDeliveryProof,
  hasRequiredProofs,
  listDeliveryProofs,
} from "../services/deliveryProofService.js";

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

  // --- Delivery Proof endpoints ---

  const proofTypeSchema = z.enum([
    "PHOTO_BEFORE_LOADING", "PHOTO_AFTER_LOADING", "PHOTO_AT_SITE",
    "SCALE_TICKET", "DELIVERY_NOTE", "CUSTOMER_SIGNATURE", "GPS_LOCATION", "OTHER",
  ]);

  const addProofSchema = z.object({
    proofType: proofTypeSchema,
    fileUrl: z.string().url().optional().nullable(),
    note: z.string().trim().optional().nullable(),
  });

  app.get("/jobs/:jobId/proofs", async (request) => {
    const { jobId } = request.params as { jobId: string };
    const proofs = await listDeliveryProofs(jobId);
    const hasRequired = hasRequiredProofs(proofs);
    return { proofs, hasRequiredProofs: hasRequired };
  });

  app.post("/jobs/:jobId/proofs", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const body = addProofSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    const proof = await addDeliveryProof(jobId, body.proofType as DeliveryProofType, {
      fileUrl: body.fileUrl ?? undefined,
      note: body.note ?? undefined,
      adminId: adminSession?.adminId,
    });
    reply.code(201);
    return { proof };
  });

  app.delete("/jobs/:jobId/proofs/:proofId", async (_request, reply) => {
    const { proofId } = _request.params as { jobId: string; proofId: string };
    await deleteDeliveryProof(proofId);
    reply.code(204);
    return;
  });
}
