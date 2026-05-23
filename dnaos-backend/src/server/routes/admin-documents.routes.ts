import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DocumentTypeCode } from "../../core/engines/numberingEngine.js";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  generateDocumentNo,
  generateStandaloneDocumentNo
} from "../services/documentNumberingService.js";

const searchQuerySchema = z.object({
  q: z.string().trim().optional()
});

const groupNoParamsSchema = z.object({
  groupNo: z.string().trim().min(1)
});

const referenceInputSchema = z.object({
  documentId: z.string().trim().optional(),
  documentType: z.enum(["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"]).optional(),
  relatedDocumentId: z.string().trim().min(1, "Related document is required"),
  relationType: z.enum([
    "SOURCE",
    "PARENT",
    "CHILD",
    "GENERATED_FROM",
    "PAID_BY",
    "SETTLED_BY"
  ])
});

export async function registerAdminDocumentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/documents/search", async (request) => {
    const { q } = searchQuerySchema.parse(request.query);
    const searchTerm = q?.trim();
    const prisma = getPrisma();

    if (!searchTerm) {
      return {
        projects: [],
        documentGroups: [],
        documentReferences: []
      };
    }

    const [projects, documentGroups, documentReferences] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            {
              projectNo: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              title: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              customerCompany: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive"
                }
              }
            }
          ]
        },
        include: {
          customerCompany: true,
          customerSite: true
        },
        take: 20,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.documentGroup.findMany({
        where: {
          OR: [
            {
              groupNo: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              projectNo: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              rootOrderNo: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              title: {
                contains: searchTerm,
                mode: "insensitive"
              }
            }
          ]
        },
        include: {
          project: true,
          customerCompany: true
        },
        take: 20,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.documentReference.findMany({
        where: {
          OR: [
            {
              documentId: {
                contains: searchTerm,
                mode: "insensitive"
              }
            },
            {
              relatedDocumentId: {
                contains: searchTerm,
                mode: "insensitive"
              }
            }
          ]
        },
        include: {
          documentGroup: {
            include: {
              project: true
            }
          }
        },
        take: 20,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return { projects, documentGroups, documentReferences };
  });

  app.get("/document-groups/:groupNo", async (request, reply) => {
    const { groupNo } = groupNoParamsSchema.parse(request.params);
    const documentGroup = await getDocumentGroupOr404(groupNo, reply);

    if (!documentGroup) {
      return reply;
    }

    return { documentGroup };
  });

  app.post("/document-groups/:groupNo/references", async (request, reply) => {
    const { groupNo } = groupNoParamsSchema.parse(request.params);
    const input = referenceInputSchema.parse(request.body);
    const documentGroup = await getDocumentGroupOr404(groupNo, reply);

    if (!documentGroup) {
      return reply;
    }

    if (!input.documentId && !input.documentType) {
      reply.code(400);
      return { error: "Document ID or document type is required" };
    }

    const documentId =
      input.documentId ||
      (await generateDocumentNo(
        documentGroup.project.projectNo,
        input.documentType as DocumentTypeCode
      ));

    const prisma = getPrisma();
    const documentReference = await prisma.documentReference.create({
      data: {
        documentGroupId: documentGroup.id,
        documentId,
        relatedDocumentId: input.relatedDocumentId,
        relationType: input.relationType
      }
    });

    await writeAuditLog({
      companyId: documentGroup.customerCompanyId,
      entityType: "document_reference",
      entityId: documentReference.id,
      action: "CREATE",
      newValue: documentReference
    });

    reply.code(201);
    return { documentReference };
  });

  // --- Standalone Document endpoints ---

  const documentTypeEnum = z.enum(["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"]);

  const standaloneDocItemSchema = z.object({
    description: z.string().trim().min(1, "Description is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().trim().min(1, "Unit is required"),
    unitPrice: z.number().min(0)
  });

  const standaloneDocInputSchema = z.object({
    documentType: documentTypeEnum,
    documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    customerCompanyId: z.string().uuid().optional().nullable(),
    partnerCompanyId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
    customerOrderId: z.string().uuid().optional().nullable(),
    referenceNo: z.string().trim().optional().nullable(),
    recipientAddress: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    vatRate: z.number().min(0).max(100).default(7),
    items: z.array(standaloneDocItemSchema).min(1, "At least one item is required")
  });

  const standaloneListQuerySchema = z.object({
    documentType: documentTypeEnum.optional(),
    q: z.string().trim().optional()
  });

  const idParamsSchema = z.object({ id: z.string().uuid() });

  app.get("/documents/create-options", async () => {
    const prisma = getPrisma();
    const [customers, partners, projects, orders] = await Promise.all([
      prisma.company.findMany({
        where: { type: "CUSTOMER", status: "ACTIVE" },
        select: { id: true, name: true, taxId: true, address: true },
        orderBy: { name: "asc" }
      }),
      prisma.company.findMany({
        where: { type: { in: ["SUPPLIER", "FLEET"] }, status: "ACTIVE" },
        select: { id: true, name: true, type: true, taxId: true, address: true },
        orderBy: { name: "asc" }
      }),
      prisma.project.findMany({
        where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
        select: { id: true, projectNo: true, title: true, customerCompanyId: true },
        orderBy: { createdAt: "desc" },
        take: 200
      }),
      prisma.customerOrder.findMany({
        where: { status: { notIn: ["CANCELLED"] } },
        select: { id: true, orderNo: true, customerCompanyId: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 200
      })
    ]);
    return { customers, partners, projects, orders };
  });

  app.post("/documents/standalone", async (request, reply) => {
    const input = standaloneDocInputSchema.parse(request.body);
    const prisma = getPrisma();

    let projectNo: string | null = null;
    if (input.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        select: { projectNo: true }
      });
      projectNo = project?.projectNo ?? null;
    }

    const documentNo = await generateStandaloneDocumentNo(
      input.documentType as DocumentTypeCode,
      projectNo
    );

    const vatRateDecimal = input.vatRate / 100;
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const vatAmount = subtotal * vatRateDecimal;
    const totalAmount = subtotal + vatAmount;

    const doc = await prisma.standaloneDocument.create({
      data: {
        documentNo,
        documentType: input.documentType,
        documentDate: new Date(`${input.documentDate}T00:00:00.000Z`),
        customerCompanyId: input.customerCompanyId ?? null,
        partnerCompanyId: input.partnerCompanyId ?? null,
        projectId: input.projectId ?? null,
        customerOrderId: input.customerOrderId ?? null,
        referenceNo: input.referenceNo ?? null,
        recipientAddress: input.recipientAddress ?? null,
        notes: input.notes ?? null,
        vatRate: vatRateDecimal,
        subtotal,
        vatAmount,
        totalAmount,
        items: {
          create: input.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            sortOrder: i
          }))
        }
      },
      include: {
        customerCompany: { select: { id: true, name: true, taxId: true, address: true } },
        partnerCompany: { select: { id: true, name: true, taxId: true } },
        project: { select: { id: true, projectNo: true, title: true } },
        customerOrder: { select: { id: true, orderNo: true } },
        items: { orderBy: { sortOrder: "asc" } }
      }
    });

    await writeAuditLog({
      companyId: input.customerCompanyId ?? undefined,
      entityType: "standalone_document",
      entityId: doc.id,
      action: "CREATE",
      newValue: { documentNo: doc.documentNo, documentType: doc.documentType }
    });

    reply.code(201);
    return { document: doc };
  });

  app.get("/documents/standalone", async (request) => {
    const query = standaloneListQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const docs = await prisma.standaloneDocument.findMany({
      where: {
        documentType: query.documentType ?? undefined,
        OR: query.q
          ? [
              { documentNo: { contains: query.q, mode: "insensitive" } },
              {
                customerCompany: {
                  name: { contains: query.q, mode: "insensitive" }
                }
              },
              { referenceNo: { contains: query.q, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        customerCompany: { select: { id: true, name: true } },
        partnerCompany: { select: { id: true, name: true } },
        project: { select: { id: true, projectNo: true, title: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    return { documents: docs };
  });

  app.get("/documents/standalone/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const prisma = getPrisma();
    const doc = await prisma.standaloneDocument.findUnique({
      where: { id },
      include: {
        customerCompany: { select: { id: true, name: true, taxId: true, address: true } },
        partnerCompany: { select: { id: true, name: true, taxId: true } },
        project: { select: { id: true, projectNo: true, title: true } },
        customerOrder: { select: { id: true, orderNo: true } },
        items: { orderBy: { sortOrder: "asc" } }
      }
    });
    if (!doc) {
      reply.code(404);
      return { error: "Document not found" };
    }
    return { document: doc };
  });
}

async function getDocumentGroupOr404(
  groupNo: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const documentGroup = await prisma.documentGroup.findUnique({
    where: {
      groupNo
    },
    include: {
      project: {
        include: {
          customerCompany: true,
          customerSite: true
        }
      },
      customerCompany: true,
      references: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!documentGroup) {
    reply.code(404);
    return null;
  }

  return documentGroup;
}
