import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DocumentTypeCode } from "../../core/engines/numberingEngine.js";
import { getPrisma } from "../db/prisma.js";
import { requireAdminAccess } from "../services/authService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  generateDocumentGroupNo,
  generateDocumentNo,
  generateProjectNo
} from "../services/documentNumberingService.js";

const projectInputSchema = z.object({
  customerCompanyId: z.string().uuid(),
  customerSiteId: z.string().uuid(),
  title: z.string().trim().min(1, "Project title is required"),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional().default("ACTIVE")
});

const listProjectsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["all", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional().default("all")
});

const projectNoParamsSchema = z.object({
  projectNo: z.string().trim().min(1)
});

const documentGroupInputSchema = z.object({
  title: z.string().trim().min(1, "Document group title is required"),
  rootOrderId: z.string().uuid().optional().nullable(),
  rootOrderNo: z.string().trim().optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "ARCHIVED"]).optional().default("OPEN")
});

const documentNumberInputSchema = z.object({
  documentType: z.enum(["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"])
});

export async function registerAdminProjectRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdminAccess);

  app.get("/customer-options", async () => {
    const prisma = getPrisma();
    const customers = await prisma.company.findMany({
      where: {
        type: "CUSTOMER",
        status: "ACTIVE"
      },
      include: {
        customerSites: {
          where: {
            isActive: true
          },
          orderBy: {
            siteName: "asc"
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return { customers };
  });

  app.get("/", async (request) => {
    const query = listProjectsQuerySchema.parse(request.query);
    const prisma = getPrisma();
    const projects = await prisma.project.findMany({
      where: {
        status: query.status === "all" ? undefined : query.status,
        OR: query.q
          ? [
              {
                projectNo: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                title: {
                  contains: query.q,
                  mode: "insensitive"
                }
              },
              {
                customerCompany: {
                  name: {
                    contains: query.q,
                    mode: "insensitive"
                  }
                }
              }
            ]
          : undefined
      },
      include: {
        customerCompany: true,
        customerSite: true,
        _count: {
          select: {
            documentGroups: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      projects: projects.map((project) => ({
        ...project,
        documentGroupCount: project._count.documentGroups,
        _count: undefined
      }))
    };
  });

  app.post("/", async (request, reply) => {
    const input = projectInputSchema.parse(request.body);
    const customerSite = await getCustomerSiteOr404(
      input.customerCompanyId,
      input.customerSiteId,
      reply
    );

    if (!customerSite) {
      return reply;
    }

    const prisma = getPrisma();
    const projectNo = await generateProjectNo();
    const project = await prisma.project.create({
      data: {
        projectNo,
        customerCompanyId: input.customerCompanyId,
        customerSiteId: input.customerSiteId,
        title: input.title,
        status: input.status
      },
      include: {
        customerCompany: true,
        customerSite: true
      }
    });

    await writeAuditLog({
      companyId: project.customerCompanyId,
      entityType: "project",
      entityId: project.id,
      action: "CREATE",
      newValue: project
    });

    reply.code(201);
    return { project };
  });

  app.get("/:projectNo", async (request, reply) => {
    const { projectNo } = projectNoParamsSchema.parse(request.params);
    const project = await getProjectOr404(projectNo, reply);

    if (!project) {
      return reply;
    }

    return { project };
  });

  app.patch("/:projectNo", async (request, reply) => {
    const { projectNo } = projectNoParamsSchema.parse(request.params);
    const input = projectInputSchema.parse(request.body);
    const [existingProject, customerSite] = await Promise.all([
      getProjectOr404(projectNo, reply),
      getCustomerSiteOr404(input.customerCompanyId, input.customerSiteId, reply)
    ]);

    if (!existingProject || !customerSite) {
      return reply;
    }

    const prisma = getPrisma();
    const project = await prisma.project.update({
      where: {
        projectNo
      },
      data: {
        customerCompanyId: input.customerCompanyId,
        customerSiteId: input.customerSiteId,
        title: input.title,
        status: input.status
      },
      include: {
        customerCompany: true,
        customerSite: true
      }
    });

    await writeAuditLog({
      companyId: project.customerCompanyId,
      entityType: "project",
      entityId: project.id,
      action: "UPDATE",
      oldValue: existingProject,
      newValue: project
    });

    return { project };
  });

  app.get("/:projectNo/documents", async (request, reply) => {
    const { projectNo } = projectNoParamsSchema.parse(request.params);
    const project = await getProjectOr404(projectNo, reply);

    if (!project) {
      return reply;
    }

    const prisma = getPrisma();
    const documentGroups = await prisma.documentGroup.findMany({
      where: {
        projectId: project.id
      },
      include: {
        references: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { project, documentGroups };
  });

  app.post("/:projectNo/document-groups", async (request, reply) => {
    const { projectNo } = projectNoParamsSchema.parse(request.params);
    const input = documentGroupInputSchema.parse(request.body);
    const project = await getProjectOr404(projectNo, reply);

    if (!project) {
      return reply;
    }

    const prisma = getPrisma();
    const groupNo = await generateDocumentGroupNo();
    const documentGroup = await prisma.documentGroup.create({
      data: {
        groupNo,
        projectId: project.id,
        projectNo: project.projectNo,
        rootOrderId: input.rootOrderId ?? null,
        rootOrderNo: input.rootOrderNo || null,
        customerCompanyId: project.customerCompanyId,
        title: input.title,
        status: input.status
      },
      include: {
        references: true
      }
    });

    await writeAuditLog({
      companyId: project.customerCompanyId,
      entityType: "document_group",
      entityId: documentGroup.id,
      action: "CREATE",
      newValue: documentGroup
    });

    reply.code(201);
    return { documentGroup };
  });

  app.post("/:projectNo/document-number", async (request, reply) => {
    const { projectNo } = projectNoParamsSchema.parse(request.params);
    const input = documentNumberInputSchema.parse(request.body);
    const project = await getProjectOr404(projectNo, reply);

    if (!project) {
      return reply;
    }

    const documentNo = await generateDocumentNo(
      project.projectNo,
      input.documentType as DocumentTypeCode
    );

    return { documentNo };
  });
}

async function getProjectOr404(
  projectNo: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: {
      projectNo
    },
    include: {
      customerCompany: true,
      customerSite: true
    }
  });

  if (!project) {
    reply.code(404);
    return null;
  }

  return project;
}

async function getCustomerSiteOr404(
  customerCompanyId: string,
  customerSiteId: string,
  reply: { code: (statusCode: number) => void }
) {
  const prisma = getPrisma();
  const customerSite = await prisma.customerSite.findFirst({
    where: {
      id: customerSiteId,
      customerCompanyId,
      customerCompany: {
        type: "CUSTOMER"
      }
    }
  });

  if (!customerSite) {
    reply.code(404);
    return null;
  }

  return customerSite;
}
