import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import { getPrisma } from "../db/prisma.js";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type SetInventoryStockInput = {
  supplierProductId: string;
  stockQty: Prisma.Decimal | number | string;
  unit: string;
  lowStockThreshold?: Prisma.Decimal | number | string;
  movementType: "INITIAL" | "ADJUST";
  sourceType?: string | null;
  sourceId?: string | null;
  note?: string | null;
  updatedBy?: string | null;
};

export async function setInventoryStock(input: SetInventoryStockInput) {
  const prisma = getPrisma();

  return prisma.$transaction((tx) => setInventoryStockInTransaction(tx, input));
}

export async function setInventoryStockInTransaction(
  tx: PrismaTransaction,
  input: SetInventoryStockInput
) {
  const nextStockQty = toDecimal(input.stockQty);
  const lowStockThreshold = toDecimal(input.lowStockThreshold ?? 0);
  const existingInventory = await tx.supplierInventory.findUnique({
    where: {
      supplierProductId: input.supplierProductId
    }
  });
  const reservedQty = existingInventory?.reservedQty ?? toDecimal(0);
  const beforeQty = existingInventory?.stockQty ?? toDecimal(0);
  const availableQty = nextStockQty.minus(reservedQty);

  if (availableQty.isNegative()) {
    throw new Error("Stock quantity cannot be lower than reserved quantity");
  }

  const inventory = await tx.supplierInventory.upsert({
    where: {
      supplierProductId: input.supplierProductId
    },
    create: {
      supplierProductId: input.supplierProductId,
      stockQty: nextStockQty,
      reservedQty,
      availableQty,
      unit: input.unit,
      lowStockThreshold,
      updatedBy: input.updatedBy ?? null
    },
    update: {
      stockQty: nextStockQty,
      availableQty,
      unit: input.unit,
      lowStockThreshold,
      updatedBy: input.updatedBy ?? null
    }
  });

  const movement = await tx.supplierInventoryMovement.create({
    data: {
      supplierProductId: input.supplierProductId,
      movementType: input.movementType,
      qty: nextStockQty.minus(beforeQty),
      beforeQty,
      afterQty: nextStockQty,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      note: input.note ?? null,
      createdBy: input.updatedBy ?? null
    }
  });

  return { inventory, movement };
}

function toDecimal(value: Prisma.Decimal | number | string) {
  return typeof value === "object" && "toDecimalPlaces" in value
    ? value
    : new Prisma.Decimal(value);
}
