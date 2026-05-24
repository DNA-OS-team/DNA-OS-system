-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentGroupStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ORD', 'BOQ', 'QT', 'PO', 'INV', 'RCP', 'PV', 'PMT');

-- CreateEnum
CREATE TYPE "DocumentReferenceRelationType" AS ENUM ('SOURCE', 'PARENT', 'CHILD', 'GENERATED_FROM', 'PAID_BY', 'SETTLED_BY');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_no" TEXT NOT NULL,
    "customer_company_id" UUID NOT NULL,
    "customer_site_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_no" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "project_no" TEXT NOT NULL,
    "root_order_id" UUID,
    "root_order_no" TEXT,
    "customer_company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DocumentGroupStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_references" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_group_id" UUID,
    "document_id" TEXT NOT NULL,
    "related_document_id" TEXT NOT NULL,
    "relation_type" "DocumentReferenceRelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_no_key" ON "projects"("project_no");

-- CreateIndex
CREATE INDEX "projects_customer_company_id_idx" ON "projects"("customer_company_id");

-- CreateIndex
CREATE INDEX "projects_customer_site_id_idx" ON "projects"("customer_site_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_groups_group_no_key" ON "document_groups"("group_no");

-- CreateIndex
CREATE INDEX "document_groups_project_id_idx" ON "document_groups"("project_id");

-- CreateIndex
CREATE INDEX "document_groups_project_no_idx" ON "document_groups"("project_no");

-- CreateIndex
CREATE INDEX "document_groups_customer_company_id_idx" ON "document_groups"("customer_company_id");

-- CreateIndex
CREATE INDEX "document_groups_root_order_no_idx" ON "document_groups"("root_order_no");

-- CreateIndex
CREATE INDEX "document_groups_status_idx" ON "document_groups"("status");

-- CreateIndex
CREATE INDEX "document_references_document_group_id_idx" ON "document_references"("document_group_id");

-- CreateIndex
CREATE INDEX "document_references_document_id_idx" ON "document_references"("document_id");

-- CreateIndex
CREATE INDEX "document_references_related_document_id_idx" ON "document_references"("related_document_id");

-- CreateIndex
CREATE INDEX "document_references_relation_type_idx" ON "document_references"("relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "document_references_document_id_related_document_id_relation_type_key" ON "document_references"("document_id", "related_document_id", "relation_type");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_site_id_fkey" FOREIGN KEY ("customer_site_id") REFERENCES "customer_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_references" ADD CONSTRAINT "document_references_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
