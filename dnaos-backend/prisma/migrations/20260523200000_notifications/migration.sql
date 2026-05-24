-- Create notification enums
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

CREATE TYPE "NotificationType" AS ENUM (
  'ORDER_CREATED',
  'SUPPLIER_PO_CREATED',
  'SUPPLIER_PO_CONFIRMED',
  'TRANSPORT_JOB_ASSIGNED',
  'TRANSPORT_JOB_DELIVERED',
  'INVOICE_CREATED',
  'PAYMENT_CONFIRMED',
  'DEBT_OVERDUE'
);

-- Create notifications table
CREATE TABLE "notifications" (
    "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "type"             "NotificationType" NOT NULL,
    "channel"          TEXT         NOT NULL DEFAULT 'LINE',
    "recipient_line_id" TEXT,
    "template_key"     TEXT         NOT NULL,
    "message"          TEXT         NOT NULL,
    "payload"          JSONB        NOT NULL DEFAULT '{}',
    "status"           "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotency_key"  TEXT         NOT NULL,
    "sent_at"          TIMESTAMP(3),
    "error_message"    TEXT,
    "entity_type"      TEXT,
    "entity_id"        UUID,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_idempotency_key_key" ON "notifications"("idempotency_key");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_entity_type_entity_id_idx" ON "notifications"("entity_type", "entity_id");
