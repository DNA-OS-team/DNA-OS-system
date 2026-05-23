-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CustomerOrderStatus" ADD VALUE 'DISPATCHING';
ALTER TYPE "CustomerOrderStatus" ADD VALUE 'PARTIALLY_DELIVERED';
ALTER TYPE "CustomerOrderStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "CustomerOrderStatus" ADD VALUE 'INVOICED';
ALTER TYPE "CustomerOrderStatus" ADD VALUE 'PAID';
