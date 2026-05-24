import { getPrisma } from "../../server/db/prisma.js";

const CREDIT_TERM_MONTHS = 6;
const WHT_RATE_INDIVIDUAL = 0.03;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function creditCutoffDate(): Date {
  return addMonths(new Date(), -CREDIT_TERM_MONTHS);
}

export function calculateNetAmount(grossAmount: number, isIndividual: boolean) {
  const whtRate = isIndividual ? WHT_RATE_INDIVIDUAL : 0;
  const whtAmount = Math.round(grossAmount * whtRate * 100) / 100;
  const netAmount = Math.round((grossAmount - whtAmount) * 100) / 100;
  return { grossAmount, whtRate, whtAmount, netAmount };
}

export async function calculateSupplierPayable(supplierCompanyId: string) {
  const prisma = getPrisma();
  const cutoff = creditCutoffDate();

  // Find FULFILLED POs not yet in a PAID/PAYMENT_ORDERED settlement
  const settledIds = await getSettledRefIds("PURCHASE_ORDER");

  const pos = await prisma.supplierPurchaseOrder.findMany({
    where: {
      supplierCompanyId,
      status: "FULFILLED",
      updatedAt: { gte: cutoff },
      id: { notIn: settledIds },
    },
    select: {
      id: true,
      poNo: true,
      totalAmount: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
  });

  const company = await prisma.company.findUnique({
    where: { id: supplierCompanyId },
    select: { isIndividual: true },
  });

  return pos.map((po, i) => {
    const gross = Number(po.totalAmount);
    const calc = calculateNetAmount(gross, company?.isIndividual ?? false);
    return {
      refType: "PURCHASE_ORDER" as const,
      refId: po.id,
      description: `PO: ${po.poNo}`,
      sortOrder: i,
      ...calc,
    };
  });
}

export async function calculateFleetPayable(fleetCompanyId: string) {
  const prisma = getPrisma();
  const cutoff = creditCutoffDate();

  const settledIds = await getSettledRefIds("TRANSPORT_JOB");

  const jobs = await prisma.transportJob.findMany({
    where: {
      fleetCompanyId,
      status: "COMPLETED",
      updatedAt: { gte: cutoff },
      id: { notIn: settledIds },
    },
    select: {
      id: true,
      jobNo: true,
      transportCost: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
  });

  // Fleet companies are typically companies, not individuals — no WHT
  return jobs.map((job, i) => ({
    refType: "TRANSPORT_JOB" as const,
    refId: job.id,
    description: `Job: ${job.jobNo}`,
    sortOrder: i,
    grossAmount: Number(job.transportCost),
    whtRate: 0,
    whtAmount: 0,
    netAmount: Number(job.transportCost),
  }));
}

async function getSettledRefIds(refType: "PURCHASE_ORDER" | "TRANSPORT_JOB"): Promise<string[]> {
  const prisma = getPrisma();
  const items = await prisma.settlementItem.findMany({
    where: {
      refType,
      settlementBatch: { status: { in: ["APPROVED", "PAYMENT_ORDERED", "PAID"] } },
    },
    select: { refId: true },
  });
  return items.map((i) => i.refId);
}

export async function buildSettlementItems(
  partnerCompanyId: string,
  partnerType: "SUPPLIER" | "FLEET"
) {
  if (partnerType === "SUPPLIER") return calculateSupplierPayable(partnerCompanyId);
  return calculateFleetPayable(partnerCompanyId);
}
