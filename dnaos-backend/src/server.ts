import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as Sentry from "@sentry/node";
import { env, getCorsOrigins } from "./config/env.js";
import { registerSwagger } from "./config/swagger.js";
import { registerAdminCustomerRoutes } from "./server/routes/admin-customers.routes.js";
import { registerAdminDashboardRoutes } from "./server/routes/admin-dashboard.routes.js";
import { registerAdminDocumentRoutes } from "./server/routes/admin-documents.routes.js";
import { registerAdminPartnerProductRoutes } from "./server/routes/admin-partner-products.routes.js";
import { registerAdminOrderRoutes } from "./server/routes/admin-orders.routes.js";
import { registerAdminProductRoutes } from "./server/routes/admin-products.routes.js";
import { registerAdminProcurementRoutes } from "./server/routes/admin-procurement.routes.js";
import { registerAdminProjectRoutes } from "./server/routes/admin-projects.routes.js";
import { registerAuthRoutes } from "./server/routes/auth.routes.js";
import { registerHealthRoutes } from "./server/routes/health.routes.js";
import { registerPartnerPurchaseOrderRoutes } from "./server/routes/partner-purchase-orders.routes.js";
import { registerAdminLogisticsRoutes } from "./server/routes/admin-logistics.routes.js";
import { registerFleetJobRoutes } from "./server/routes/fleet-jobs.routes.js";
import { registerAdminDisputeRoutes } from "./server/routes/admin-disputes.routes.js";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV
  });
}

export async function buildServer() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: getCorsOrigins(),
    credentials: true
  });

  await registerSwagger(app);

  await app.register(registerHealthRoutes, { prefix: "/health" });
  await app.register(registerAuthRoutes, { prefix: "/auth" });
  await app.register(registerAdminDashboardRoutes, { prefix: "/admin/dashboard" });
  await app.register(registerAdminCustomerRoutes, { prefix: "/admin/customers" });
  await app.register(registerAdminOrderRoutes, { prefix: "/admin/orders" });
  await app.register(registerAdminProcurementRoutes, { prefix: "/admin/procurement" });
  await app.register(registerAdminProductRoutes, { prefix: "/admin/products" });
  await app.register(registerAdminProjectRoutes, { prefix: "/admin/projects" });
  await app.register(registerAdminDocumentRoutes, { prefix: "/admin" });
  await app.register(registerAdminPartnerProductRoutes, { prefix: "/admin" });
  await app.register(registerPartnerPurchaseOrderRoutes, { prefix: "/partner/purchase-orders" });
  await app.register(registerAdminLogisticsRoutes, { prefix: "/admin/logistics" });
  await app.register(registerFleetJobRoutes, { prefix: "/fleet/jobs" });
  await app.register(registerAdminDisputeRoutes, { prefix: "/admin/disputes" });

  return app;
}

const app = await buildServer();

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
