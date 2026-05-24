import { getPrisma } from "../db/prisma.js";
import type { SettlementPartnerType, SettlementStatus } from "../../generated/prisma/enums.js";
import { buildSettlementItems, calculateNetAmount } from "../../core/engines/settlementEngine.js";

const CREDIT_TERM_MONTHS = 6;

async function generateBatchNo(): Promise<string> {
  const prisma = getPrisma();
  const year = new Date().getFullYear();
  const prefix = `SB-${year}-`;
  const latest = await prisma.settlementBatch.findFirst({
    where: { batchNo: { startsWith: prefix } },
    orderBy: { batchNo: "desc" },
    select: { batchNo: true },
  });
  const seq = latest ? (Number(latest.batchNo.split("-").at(-1)) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

const batchInclude = {
  partnerCompany: { select: { id: true, name: true, bankName: true, bankAccountNo: true, isIndividual: true } },
  createdByAdmin: { select: { id: true, username: true } },
  approvedByAdmin: { select: { id: true, username: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
} as const;

export async function getSettlementList(filters?: {
  status?: SettlementStatus;
  partnerType?: SettlementPartnerType;
  q?: string;
}) {
  const prisma = getPrisma();
  return prisma.settlementBatch.findMany({
    where: {
      status: filters?.status,
      partnerType: filters?.partnerType,
      partnerCompany: filters?.q
        ? { name: { contains: filters.q, mode: "insensitive" } }
        : undefined,
    },
    include: {
      partnerCompany: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSettlementDetail(batchId: string) {
  const prisma = getPrisma();
  return prisma.settlementBatch.findUnique({
    where: { id: batchId },
    include: batchInclude,
  });
}

export async function previewSettlement(partnerCompanyId: string, partnerType: SettlementPartnerType) {
  const items = await buildSettlementItems(partnerCompanyId, partnerType);
  const grossAmount = items.reduce((s, it) => s + it.grossAmount, 0);
  const whtAmount = items.reduce((s, it) => s + it.whtAmount, 0);
  const netAmount = items.reduce((s, it) => s + it.netAmount, 0);
  return { items, grossAmount, whtAmount, netAmount };
}

export async function createSettlementBatch(input: {
  partnerCompanyId: string;
  partnerType: SettlementPartnerType;
  periodFrom: string;
  periodTo: string;
  notes?: string;
  adminId?: string;
}) {
  const prisma = getPrisma();
  const items = await buildSettlementItems(input.partnerCompanyId, input.partnerType);
  if (items.length === 0) throw new Error("ไม่มีรายการที่รอรับเงิน");

  const grossAmount = items.reduce((s, it) => s + it.grossAmount, 0);
  const whtAmount = items.reduce((s, it) => s + it.whtAmount, 0);
  const netAmount = items.reduce((s, it) => s + it.netAmount, 0);

  const batchNo = await generateBatchNo();
  const paymentDueAt = new Date();
  paymentDueAt.setMonth(paymentDueAt.getMonth() + CREDIT_TERM_MONTHS);

  return prisma.settlementBatch.create({
    data: {
      batchNo,
      partnerCompanyId: input.partnerCompanyId,
      partnerType: input.partnerType,
      periodFrom: new Date(input.periodFrom),
      periodTo: new Date(input.periodTo),
      grossAmount,
      whtAmount,
      netAmount,
      paymentDueAt,
      notes: input.notes ?? null,
      createdByAdminId: input.adminId ?? null,
      items: {
        create: items.map((it) => ({
          refType: it.refType,
          refId: it.refId,
          description: it.description,
          grossAmount: it.grossAmount,
          whtRate: it.whtRate,
          whtAmount: it.whtAmount,
          netAmount: it.netAmount,
          sortOrder: it.sortOrder,
        })),
      },
    },
    include: batchInclude,
  });
}

export async function submitSettlementForApproval(batchId: string) {
  const prisma = getPrisma();
  const batch = await prisma.settlementBatch.findUnique({ where: { id: batchId }, select: { status: true } });
  if (!batch) throw new Error("ไม่พบ settlement batch");
  if (batch.status !== "DRAFT") throw new Error("สามารถส่งอนุมัติได้เฉพาะ DRAFT เท่านั้น");

  return prisma.settlementBatch.update({
    where: { id: batchId },
    data: { status: "PENDING_APPROVAL" },
    include: batchInclude,
  });
}

export async function approveSettlement(batchId: string, adminId: string) {
  const prisma = getPrisma();
  const batch = await prisma.settlementBatch.findUnique({ where: { id: batchId }, select: { status: true } });
  if (!batch) throw new Error("ไม่พบ settlement batch");
  if (!["DRAFT", "PENDING_APPROVAL"].includes(batch.status)) throw new Error("ไม่สามารถอนุมัติได้");

  return prisma.settlementBatch.update({
    where: { id: batchId },
    data: { status: "APPROVED", approvedAt: new Date(), approvedByAdminId: adminId },
    include: batchInclude,
  });
}

export async function createPVFromSettlement(batchId: string) {
  const prisma = getPrisma();
  const batch = await prisma.settlementBatch.findUnique({
    where: { id: batchId },
    select: {
      status: true, partnerCompanyId: true, batchNo: true, netAmount: true,
      partnerCompany: { select: { name: true } },
    },
  });
  if (!batch) throw new Error("ไม่พบ settlement batch");
  if (batch.status !== "APPROVED") throw new Error("ต้องอนุมัติก่อนสร้าง PV");

  // Mark as PAYMENT_ORDERED
  const updated = await prisma.settlementBatch.update({
    where: { id: batchId },
    data: { status: "PAYMENT_ORDERED" },
    include: batchInclude,
  });

  return updated;
}

export async function markSettlementPaid(batchId: string, adminId: string) {
  const prisma = getPrisma();
  const batch = await prisma.settlementBatch.findUnique({ where: { id: batchId }, select: { status: true } });
  if (!batch) throw new Error("ไม่พบ settlement batch");
  if (batch.status !== "PAYMENT_ORDERED") throw new Error("ต้องอยู่ในสถานะ PAYMENT_ORDERED");

  return prisma.settlementBatch.update({
    where: { id: batchId },
    data: { status: "PAID", paidAt: new Date() },
    include: batchInclude,
  });
}

export async function cancelSettlement(batchId: string) {
  const prisma = getPrisma();
  const batch = await prisma.settlementBatch.findUnique({ where: { id: batchId }, select: { status: true } });
  if (!batch) throw new Error("ไม่พบ settlement batch");
  if (["PAID", "CANCELLED"].includes(batch.status)) throw new Error("ไม่สามารถยกเลิกได้");

  return prisma.settlementBatch.update({
    where: { id: batchId },
    data: { status: "CANCELLED" },
    include: batchInclude,
  });
}
