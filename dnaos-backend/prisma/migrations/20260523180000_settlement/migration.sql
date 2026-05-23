-- Add isIndividual to companies (WHT 3% flag for individual suppliers)
ALTER TABLE "companies" ADD COLUMN "is_individual" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "SettlementPartnerType" AS ENUM ('SUPPLIER', 'FLEET');
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_ORDERED', 'PAID', 'CANCELLED');
CREATE TYPE "SettlementItemRefType" AS ENUM ('PURCHASE_ORDER', 'TRANSPORT_JOB');

-- CreateTable settlement_batches
CREATE TABLE "settlement_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_no" TEXT NOT NULL,
    "partner_company_id" UUID NOT NULL,
    "partner_type" "SettlementPartnerType" NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "period_from" DATE NOT NULL,
    "period_to" DATE NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "wht_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "payment_due_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_admin_id" UUID,
    "approved_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable settlement_items
CREATE TABLE "settlement_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "settlement_batch_id" UUID NOT NULL,
    "ref_type" "SettlementItemRefType" NOT NULL,
    "ref_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "wht_rate" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "wht_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_items_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "settlement_batches_batch_no_key" ON "settlement_batches"("batch_no");
CREATE INDEX "settlement_batches_partner_company_id_idx" ON "settlement_batches"("partner_company_id");
CREATE INDEX "settlement_batches_partner_type_idx" ON "settlement_batches"("partner_type");
CREATE INDEX "settlement_batches_status_idx" ON "settlement_batches"("status");
CREATE INDEX "settlement_items_settlement_batch_id_idx" ON "settlement_items"("settlement_batch_id");
CREATE INDEX "settlement_items_ref_type_ref_id_idx" ON "settlement_items"("ref_type", "ref_id");

-- ForeignKeys
ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_partner_company_id_fkey"
    FOREIGN KEY ("partner_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_approved_by_admin_id_fkey"
    FOREIGN KEY ("approved_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_batch_id_fkey"
    FOREIGN KEY ("settlement_batch_id") REFERENCES "settlement_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
