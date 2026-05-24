import { getPrisma } from "../db/prisma.js";
import type { AlertType, AlertSeverity } from "../../generated/prisma/enums.js";

export type CreateAlertInput = {
  alertType: AlertType;
  severity?: AlertSeverity;
  entityType?: string;
  entityId?: string;
  customerCompanyId?: string;
  invoiceId?: string;
  message: string;
};

// Dedupe window: don't create the same alert for the same entity within 24h
const DEDUPE_HOURS = 24;

export async function createAlert(input: CreateAlertInput) {
  const prisma = getPrisma();
  const since = new Date(Date.now() - DEDUPE_HOURS * 3_600_000);

  // Dedupe: skip if an open (unresolved) alert of the same type for the same entity already exists
  if (input.entityId) {
    const exists = await prisma.alert.findFirst({
      where: {
        alertType: input.alertType,
        entityId: input.entityId,
        resolvedAt: null,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (exists) return null;
  }

  return prisma.alert.create({
    data: {
      alertType: input.alertType,
      severity: input.severity ?? "WARNING",
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      customerCompanyId: input.customerCompanyId ?? null,
      invoiceId: input.invoiceId ?? null,
      message: input.message,
    },
  });
}

export async function resolveAlert(alertId: string, adminId: string) {
  const prisma = getPrisma();
  const alert = await prisma.alert.findUnique({ where: { id: alertId }, select: { resolvedAt: true } });
  if (!alert) throw new Error("ไม่พบ alert");
  if (alert.resolvedAt) throw new Error("alert นี้ถูก resolve แล้ว");

  return prisma.alert.update({
    where: { id: alertId },
    data: { resolvedAt: new Date(), resolvedByAdminId: adminId, isRead: true },
  });
}

export async function markAlertRead(alertId: string) {
  const prisma = getPrisma();
  return prisma.alert.update({ where: { id: alertId }, data: { isRead: true } });
}

export async function listOpenAlerts(filters?: {
  severity?: AlertSeverity;
  alertType?: AlertType;
  take?: number;
}) {
  const prisma = getPrisma();
  return prisma.alert.findMany({
    where: {
      resolvedAt: null,
      severity: filters?.severity,
      alertType: filters?.alertType,
    },
    orderBy: [
      { severity: "desc" },
      { createdAt: "desc" },
    ],
    take: filters?.take ?? 50,
  });
}

export async function getAlertCounts() {
  const prisma = getPrisma();
  const [critical, warning, info, total] = await Promise.all([
    prisma.alert.count({ where: { resolvedAt: null, severity: "CRITICAL" } }),
    prisma.alert.count({ where: { resolvedAt: null, severity: "WARNING" } }),
    prisma.alert.count({ where: { resolvedAt: null, severity: "INFO" } }),
    prisma.alert.count({ where: { resolvedAt: null } }),
  ]);
  return { critical, warning, info, total };
}

// ─── Alert creators called by other services ──────────────────────────────────

export async function alertNewOrder(orderId: string, orderNo: string) {
  return createAlert({
    alertType: "NEW_ORDER",
    severity: "INFO",
    entityType: "CustomerOrder",
    entityId: orderId,
    message: `มีคำสั่งซื้อใหม่ ${orderNo}`,
  });
}

export async function alertSupplierNotConfirmed(poId: string, poNo: string) {
  return createAlert({
    alertType: "SUPPLIER_NOT_CONFIRMED",
    severity: "WARNING",
    entityType: "SupplierPurchaseOrder",
    entityId: poId,
    message: `Supplier ยังไม่ยืนยัน PO ${poNo}`,
  });
}

export async function alertTruckNotAssigned(orderId: string, orderNo: string) {
  return createAlert({
    alertType: "TRUCK_NOT_ASSIGNED",
    severity: "WARNING",
    entityType: "CustomerOrder",
    entityId: orderId,
    message: `ยังไม่มีรถรับงาน Order ${orderNo}`,
  });
}

export async function alertInvoiceOverdue(invoiceId: string, invoiceNo: string, customerCompanyId: string) {
  return createAlert({
    alertType: "INVOICE_OVERDUE",
    severity: "CRITICAL",
    entityType: "Invoice",
    entityId: invoiceId,
    customerCompanyId,
    invoiceId,
    message: `Invoice ${invoiceNo} เกินกำหนดชำระ`,
  });
}

export async function alertPaymentUnreconciled(invoiceId: string, invoiceNo: string, customerCompanyId: string) {
  return createAlert({
    alertType: "PAYMENT_UNRECONCILED",
    severity: "WARNING",
    entityType: "Invoice",
    entityId: invoiceId,
    customerCompanyId,
    message: `Invoice ${invoiceNo} มีการชำระเงินรอยืนยัน`,
  });
}

export async function alertDeliveryProofMissing(jobId: string, jobNo: string) {
  return createAlert({
    alertType: "DELIVERY_PROOF_MISSING",
    severity: "WARNING",
    entityType: "TransportJob",
    entityId: jobId,
    message: `งานขนส่ง ${jobNo} ยังไม่มีหลักฐานส่งของ`,
  });
}
