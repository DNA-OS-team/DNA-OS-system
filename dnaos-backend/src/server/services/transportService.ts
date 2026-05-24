import type { TransportJobStatus } from "../../generated/prisma/client.js";
import {
  buildDocumentNo,
  getDocumentNoPrefix,
  getNextSequenceFromNumber,
} from "../../core/engines/numberingEngine.js";
import {
  canTransitionTransportStatus,
} from "../../core/engines/dispatchEngine.js";
import { getPrisma } from "../db/prisma.js";
import { writeAuditLog } from "./auditService.js";
import { checkAutoInvoiceTrigger, createInvoiceFromCompletedTrips } from "./debtService.js";
import { notifyCompanyUsers } from "./notificationService.js";

export const transportJobInclude = {
  documentGroup: { include: { project: true } },
  customerOrder: {
    include: {
      customerCompany: true,
      customerSite: true,
    },
  },
  supplierPurchaseOrder: {
    include: { supplierCompany: true },
  },
  fleetCompany: true,
  dropoffSite: true,
  items: {
    include: { productVariant: { include: { product: true } } },
    orderBy: { sortOrder: "asc" as const },
  },
  statusHistory: { orderBy: { createdAt: "desc" as const } },
} as const;

async function generateJobNo(projectNo: string, date: Date) {
  const prisma = getPrisma();
  const prefix = getDocumentNoPrefix(projectNo, "TJ", date);
  const latest = await prisma.transportJob.findFirst({
    where: { jobNo: { startsWith: prefix } },
    orderBy: { jobNo: "desc" },
  });
  return buildDocumentNo({
    projectNo,
    documentType: "TJ",
    date,
    sequence: getNextSequenceFromNumber(latest?.jobNo),
  });
}

export async function createTransportJobFromOrder(
  orderId: string,
  payload: {
    supplierPurchaseOrderId?: string;
    pickupAddress: string;
    fleetCompanyId?: string;
    scheduledPickupAt?: Date;
    scheduledDeliveryAt?: Date;
    transportCost?: number;
    customerDeliveryFee?: number;
    notes?: string;
    assignedBy?: string;
  }
) {
  const prisma = getPrisma();
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      project: true,
      documentGroup: true,
      customerSite: true,
      items: { include: { productVariant: true } },
    },
  });

  if (!order) throw new Error("ไม่พบ order");
  if (!["CONFIRMED", "PROCUREMENT", "DISPATCHING"].includes(order.status)) {
    throw new Error("order ต้องอยู่ในสถานะ CONFIRMED หรือ PROCUREMENT ก่อนสร้างงานขนส่ง");
  }

  const now = new Date();
  const jobNo = await generateJobNo(order.project.projectNo, now);
  const dropoffAddress = [
    order.customerSite.address,
    order.customerSite.district,
    order.customerSite.province,
    order.customerSite.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const job = await prisma.transportJob.create({
    data: {
      jobNo,
      documentGroupId: order.documentGroupId,
      customerOrderId: orderId,
      supplierPurchaseOrderId: payload.supplierPurchaseOrderId ?? null,
      fleetCompanyId: payload.fleetCompanyId ?? null,
      dropoffSiteId: order.customerSiteId,
      pickupAddress: payload.pickupAddress,
      dropoffAddress,
      status: payload.fleetCompanyId ? "ASSIGNED" : "CREATED",
      scheduledPickupAt: payload.scheduledPickupAt ?? null,
      scheduledDeliveryAt: payload.scheduledDeliveryAt ?? null,
      transportCost: payload.transportCost ?? 0,
      customerDeliveryFee: payload.customerDeliveryFee ?? 0,
      notes: payload.notes ?? null,
      assignedBy: payload.assignedBy ?? null,
      items: {
        create: order.items.map((item, index) => ({
          productVariantId: item.productVariantId,
          description: item.productVariant?.name ?? item.description ?? "-",
          quantity: item.quantity,
          unit: item.unit,
          sortOrder: index,
        })),
      },
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: payload.fleetCompanyId ? "ASSIGNED" : "CREATED",
          changedBy: payload.assignedBy ?? null,
          note: "สร้างงานขนส่ง",
        },
      },
    },
    include: transportJobInclude,
  });

  if (order.status === "CONFIRMED" || order.status === "PROCUREMENT") {
    await prisma.customerOrder.update({
      where: { id: orderId },
      data: { status: "DISPATCHING" },
    });
  }

  await writeAuditLog({
    actorUserId: payload.assignedBy,
    entityType: "TransportJob",
    entityId: job.id,
    action: "CREATE",
    newValue: { jobNo, status: job.status },
  });

  return job;
}

export async function assignFleetToJob(
  jobId: string,
  fleetCompanyId: string,
  assignedBy?: string
) {
  const prisma = getPrisma();
  const job = await prisma.transportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("ไม่พบงานขนส่ง");
  if (!canTransitionTransportStatus(job.status, "ASSIGNED")) {
    throw new Error(`ไม่สามารถ assign fleet ในสถานะ ${job.status}`);
  }

  const updated = await prisma.transportJob.update({
    where: { id: jobId },
    data: {
      fleetCompanyId,
      status: "ASSIGNED",
      assignedBy: assignedBy ?? null,
      statusHistory: {
        create: {
          fromStatus: job.status,
          toStatus: "ASSIGNED",
          changedBy: assignedBy ?? null,
          note: "มอบหมายให้ fleet",
        },
      },
    },
    include: transportJobInclude,
  });

  await writeAuditLog({
    actorUserId: assignedBy,
    entityType: "TransportJob",
    entityId: jobId,
    action: "UPDATE",
    field: "status",
    oldValue: job.status,
    newValue: "ASSIGNED",
  });

  return updated;
}

export async function updateTransportJobStatus(
  jobId: string,
  toStatus: TransportJobStatus,
  options: { changedBy?: string; note?: string; companyId?: string } = {}
) {
  const prisma = getPrisma();
  const job = await prisma.transportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("ไม่พบงานขนส่ง");
  if (!canTransitionTransportStatus(job.status, toStatus)) {
    throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${job.status} ไป ${toStatus}`);
  }

  const extra: Record<string, unknown> = {};
  if (toStatus === "ACCEPTED" || toStatus === "GOING_TO_PICKUP") {
    extra.actualPickupAt = toStatus === "GOING_TO_PICKUP" ? new Date() : undefined;
  }
  if (toStatus === "DELIVERED") {
    extra.actualDeliveryAt = new Date();
  }

  const updated = await prisma.transportJob.update({
    where: { id: jobId },
    data: {
      status: toStatus,
      fleetResponseNote:
        toStatus === "ACCEPTED" || toStatus === "CANCELLED"
          ? (options.note ?? null)
          : undefined,
      ...extra,
      statusHistory: {
        create: {
          fromStatus: job.status,
          toStatus,
          changedBy: options.changedBy ?? null,
          note: options.note ?? null,
        },
      },
    },
    include: transportJobInclude,
  });

  await writeAuditLog({
    actorUserId: options.changedBy,
    entityType: "TransportJob",
    entityId: jobId,
    action: "UPDATE",
    field: "status",
    oldValue: job.status,
    newValue: toStatus,
  });

  // When a delivery trip completes, increment deliveredTrips on each matched CustomerOrderItem
  // and check if auto-invoice should be triggered
  if (toStatus === "DELIVERED" && job.customerOrderId) {
    const jobItems = await prisma.transportJobItem.findMany({
      where: { transportJobId: jobId },
      select: { productVariantId: true },
    });
    for (const item of jobItems) {
      if (!item.productVariantId) continue;
      await prisma.customerOrderItem.updateMany({
        where: { customerOrderId: job.customerOrderId, productVariantId: item.productVariantId },
        data: { deliveredTrips: { increment: 1 } },
      });
    }
    const allDone = await checkAutoInvoiceTrigger(job.customerOrderId);
    if (allDone) {
      await createInvoiceFromCompletedTrips(job.customerOrderId).catch(() => {
        // Suppress if invoice already exists or no QT items — admin can create manually
      });
    }

    // Notify customer company about delivery (fire-and-forget)
    const order = await prisma.customerOrder.findUnique({
      where: { id: job.customerOrderId },
      select: { customerCompanyId: true, orderNo: true },
    });
    if (order) {
      void notifyCompanyUsers(
        order.customerCompanyId,
        "TRANSPORT_JOB_DELIVERED",
        { jobNo: updated.jobNo, orderNo: order.orderNo },
        `transport_delivered:${jobId}`,
        "TransportJob",
        jobId,
      );
    }
  }

  return updated;
}

export async function listTransportJobs(filters: {
  status?: TransportJobStatus;
  fleetCompanyId?: string;
  customerOrderId?: string;
  q?: string;
  take?: number;
  skip?: number;
}) {
  const prisma = getPrisma();
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.fleetCompanyId ? { fleetCompanyId: filters.fleetCompanyId } : {}),
    ...(filters.customerOrderId ? { customerOrderId: filters.customerOrderId } : {}),
    ...(filters.q
      ? {
          OR: [
            { jobNo: { contains: filters.q, mode: "insensitive" as const } },
            { pickupAddress: { contains: filters.q, mode: "insensitive" as const } },
            { dropoffAddress: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.transportJob.findMany({
      where,
      include: transportJobInclude,
      orderBy: { createdAt: "desc" },
      take: filters.take ?? 50,
      skip: filters.skip ?? 0,
    }),
    prisma.transportJob.count({ where }),
  ]);

  return { jobs, total };
}

export async function getTransportJob(jobId: string) {
  const prisma = getPrisma();
  const job = await prisma.transportJob.findUnique({
    where: { id: jobId },
    include: transportJobInclude,
  });
  if (!job) throw new Error("ไม่พบงานขนส่ง");
  return job;
}

export async function listFleetCompanies() {
  const prisma = getPrisma();
  return prisma.company.findMany({
    where: { type: "FLEET", status: "ACTIVE" },
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: "asc" },
  });
}
