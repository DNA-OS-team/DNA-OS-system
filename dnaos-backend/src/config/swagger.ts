import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import { env } from "./env.js";

type SwaggerTag = {
  name: string;
  description: string;
};

const swaggerTags: SwaggerTag[] = [
  {
    name: "01 Health",
    description: "ตรวจสอบสถานะ backend และ health check"
  },
  {
    name: "02 Auth & Session",
    description: "Admin login, Superadmin login, LINE auth, logout และ session"
  },
  {
    name: "03 Admin Dashboard",
    description: "ข้อมูลสรุปหน้าแรกของแอดมิน"
  },
  {
    name: "04 Customer & Site",
    description: "ลูกค้า ไซต์งาน และเครดิตลูกค้า"
  },
  {
    name: "05 Product Catalog",
    description: "หมวดสินค้า สินค้า และ product variant"
  },
  {
    name: "06 Project",
    description: "โปรเจกต์ เลขโปรเจกต์ และชุดเอกสารของโปรเจกต์"
  },
  {
    name: "07 Document",
    description: "ค้นหาเอกสาร ออกเลขเอกสาร และ document reference"
  },
  {
    name: "08 Order Pricing BOQ Quotation",
    description: "Order, pricing snapshot, BOQ และ quotation"
  },
  {
    name: "09 Supplier PO & Procurement",
    description: "Supplier purchase order และงานจัดซื้อ"
  },
  {
    name: "10 Partner Product & Inventory",
    description: "Partner product submission, approval และ supplier inventory"
  },
  {
    name: "11 Partner Supplier PO",
    description: "Supplier ดู ยืนยัน หรือปฏิเสธ PO ของตัวเอง"
  },
  {
    name: "12 Transport & Fleet",
    description: "Transport job, fleet assignment และ dispatch workflow"
  },
  {
    name: "99 Uncategorized",
    description: "API ที่ยังไม่ได้จัดเข้าหมวดเฉพาะ"
  }
];

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    transform: (input) => {
      const schema = (input.schema ?? {}) as Record<string, unknown>;
      const { url, route } = input;
      const tag = resolveSwaggerTag(url);
      const routeSchema = {
        ...schema,
        tags: Array.isArray(schema.tags) && schema.tags.length > 0
          ? schema.tags
          : [tag.name],
        summary:
          typeof schema.summary === "string"
            ? schema.summary
            : buildOperationSummary(route?.method, url),
        security: Array.isArray(schema.security)
          ? schema.security
          : resolveSwaggerSecurity(url)
      };

      return {
        schema: routeSchema,
        url
      };
    },
    openapi: {
      info: {
        title: "DNA OS Backend API",
        description:
          "เอกสาร API สำหรับ DNA OS Construction Platform ฝั่ง backend",
        version: "0.1.0"
      },
      servers: [
        {
          url: env.APP_URL,
          description: "Backend server"
        }
      ],
      tags: swaggerTags,
      components: {
        securitySchemes: {
          adminSession: {
            type: "apiKey",
            in: "cookie",
            name: "dnaos_admin_session"
          },
          lineSession: {
            type: "apiKey",
            in: "cookie",
            name: "dnaos_line_session"
          }
        }
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    staticCSP: true,
    transformStaticCSP: (header) => header,
    uiConfig: {
      deepLinking: true,
      displayRequestDuration: true,
      docExpansion: "list",
      operationsSorter: "method",
      persistAuthorization: true
    }
  });
}

function resolveSwaggerTag(url: string) {
  if (url.startsWith("/health")) {
    return swaggerTags[0];
  }

  if (url.startsWith("/auth")) {
    return swaggerTags[1];
  }

  if (url.startsWith("/admin/dashboard")) {
    return swaggerTags[2];
  }

  if (url.startsWith("/admin/customers")) {
    return swaggerTags[3];
  }

  if (url.startsWith("/admin/products")) {
    return swaggerTags[4];
  }

  if (url.startsWith("/admin/projects")) {
    return swaggerTags[5];
  }

  if (url.startsWith("/admin/documents") || url.startsWith("/admin/document-groups")) {
    return swaggerTags[6];
  }

  if (url.startsWith("/admin/orders")) {
    return swaggerTags[7];
  }

  if (url.startsWith("/admin/procurement")) {
    return swaggerTags[8];
  }

  if (url.startsWith("/admin/partner-products") || url.startsWith("/admin/supplier-inventory")) {
    return swaggerTags[9];
  }

  if (url.startsWith("/partner/purchase-orders")) {
    return swaggerTags[10];
  }

  if (url.includes("transport") || url.includes("fleet")) {
    return swaggerTags[11];
  }

  return swaggerTags[12];
}

function resolveSwaggerSecurity(url: string) {
  if (url.startsWith("/admin")) {
    return [{ adminSession: [] }];
  }

  if (url.startsWith("/partner")) {
    return [{ lineSession: [] }];
  }

  if (url === "/auth/logout") {
    return [{ adminSession: [] }, { lineSession: [] }];
  }

  return [];
}

function buildOperationSummary(method: string | string[] | undefined, url: string) {
  const routeMethod = Array.isArray(method) ? method.join(",") : method;
  const normalizedMethod = routeMethod?.toUpperCase() ?? "GET";
  const action = methodSummaryMap[normalizedMethod] ?? "เรียกใช้งาน";

  return `${action} ${url}`;
}

const methodSummaryMap: Record<string, string> = {
  GET: "ดูข้อมูล",
  POST: "สร้างหรือดำเนินการ",
  PATCH: "อัปเดตข้อมูล",
  PUT: "แทนที่ข้อมูล",
  DELETE: "ลบข้อมูล"
};
