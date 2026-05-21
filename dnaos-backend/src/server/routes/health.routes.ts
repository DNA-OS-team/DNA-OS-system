import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    ok: true,
    service: "dnaos-backend",
    timestamp: new Date().toISOString()
  }));
}
