import {
  buildDocumentNo,
  getDocumentNoPrefix,
  getNextSequenceFromNumber
} from "../../core/engines/numberingEngine.js";
import { splitOrderBySupplier } from "../../core/engines/orderSplitEngine.js";
import { getPrisma } from "../db/prisma.js";
import { writeAuditLog } from "./auditService.js";

const defaultVatRate = 0.07;

export const supplierPurchaseOrderInclude = {
  documentGroup: true,
  customerOrder: {
    include: {
      project: true,
      customerCompany: true,
      customerSite: true
    }
  },
  supplierCompany: true,
  items: {
    include: {
      customerOrderItem: true,
      productVariant: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      },
      supplierProduct: true
    },
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

export async function createSupplierPOsFromOrder(orderId: string) {
  const prisma = getPrisma();
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      project: true,
      documentGroup: true,
      items: true
    }
  });

  if (!order) {
    throw new Error("ไม่พบ order");
  }

  if (order.status !== "CONFIRMED") {
    throw new Error("ต้องยืนยัน order ก่อนสร้าง Supplier PO");
  }

  const existingPoCount = await prisma.supplierPurchaseOrder.count({
    where: { customerOrderId: order.id }
  });

  if (existingPoCount > 0) {
    throw new Error("order นี้มี Supplier PO แล้ว ไม่สามารถสร้างซ้ำได้");
  }

  const latestQuotation = await prisma.quotation.findFirst({
    where: { customerOrderId: order.id },
    orderBy: { createdAt: "desc" }
  });

  if (!latestQuotation) {
    throw new Error("ต้องมี QT ก่อนสร้าง Supplier PO");
  }

  const latestPricingSnapshot = await prisma.pricingSnapshot.findFirst({
    where: { customerOrderId: order.id },
    include: {
      items: {
        include: {
          customerOrderItem: true
        },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!latestPricingSnapshot) {
    throw new Error("ต้องคำนวณราคาก่อนสร้าง Supplier PO");
  }

  const splitGroups = splitOrderBySupplier(
    latestPricingSnapshot.items.map((item, index) => ({
      customerOrderItemId: item.customerOrderItemId,
      productVariantId: item.productVariantId,
      supplierCompanyId: item.supplierCompanyId,
      supplierProductId: item.supplierProductId,
      description: item.customerOrderItem?.description ?? null,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitCost: Number(item.supplierUnitCost),
      totalCost: Number(item.supplierTotalCost),
      sortOrder: index
    }))
  );

  const poNos = await buildNextPoNumbers(order.project.projectNo, splitGroups.length);

  const supplierPOs = await prisma.$transaction(async (tx) => {
    const createdPOs = [];

    for (const [index, group] of splitGroups.entries()) {
      const subtotal = roundMoney(
        group.items.reduce((sum, item) => sum + item.totalCost, 0)
      );
      const vatAmount = roundMoney(subtotal * defaultVatRate);
      const totalAmount = roundMoney(subtotal + vatAmount);
      const poNo = poNos[index];

      const createdPo = await tx.supplierPurchaseOrder.create({
        data: {
          poNo,
          documentGroupId: order.documentGroupId,
          customerOrderId: order.id,
          supplierCompanyId: group.supplierCompanyId,
          status: "DRAFT",
          subtotal,
          vatRate: defaultVatRate,
          vatAmount,
          totalAmount,
          items: {
            create: group.items.map((item) => ({
              customerOrderItemId: item.customerOrderItemId,
              productVariantId: item.productVariantId,
              supplierProductId: item.supplierProductId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              sortOrder: item.sortOrder
            }))
          }
        },
        include: supplierPurchaseOrderInclude
      });

      await tx.documentReference.create({
        data: {
          documentGroupId: order.documentGroupId,
          documentId: poNo,
          relatedDocumentId: latestQuotation.quotationNo,
          relationType: "GENERATED_FROM"
        }
      });

      createdPOs.push(createdPo);
    }

    await tx.customerOrder.update({
      where: { id: order.id },
      data: { status: "PROCUREMENT" }
    });

    return createdPOs;
  });

  await Promise.all(
    supplierPOs.map((supplierPO) =>
      writeAuditLog({
        companyId: supplierPO.supplierCompanyId,
        entityType: "supplier_purchase_order",
        entityId: supplierPO.id,
        action: "CREATE",
        newValue: supplierPO
      })
    )
  );

  return supplierPOs;
}

export async function createSupplierPODocument(supplierPoId: string) {
  const prisma = getPrisma();
  const supplierPO = await prisma.supplierPurchaseOrder.findUnique({
    where: { id: supplierPoId },
    include: supplierPurchaseOrderInclude
  });

  if (!supplierPO) {
    throw new Error("ไม่พบ Supplier PO");
  }

  const existingReference = await prisma.documentReference.findFirst({
    where: {
      documentId: supplierPO.poNo
    }
  });

  if (existingReference) {
    return supplierPO;
  }

  await prisma.documentReference.create({
    data: {
      documentGroupId: supplierPO.documentGroupId,
      documentId: supplierPO.poNo,
      relatedDocumentId: supplierPO.customerOrder.orderNo,
      relationType: "GENERATED_FROM"
    }
  });

  return supplierPO;
}

async function buildNextPoNumbers(projectNo: string, count: number) {
  const prisma = getPrisma();
  const date = new Date();
  const prefix = getDocumentNoPrefix(projectNo, "PO", date);
  const latestReference = await prisma.documentReference.findFirst({
    where: {
      documentId: {
        startsWith: prefix
      }
    },
    orderBy: {
      documentId: "desc"
    }
  });
  const firstSequence = getNextSequenceFromNumber(latestReference?.documentId);

  return Array.from({ length: count }, (_, index) =>
    buildDocumentNo({
      projectNo,
      documentType: "PO",
      date,
      sequence: firstSequence + index
    })
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
