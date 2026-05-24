import type { FastifyInstance } from "fastify";
import { serve } from "inngest/fastify";
import { inngest, allFunctions } from "../jobs/inngest.js";

export async function registerWebhookRoutes(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST", "PUT"],
    url: "/inngest",
    handler: serve({ client: inngest, functions: allFunctions }),
  });
}
