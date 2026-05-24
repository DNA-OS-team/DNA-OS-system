import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DisputeStatus, DisputeType } from "../../generated/prisma/enums.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  createDispute,
  getDispute,
  listDisputes,
  updateDisputeStatus,
} from "../services/disputeService.js";

const disputeTypeSchema = z.enum([
  "SHORT_DELIVERY", "WRONG_MATERIAL", "LATE_DELIVERY", "DAMAGED_MATERIAL",
  "PRICE_DISPUTE", "PAYMENT_DISPUTE", "CUSTOMER_REJECTED", "TRANSPORT_FAILED", "OTHER",
]);

const disputeStatusSchema = z.enum([
  "OPEN", "INVESTIGATING", "WAITING_PARTNER", "WAITING_CUSTOMER",
  "RESOLVED", "REJECTED", "CLOSED",
]);

const createDisputeSchema = z.object({
  customerOrderId: z.string().uuid().optional().nullable(),
  transportJobId: z.string().uuid().optional().nullable(),
  supplierPoId: z.string().uuid().optional().nullable(),
  disputeType: disputeTypeSchema,
  description: z.string().trim().min(1, "Description is required"),
  financialImpact: z.number().optional().nullable(),
});

const updateStatusSchema = z.object({
  toStatus: disputeStatusSchema,
  note: z.string().trim().optional().nullable(),
  resolutionNote: z.string().trim().optional().nullable(),
});

const listQuerySchema = z.object({
  status: disputeStatusSchema.optional(),
  q: z.string().trim().optional(),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

export async function registerAdminDisputeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const disputes = await listDisputes({
      status: query.status as DisputeStatus | undefined,
      q: query.q,
    });
    return { disputes };
  });

  app.post("/", async (request, reply) => {
    const input = createDisputeSchema.parse(request.body);
    const adminSession = (request as any).adminSession;

    if (!input.customerOrderId && !input.transportJobId && !input.supplierPoId) {
      reply.code(400);
      return { error: "Dispute ต้องผูกกับ order, transport job หรือ supplier PO อย่างน้อย 1 รายการ" };
    }

    const dispute = await createDispute({
      ...input,
      disputeType: input.disputeType as DisputeType,
      openedByAdminId: adminSession?.adminId ?? null,
    });

    await writeAuditLog({
      entityType: "dispute",
      entityId: dispute.id,
      action: "CREATE",
      newValue: { disputeNo: dispute.disputeNo, disputeType: dispute.disputeType },
    });

    reply.code(201);
    return { dispute };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const dispute = await getDispute(id);
    if (!dispute) {
      reply.code(404);
      return { error: "ไม่พบ dispute" };
    }
    return { dispute };
  });

  app.post("/:id/status", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const body = updateStatusSchema.parse(request.body);
    const adminSession = (request as any).adminSession;

    try {
      const dispute = await updateDisputeStatus(id, body.toStatus as DisputeStatus, {
        note: body.note ?? undefined,
        resolutionNote: body.resolutionNote ?? undefined,
        adminId: adminSession?.adminId,
      });

      await writeAuditLog({
        entityType: "dispute",
        entityId: id,
        action: "UPDATE",
        newValue: { status: body.toStatus },
      });

      return { dispute };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ" };
    }
  });
}
