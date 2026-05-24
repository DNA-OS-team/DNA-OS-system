import { getPrisma } from "../db/prisma.js";
import type { NotificationType } from "../../generated/prisma/enums.js";
import { sendLineMessage, buildMessage, LineApiError } from "../../core/engines/notificationEngine.js";
import { createAlert } from "./alertService.js";

export type SendNotificationInput = {
  type: NotificationType;
  recipientLineId: string;
  templateData: Record<string, unknown>;
  idempotencyKey: string;
  entityType?: string;
  entityId?: string;
};

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  const prisma = getPrisma();

  // Idempotency: skip if already sent or queued
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, status: true },
  });
  if (existing?.status === "SENT") return;

  const message = buildMessage(input.type, input.templateData as never);

  let notifId: string;
  if (existing) {
    notifId = existing.id;
  } else {
    const notif = await prisma.notification.create({
      data: {
        type: input.type,
        recipientLineId: input.recipientLineId,
        templateKey: input.type,
        message,
        payload: input.templateData as Record<string, string | number | boolean | null>,
        idempotencyKey: input.idempotencyKey,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
    notifId = notif.id;
  }

  try {
    await sendLineMessage(input.recipientLineId, message);
    await prisma.notification.update({
      where: { id: notifId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await prisma.notification.update({
      where: { id: notifId },
      data: { status: "FAILED", errorMessage: errMsg },
    });
    await createAlert({
      alertType: "LINE_SEND_FAILED",
      severity: "WARNING",
      entityType: "Notification",
      entityId: notifId,
      message: `LINE ส่งไม่สำเร็จ: ${errMsg.slice(0, 120)}`,
    });
    // Re-throw if caller needs to know
    if (err instanceof LineApiError && err.statusCode >= 500) throw err;
  }
}

// Notify all LINE-linked users of a given company (customers/fleet use LINE auth)
export async function notifyCompanyUsers(
  companyId: string,
  type: NotificationType,
  templateData: Record<string, unknown>,
  idempotencyPrefix: string,
  entityType?: string,
  entityId?: string,
): Promise<void> {
  const prisma = getPrisma();
  const now = new Date();

  // Find active LINE sessions for this company
  const sessions = await prisma.appSession.findMany({
    where: {
      companyId,
      expiresAt: { gt: now },
      revokedAt: null,
    },
    select: { lineUserId: true, userId: true },
    distinct: ["userId"],
  });

  await Promise.allSettled(
    sessions.map((s) =>
      sendNotification({
        type,
        recipientLineId: s.lineUserId,
        templateData,
        idempotencyKey: `${idempotencyPrefix}:${s.userId}`,
        entityType,
        entityId,
      })
    )
  );
}
