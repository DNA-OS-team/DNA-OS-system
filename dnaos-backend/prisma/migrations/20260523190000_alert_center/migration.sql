-- Add new AlertType enum values
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'NEW_ORDER';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'SUPPLIER_NOT_CONFIRMED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'TRUCK_NOT_ASSIGNED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'TRUCK_DELAYED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'DOCUMENT_PENDING_APPROVAL';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'INVOICE_OVERDUE';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'PAYMENT_UNRECONCILED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'LOW_MARGIN';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'CREDIT_LIMIT_EXCEEDED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'DELIVERY_PROOF_MISSING';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'LINE_SEND_FAILED';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'PDF_GENERATION_FAILED';

-- Add AlertSeverity enum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- Update alerts table: make customer_company_id nullable, add new columns
ALTER TABLE "alerts" ALTER COLUMN "customer_company_id" DROP NOT NULL;
ALTER TABLE "alerts" ADD COLUMN "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING';
ALTER TABLE "alerts" ADD COLUMN "entity_type" TEXT;
ALTER TABLE "alerts" ADD COLUMN "entity_id" UUID;
ALTER TABLE "alerts" ADD COLUMN "resolved_at" TIMESTAMP(3);
ALTER TABLE "alerts" ADD COLUMN "resolved_by_admin_id" UUID;

-- Add indexes
CREATE INDEX "alerts_alert_type_idx" ON "alerts"("alert_type");
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");
CREATE INDEX "alerts_resolved_at_idx" ON "alerts"("resolved_at");

-- Add FK for resolved_by_admin_id
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_admin_id_fkey"
    FOREIGN KEY ("resolved_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update FK for customer_company_id to use SET NULL instead of CASCADE (now nullable)
ALTER TABLE "alerts" DROP CONSTRAINT IF EXISTS "alerts_customer_company_id_fkey";
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_customer_company_id_fkey"
    FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
