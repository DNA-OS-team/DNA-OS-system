-- AlterTable
ALTER TABLE "admins" ADD COLUMN "singleton_key" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "admins_singleton_key_key" ON "admins"("singleton_key");
