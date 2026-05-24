-- CreateEnum
CREATE TYPE "DeliveryProofType" AS ENUM ('PHOTO_BEFORE_LOADING', 'PHOTO_AFTER_LOADING', 'PHOTO_AT_SITE', 'SCALE_TICKET', 'DELIVERY_NOTE', 'CUSTOMER_SIGNATURE', 'GPS_LOCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('SHORT_DELIVERY', 'WRONG_MATERIAL', 'LATE_DELIVERY', 'DAMAGED_MATERIAL', 'PRICE_DISPUTE', 'PAYMENT_DISPUTE', 'CUSTOMER_REJECTED', 'TRANSPORT_FAILED', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'WAITING_PARTNER', 'WAITING_CUSTOMER', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "delivery_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transport_job_id" UUID NOT NULL,
    "proof_type" "DeliveryProofType" NOT NULL,
    "file_url" TEXT,
    "note" TEXT,
    "uploaded_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispute_no" TEXT NOT NULL,
    "customer_order_id" UUID,
    "transport_job_id" UUID,
    "supplier_po_id" UUID,
    "dispute_type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "resolution_note" TEXT,
    "financial_impact" DECIMAL(14,2),
    "opened_by_admin_id" UUID,
    "closed_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" UUID NOT NULL,
    "from_status" "DisputeStatus",
    "to_status" "DisputeStatus" NOT NULL,
    "note" TEXT,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_proofs_transport_job_id_idx" ON "delivery_proofs"("transport_job_id");
CREATE INDEX "delivery_proofs_proof_type_idx" ON "delivery_proofs"("proof_type");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_dispute_no_key" ON "disputes"("dispute_no");
CREATE INDEX "disputes_customer_order_id_idx" ON "disputes"("customer_order_id");
CREATE INDEX "disputes_transport_job_id_idx" ON "disputes"("transport_job_id");
CREATE INDEX "disputes_supplier_po_id_idx" ON "disputes"("supplier_po_id");
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "dispute_status_history_dispute_id_idx" ON "dispute_status_history"("dispute_id");

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_transport_job_id_fkey" FOREIGN KEY ("transport_job_id") REFERENCES "transport_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_uploaded_by_admin_id_fkey" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transport_job_id_fkey" FOREIGN KEY ("transport_job_id") REFERENCES "transport_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_supplier_po_id_fkey" FOREIGN KEY ("supplier_po_id") REFERENCES "supplier_purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_admin_id_fkey" FOREIGN KEY ("opened_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_closed_by_admin_id_fkey" FOREIGN KEY ("closed_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_status_history" ADD CONSTRAINT "dispute_status_history_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
