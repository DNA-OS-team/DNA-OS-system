-- CreateEnum
CREATE TYPE "OrderRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "image_url" TEXT;

-- CreateTable
CREATE TABLE "customer_order_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "req_no" TEXT NOT NULL,
    "customer_company_id" UUID NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "requested_delivery_at" TIMESTAMP(3),
    "note" TEXT,
    "status" "OrderRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_order_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_request_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_order_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_requests_req_no_key" ON "customer_order_requests"("req_no");

-- CreateIndex
CREATE INDEX "customer_order_requests_customer_company_id_idx" ON "customer_order_requests"("customer_company_id");

-- CreateIndex
CREATE INDEX "customer_order_requests_status_idx" ON "customer_order_requests"("status");

-- CreateIndex
CREATE INDEX "customer_order_request_items_request_id_idx" ON "customer_order_request_items"("request_id");

-- AddForeignKey
ALTER TABLE "customer_order_requests" ADD CONSTRAINT "customer_order_requests_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_request_items" ADD CONSTRAINT "customer_order_request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "customer_order_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_request_items" ADD CONSTRAINT "customer_order_request_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
