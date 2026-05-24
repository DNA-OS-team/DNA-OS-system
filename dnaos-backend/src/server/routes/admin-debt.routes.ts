import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  addCollectionNote,
  checkAutoInvoiceTrigger,
  createInvoiceFromCompletedTrips,
  getDebtDetail,
  getDebtList,
  manualStateTransition,
  recordFirstContact,
} from "../services/debtService.js";
import { refreshDebtSnapshot, refreshAllDebtSnapshots } from "../../core/engines/collectionEngine.js";

const collectionStateSchema = z.enum([
  "CURRENT", "OVERDUE", "WARNING", "COLLECTION",
  "PROMISED", "PARTIAL", "LEGAL", "CLOSED",
]);

const listQuerySchema = z.object({
  state: collectionStateSchema.optional(),
  q: z.string().trim().optional(),
});

const customerIdSchema = z.object({ customerCompanyId: z.string().uuid() });
const orderIdSchema = z.object({ orderId: z.string().uuid() });

const firstContactSchema = z.object({
  note: z.string().trim().default("บันทึกการติดต่อลูกค้าครั้งแรก"),
});

const addNoteSchema = z.object({
  note: z.string().trim().min(1, "กรุณากรอกบันทึก"),
  promisedPayDate: z.string().optional().nullable(),
});

const stateTransitionSchema = z.object({
  toState: collectionStateSchema,
  note: z.string().trim().optional(),
});

export async function registerAdminDebtRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  // List all debt snapshots
  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const debts = await getDebtList(query);
    return { debts };
  });

  // Refresh all snapshots
  app.post("/refresh-all", async () => {
    const result = await refreshAllDebtSnapshots();
    return { result };
  });

  // Get debt detail for a customer
  app.get("/:customerCompanyId", async (request, reply) => {
    const { customerCompanyId } = customerIdSchema.parse(request.params);
    const detail = await getDebtDetail(customerCompanyId);
    if (!detail.snapshot) {
      // Refresh snapshot on first access
      await refreshDebtSnapshot(customerCompanyId);
      const refreshed = await getDebtDetail(customerCompanyId);
      return refreshed;
    }
    return detail;
  });

  // Record first contact (sets firstContactAt + debtStartAt = firstContactAt + 24h)
  app.post("/:customerCompanyId/first-contact", async (request, reply) => {
    const { customerCompanyId } = customerIdSchema.parse(request.params);
    const { note } = firstContactSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    try {
      const snapshot = await recordFirstContact(customerCompanyId, adminSession?.adminId, note);
      await writeAuditLog({
        entityType: "debt_snapshot",
        entityId: customerCompanyId,
        action: "UPDATE",
        newValue: { action: "first_contact_recorded", firstContactAt: snapshot.firstContactAt },
      });
      return { snapshot };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "บันทึกการติดต่อไม่สำเร็จ" };
    }
  });

  // Add collection note
  app.post("/:customerCompanyId/notes", async (request, reply) => {
    const { customerCompanyId } = customerIdSchema.parse(request.params);
    const body = addNoteSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    try {
      const note = await addCollectionNote({
        customerCompanyId,
        adminId: adminSession?.adminId,
        note: body.note,
        promisedPayDate: body.promisedPayDate,
      });
      return { note };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
    }
  });

  // Manual state transition
  app.put("/:customerCompanyId/state", async (request, reply) => {
    const { customerCompanyId } = customerIdSchema.parse(request.params);
    const body = stateTransitionSchema.parse(request.body);
    const adminSession = (request as any).adminSession;
    try {
      const snapshot = await manualStateTransition({
        customerCompanyId,
        adminId: adminSession?.adminId,
        toState: body.toState,
        note: body.note,
      });
      await writeAuditLog({
        entityType: "debt_snapshot",
        entityId: customerCompanyId,
        action: "UPDATE",
        newValue: { collectionState: body.toState },
      });
      return { snapshot };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ" };
    }
  });

  // Refresh single snapshot
  app.post("/:customerCompanyId/refresh", async (request, reply) => {
    const { customerCompanyId } = customerIdSchema.parse(request.params);
    try {
      const snapshot = await refreshDebtSnapshot(customerCompanyId);
      return { snapshot };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "รีเฟรชไม่สำเร็จ" };
    }
  });

  // Check auto-invoice trigger for an order
  app.get("/auto-invoice/check/:orderId", async (request) => {
    const { orderId } = orderIdSchema.parse(request.params);
    const ready = await checkAutoInvoiceTrigger(orderId);
    return { ready };
  });

  // Trigger auto-invoice creation from completed trips
  app.post("/auto-invoice/:orderId", async (request, reply) => {
    const { orderId } = orderIdSchema.parse(request.params);
    try {
      const invoice = await createInvoiceFromCompletedTrips(orderId);
      await writeAuditLog({
        entityType: "invoice",
        entityId: invoice.id,
        action: "CREATE",
        newValue: { invoiceNo: invoice.invoiceNo, source: "auto_invoice_from_completed_trips" },
      });
      reply.code(201);
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "สร้าง invoice อัตโนมัติไม่สำเร็จ" };
    }
  });
}
