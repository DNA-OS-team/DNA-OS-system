import type { DeliveryProofType } from "../../generated/prisma/enums.js";
import { getPrisma } from "../db/prisma.js";

export async function addDeliveryProof(
  transportJobId: string,
  proofType: DeliveryProofType,
  options: { fileUrl?: string; note?: string; adminId?: string }
) {
  const prisma = getPrisma();
  const proof = await prisma.deliveryProof.create({
    data: {
      transportJobId,
      proofType,
      fileUrl: options.fileUrl ?? null,
      note: options.note ?? null,
      uploadedByAdminId: options.adminId ?? null,
    },
  });
  return proof;
}

export async function listDeliveryProofs(transportJobId: string) {
  const prisma = getPrisma();
  return prisma.deliveryProof.findMany({
    where: { transportJobId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteDeliveryProof(proofId: string) {
  const prisma = getPrisma();
  await prisma.deliveryProof.delete({ where: { id: proofId } });
}

export function hasRequiredProofs(proofs: { proofType: DeliveryProofType }[]): boolean {
  const types = new Set(proofs.map((p) => p.proofType));
  return types.has("PHOTO_AT_SITE") || types.has("DELIVERY_NOTE") || types.has("CUSTOMER_SIGNATURE");
}
