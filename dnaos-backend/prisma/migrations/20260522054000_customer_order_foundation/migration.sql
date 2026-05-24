-- CreateEnum
CREATE TYPE "CustomerOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PRICING', 'QUOTED', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_no" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "document_group_id" UUID NOT NULL,
    "customer_company_id" UUID NOT NULL,
    "customer_site_id" UUID NOT NULL,
    "status" "CustomerOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_delivery_at" TIMESTAMP(3),
    "delivery_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_order_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_order_no_key" ON "customer_orders"("order_no");

-- CreateIndex
CREATE INDEX "customer_orders_project_id_idx" ON "customer_orders"("project_id");

-- CreateIndex
CREATE INDEX "customer_orders_document_group_id_idx" ON "customer_orders"("document_group_id");

-- CreateIndex
CREATE INDEX "customer_orders_customer_company_id_idx" ON "customer_orders"("customer_company_id");

-- CreateIndex
CREATE INDEX "customer_orders_customer_site_id_idx" ON "customer_orders"("customer_site_id");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE INDEX "customer_order_items_customer_order_id_idx" ON "customer_order_items"("customer_order_id");

-- CreateIndex
CREATE INDEX "customer_order_items_product_variant_id_idx" ON "customer_order_items"("product_variant_id");

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_site_id_fkey" FOREIGN KEY ("customer_site_id") REFERENCES "customer_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
