import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as Sentry from "@sentry/node";
import { env, getCorsOrigins } from "./config/env.js";
import { registerAdminCustomerRoutes } from "./server/routes/admin-customers.routes.js";
import { registerAdminProductRoutes } from "./server/routes/admin-products.routes.js";
import { registerAuthRoutes } from "./server/routes/auth.routes.js";
import { registerHealthRoutes } from "./server/routes/health.routes.js";

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

  await app.register(registerHealthRoutes, { prefix: "/health" });
  await app.register(registerAuthRoutes, { prefix: "/auth" });
  await app.register(registerAdminCustomerRoutes, { prefix: "/admin/customers" });
  await app.register(registerAdminProductRoutes, { prefix: "/admin/products" });

  return app;
}

const app = await buildServer();

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
