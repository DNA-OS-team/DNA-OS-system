-- CreateEnum
CREATE TYPE "CollectionState" AS ENUM ('CURRENT', 'OVERDUE', 'WARNING', 'COLLECTION', 'PROMISED', 'PARTIAL', 'LEGAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('OVERDUE', 'WARNING', 'REMINDER');

-- CreateTable
CREATE TABLE "debt_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_company_id" UUID NOT NULL,
    "collection_state" "CollectionState" NOT NULL DEFAULT 'CURRENT',
    "total_outstanding" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "overdue_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "days_overdue" INTEGER NOT NULL DEFAULT 0,
    "open_invoice_count" INTEGER NOT NULL DEFAULT 0,
    "last_refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_company_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "collection_state" "CollectionState" NOT NULL,
    "promised_pay_date" TIMESTAMP(3),
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_company_id" UUID NOT NULL,
    "invoice_id" UUID,
    "alert_type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "debt_snapshots_customer_company_id_key" ON "debt_snapshots"("customer_company_id");
CREATE INDEX "collection_notes_customer_company_id_idx" ON "collection_notes"("customer_company_id");
CREATE INDEX "alerts_customer_company_id_idx" ON "alerts"("customer_company_id");
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- AddForeignKey
ALTER TABLE "debt_snapshots" ADD CONSTRAINT "debt_snapshots_customer_company_id_fkey"
    FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_notes" ADD CONSTRAINT "collection_notes_customer_company_id_fkey"
    FOREIGN KEY ("customer_company_id") REFERENCES "debt_snapshots"("customer_company_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_notes" ADD CONSTRAINT "collection_notes_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "alerts" ADD CONSTRAINT "alerts_customer_company_id_fkey"
    FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alerts" ADD CONSTRAINT "alerts_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
