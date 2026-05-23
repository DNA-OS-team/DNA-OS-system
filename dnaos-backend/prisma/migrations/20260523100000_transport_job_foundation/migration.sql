-- CreateEnum
CREATE TYPE "TransportJobStatus" AS ENUM ('CREATED', 'ASSIGNED', 'ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED_PICKUP', 'LOADED', 'IN_TRANSIT', 'ARRIVED_SITE', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "transport_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_no" TEXT NOT NULL,
    "document_group_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "supplier_purchase_order_id" UUID,
    "fleet_company_id" UUID,
    "dropoff_site_id" UUID,
    "pickup_address" TEXT NOT NULL,
    "dropoff_address" TEXT NOT NULL,
    "status" "TransportJobStatus" NOT NULL DEFAULT 'CREATED',
    "scheduled_pickup_at" TIMESTAMP(3),
    "scheduled_delivery_at" TIMESTAMP(3),
    "actual_pickup_at" TIMESTAMP(3),
    "actual_delivery_at" TIMESTAMP(3),
    "transport_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "customer_delivery_fee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fleet_response_note" TEXT,
    "assigned_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_job_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transport_job_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_job_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_job_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transport_job_id" UUID NOT NULL,
    "from_status" "TransportJobStatus",
    "to_status" "TransportJobStatus" NOT NULL,
    "changed_by" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_job_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_jobs_job_no_key" ON "transport_jobs"("job_no");

-- CreateIndex
CREATE INDEX "transport_jobs_document_group_id_idx" ON "transport_jobs"("document_group_id");

-- CreateIndex
CREATE INDEX "transport_jobs_customer_order_id_idx" ON "transport_jobs"("customer_order_id");

-- CreateIndex
CREATE INDEX "transport_jobs_supplier_purchase_order_id_idx" ON "transport_jobs"("supplier_purchase_order_id");

-- CreateIndex
CREATE INDEX "transport_jobs_fleet_company_id_idx" ON "transport_jobs"("fleet_company_id");

-- CreateIndex
CREATE INDEX "transport_jobs_status_idx" ON "transport_jobs"("status");

-- CreateIndex
CREATE INDEX "transport_job_items_transport_job_id_idx" ON "transport_job_items"("transport_job_id");

-- CreateIndex
CREATE INDEX "transport_job_items_product_variant_id_idx" ON "transport_job_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "transport_job_status_history_transport_job_id_idx" ON "transport_job_status_history"("transport_job_id");

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_supplier_purchase_order_id_fkey" FOREIGN KEY ("supplier_purchase_order_id") REFERENCES "supplier_purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_fleet_company_id_fkey" FOREIGN KEY ("fleet_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_dropoff_site_id_fkey" FOREIGN KEY ("dropoff_site_id") REFERENCES "customer_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_job_items" ADD CONSTRAINT "transport_job_items_transport_job_id_fkey" FOREIGN KEY ("transport_job_id") REFERENCES "transport_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_job_items" ADD CONSTRAINT "transport_job_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_job_status_history" ADD CONSTRAINT "transport_job_status_history_transport_job_id_fkey" FOREIGN KEY ("transport_job_id") REFERENCES "transport_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "document_references_document_id_related_document_id_relation_ty" RENAME TO "document_references_document_id_related_document_id_relatio_key";

-- RenameIndex
ALTER INDEX "supplier_purchase_orders_customer_order_id_supplier_company_id_" RENAME TO "supplier_purchase_orders_customer_order_id_supplier_company_key";
