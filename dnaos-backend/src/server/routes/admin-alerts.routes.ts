import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdminAccess } from "../services/authService.js";
import {
  listOpenAlerts,
  getAlertCounts,
  resolveAlert,
  markAlertRead,
} from "../services/alertService.js";

const severitySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);
const alertTypeSchema = z.enum([
  "NEW_ORDER", "SUPPLIER_NOT_CONFIRMED", "TRUCK_NOT_ASSIGNED", "TRUCK_DELAYED",
  "DOCUMENT_PENDING_APPROVAL", "INVOICE_OVERDUE", "PAYMENT_UNRECONCILED",
  "LOW_MARGIN", "CREDIT_LIMIT_EXCEEDED", "DELIVERY_PROOF_MISSING",
  "LINE_SEND_FAILED", "PDF_GENERATION_FAILED",
]);

const listQuerySchema = z.object({
  severity: severitySchema.optional(),
  alertType: alertTypeSchema.optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
});

const idParams = z.object({ id: z.string().uuid() });

export async function registerAdminAlertRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const alerts = await listOpenAlerts(query);
    return { alerts };
  });

  app.get("/counts", async () => {
    const counts = await getAlertCounts();
    return counts;
  });

  app.post("/:id/resolve", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    const adminSession = (request as any).adminSession;
    try {
      const alert = await resolveAlert(id, adminSession?.adminId);
      return { alert };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "resolve ไม่สำเร็จ" };
    }
  });

  app.put("/:id/read", async (request, reply) => {
    const { id } = idParams.parse(request.params);
    try {
      const alert = await markAlertRead(id);
      return { alert };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "mark read ไม่สำเร็จ" };
    }
  });
}
