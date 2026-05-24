-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quotation_no" TEXT NOT NULL,
    "document_group_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "customer_company_id" UUID NOT NULL,
    "boq_id" UUID NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vat_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "vat_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approval_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quotation_id" UUID NOT NULL,
    "customer_order_item_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total_price" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_no_key" ON "quotations"("quotation_no");

-- CreateIndex
CREATE INDEX "quotations_document_group_id_idx" ON "quotations"("document_group_id");

-- CreateIndex
CREATE INDEX "quotations_customer_order_id_idx" ON "quotations"("customer_order_id");

-- CreateIndex
CREATE INDEX "quotations_customer_company_id_idx" ON "quotations"("customer_company_id");

-- CreateIndex
CREATE INDEX "quotations_boq_id_idx" ON "quotations"("boq_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_items_customer_order_item_id_idx" ON "quotation_items"("customer_order_item_id");

-- CreateIndex
CREATE INDEX "quotation_items_product_variant_id_idx" ON "quotation_items"("product_variant_id");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_boq_id_fkey" FOREIGN KEY ("boq_id") REFERENCES "boqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_customer_order_item_id_fkey" FOREIGN KEY ("customer_order_item_id") REFERENCES "customer_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
