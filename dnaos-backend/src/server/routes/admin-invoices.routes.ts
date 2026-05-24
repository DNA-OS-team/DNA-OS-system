import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  confirmPayment,
  createInvoice,
  getInvoice,
  listInvoices,
  recordPayment,
  rejectPayment,
  sendInvoice,
  voidInvoice,
} from "../services/invoiceService.js";

const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "VOID"]);
const paymentMethodSchema = z.enum(["BANK_TRANSFER", "CASH", "CHEQUE", "CREDIT_CARD", "OTHER"]);

const createInvoiceSchema = z.object({
  customerCompanyId: z.string().uuid(),
  customerOrderId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  referenceNo: z.string().trim().optional().nullable(),
  recipientAddress: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  vatRate: z.number().min(0).max(1).optional(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1),
        quantity: z.number().positive(),
        unit: z.string().trim().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});

const recordPaymentSchema = z.object({
  paymentMethod: paymentMethodSchema,
  amount: z.number().positive(),
  paidAt: z.string(),
  referenceNo: z.string().trim().optional().nullable(),
  bankRef: z.string().trim().optional().nullable(),
  slipUrl: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const listQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  customerCompanyId: z.string().uuid().optional(),
  q: z.string().trim().optional(),
});

const idParamsSchema = z.object({ id: z.string().uuid() });
const paymentParamsSchema = z.object({ id: z.string().uuid(), paymentId: z.string().uuid() });

export async function registerAdminInvoiceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const invoices = await listInvoices(query);
    return { invoices };
  });

  app.post("/", async (request, reply) => {
    const input = createInvoiceSchema.parse(request.body);
    try {
      const invoice = await createInvoice(input);
      await writeAuditLog({
        entityType: "invoice",
        entityId: invoice.id,
        action: "CREATE",
        newValue: { invoiceNo: invoice.invoiceNo, totalAmount: invoice.totalAmount },
      });
      reply.code(201);
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "สร้าง invoice ไม่สำเร็จ" };
    }
  });

  app.get("/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const invoice = await getInvoice(id);
    if (!invoice) { reply.code(404); return { error: "ไม่พบ invoice" }; }
    return { invoice };
  });

  app.post("/:id/send", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    try {
      const invoice = await sendInvoice(id);
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ส่ง invoice ไม่สำเร็จ" };
    }
  });

  app.post("/:id/void", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    try {
      const invoice = await voidInvoice(id);
      await writeAuditLog({ entityType: "invoice", entityId: id, action: "UPDATE", newValue: { status: "VOID" } });
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ยกเลิก invoice ไม่สำเร็จ" };
    }
  });

  app.post("/:id/payments", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const body = recordPaymentSchema.parse(request.body);
    try {
      const payment = await recordPayment(id, body);
      reply.code(201);
      return { payment };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "บันทึกการชำระเงินไม่สำเร็จ" };
    }
  });

  app.post("/:id/payments/:paymentId/confirm", async (request, reply) => {
    const { id, paymentId } = paymentParamsSchema.parse(request.params);
    const adminSession = (request as any).adminSession;
    try {
      const invoice = await confirmPayment(paymentId, adminSession?.adminId);
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ยืนยันการชำระเงินไม่สำเร็จ" };
    }
  });

  app.post("/:id/payments/:paymentId/reject", async (request, reply) => {
    const params = paymentParamsSchema.parse(request.params);
    try {
      const invoice = await rejectPayment(params.paymentId);
      return { invoice };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : "ปฏิเสธการชำระเงินไม่สำเร็จ" };
    }
  });
}
