import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  approveSettlement,
  cancelSettlement,
  createPVFromSettlement,
  createSettlementBatch,
  getSettlementDetail,
  getSettlementList,
  markSettlementPaid,
  previewSettlement,
  submitSettlementForApproval,
} from "../services/settlementService.js";

const partnerTypeSchema = z.enum(["SUPPLIER", "FLEET"]);
const statusSchema = z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAYMENT_ORDERED", "PAID", "CANCELLED"]);

const listQuerySchema = z.object({
  status: statusSchema.optional(),
  partnerType: partnerTypeSchema.optional(),
  q: z.string().trim().optional(),
});

const previewQuerySchema = z.object({
  partnerCompanyId: z.string().uuid(),
  partnerType: partnerTypeSchema,
});

const createSchema = z.object({
  partnerCompanyId: z.string().uuid(),
  partnerType: partnerTypeSchema,
  periodFrom: z.string(),
  periodTo: z.string(),
  notes: z.string().trim().optional(),
});

const idParams = z.object({ id: z.string().uuid() });

export async function registerAdminSettlementRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const settlements = await getSettlementList(query);
    return { settlements };
  });

  app.get("/preview", async (request, reply) => {
    const query = previewQuerySchema.parse(request.query);
    try {
      const preview = await previewSettlement(query.partnerCompanyId, query.partnerType);
      return { preview };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ไม่สามารถดูตัวอย่างได้" };
    }
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    const settlement = await getSettlementDetail(id);
    if (!settlement) { reply.code(404); return { error: "ไม่พบ settlement" }; }
    return { settlement };
  });

  app.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    try {
      const settlement = await createSettlementBatch({ ...body, adminId: adminSession?.adminId });
      await writeAuditLog({
        entityType: "settlement_batch",
        entityId: settlement.id,
        action: "CREATE",
        newValue: { batchNo: settlement.batchNo, partnerType: settlement.partnerType, netAmount: settlement.netAmount },
      });
      reply.code(201);
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "สร้าง settlement ไม่สำเร็จ" };
    }
  });

  app.post("/:id/submit", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    try {
      const settlement = await submitSettlementForApproval(id);
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ส่งอนุมัติไม่สำเร็จ" };
    }
  });

  app.post("/:id/approve", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    const adminSession = (request as any).adminSession;
    try {
      const settlement = await approveSettlement(id, adminSession?.adminId);
      await writeAuditLog({
        entityType: "settlement_batch",
        entityId: id,
        action: "UPDATE",
        newValue: { status: "APPROVED" },
      });
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "อนุมัติไม่สำเร็จ" };
    }
  });

  app.post("/:id/pv", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    try {
      const settlement = await createPVFromSettlement(id);
      await writeAuditLog({
        entityType: "settlement_batch",
        entityId: id,
        action: "UPDATE",
        newValue: { status: "PAYMENT_ORDERED" },
      });
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "สร้าง PV ไม่สำเร็จ" };
    }
  });

  app.post("/:id/paid", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    const adminSession = (request as any).adminSession;
    try {
      const settlement = await markSettlementPaid(id, adminSession?.adminId);
      await writeAuditLog({
        entityType: "settlement_batch",
        entityId: id,
        action: "UPDATE",
        newValue: { status: "PAID", paidAt: new Date() },
      });
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ยืนยันการจ่ายไม่สำเร็จ" };
    }
  });

  app.post("/:id/cancel", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    try {
      const settlement = await cancelSettlement(id);
      return { settlement };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ" };
    }
  });
}
