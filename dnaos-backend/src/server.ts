import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as Sentry from "@sentry/node";
import { env, getCorsOrigins } from "./config/env.js";
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
    origin: getCorsOrigins()
  });

  await app.register(registerHealthRoutes, { prefix: "/health" });

  return app;
}

const app = await buildServer();

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
