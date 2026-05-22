import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DocumentTypeCode } from "../../core/engines/numberingEngine.js";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import { generateDocumentNo } from "../services/documentNumberingService.js";

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
