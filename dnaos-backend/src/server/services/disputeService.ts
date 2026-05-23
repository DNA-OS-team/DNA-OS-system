import type { DisputeStatus, DisputeType } from "../../generated/prisma/enums.js";
import { getPrisma } from "../db/prisma.js";

const ALLOWED_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  OPEN: ["INVESTIGATING", "RESOLVED", "REJECTED", "CLOSED"],
  INVESTIGATING: ["WAITING_PARTNER", "WAITING_CUSTOMER", "RESOLVED", "REJECTED", "CLOSED"],
  WAITING_PARTNER: ["INVESTIGATING", "RESOLVED", "REJECTED", "CLOSED"],
  WAITING_CUSTOMER: ["INVESTIGATING", "RESOLVED", "REJECTED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
};

async function generateDisputeNo(date = new Date()) {
  const prisma = getPrisma();
  const year = date.getFullYear();
  const prefix = `DSP-${year}-`;
  const latest = await prisma.dispute.findFirst({
    where: { disputeNo: { startsWith: prefix } },
    orderBy: { disputeNo: "desc" },
    select: { disputeNo: true },
  });
  const seq = latest
    ? (Number(latest.disputeNo.split("-").at(-1)) || 0) + 1
    : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

const disputeInclude = {
  customerOrder: { select: { id: true, orderNo: true } },
  transportJob: { select: { id: true, jobNo: true } },
  supplierPo: { select: { id: true, poNo: true } },
  openedBy: { select: { id: true, name: true } },
  closedBy: { select: { id: true, name: true } },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function createDispute(input: {
  customerOrderId?: string | null;
  transportJobId?: string | null;
  supplierPoId?: string | null;
  disputeType: DisputeType;
  description: string;
  financialImpact?: number | null;
  openedByAdminId?: string | null;
}) {
  const prisma = getPrisma();
  const disputeNo = await generateDisputeNo();

  const dispute = await prisma.dispute.create({
    data: {
      disputeNo,
      customerOrderId: input.customerOrderId ?? null,
      transportJobId: input.transportJobId ?? null,
      supplierPoId: input.supplierPoId ?? null,
      disputeType: input.disputeType,
      status: "OPEN",
      description: input.description,
      financialImpact: input.financialImpact ?? null,
      openedByAdminId: input.openedByAdminId ?? null,
      statusHistory: {
        create: {
          toStatus: "OPEN",
          note: "เปิด dispute",
          changedBy: input.openedByAdminId ?? undefined,
        },
      },
    },
    include: disputeInclude,
  });

  return dispute;
}

export async function updateDisputeStatus(
  disputeId: string,
  toStatus: DisputeStatus,
  options: { note?: string; adminId?: string; resolutionNote?: string }
) {
  const prisma = getPrisma();
  const dispute = await prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } });

  if (!ALLOWED_TRANSITIONS[dispute.status].includes(toStatus)) {
    throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${dispute.status} ไป ${toStatus} ได้`);
  }

  if ((toStatus === "RESOLVED" || toStatus === "CLOSED") && !options.resolutionNote) {
    throw new Error("กรุณาระบุ resolution note ก่อนปิด dispute");
  }

  return prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: toStatus,
      resolutionNote: options.resolutionNote ?? undefined,
      closedByAdminId:
        toStatus === "CLOSED" || toStatus === "RESOLVED"
          ? (options.adminId ?? null)
          : undefined,
      statusHistory: {
        create: {
          fromStatus: dispute.status,
          toStatus,
          note: options.note ?? null,
          changedBy: options.adminId ?? null,
        },
      },
    },
    include: disputeInclude,
  });
}

export async function listDisputes(filters?: {
  status?: DisputeStatus;
  q?: string;
}) {
  const prisma = getPrisma();
  return prisma.dispute.findMany({
    where: {
      status: filters?.status,
      OR: filters?.q
        ? [
            { disputeNo: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { customerOrder: { orderNo: { contains: filters.q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      customerOrder: { select: { id: true, orderNo: true } },
      transportJob: { select: { id: true, jobNo: true } },
      supplierPo: { select: { id: true, poNo: true } },
      openedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getDispute(disputeId: string) {
  const prisma = getPrisma();
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    include: disputeInclude,
  });
}
