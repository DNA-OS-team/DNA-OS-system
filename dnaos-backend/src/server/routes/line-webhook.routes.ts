import type { FastifyInstance } from "fastify";
import {
  verifyLineSignature,
  sendGreeting,
  replyWithOrders,
} from "../services/lineMessagingService.js";

type LineEvent =
  | { type: "follow"; source: { userId: string }; replyToken?: string }
  | { type: "postback"; source: { userId: string }; replyToken: string; postback: { data: string } }
  | { type: string; [k: string]: unknown };

type LineWebhookBody = {
  events: LineEvent[];
};

export async function registerLineWebhookRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch (e) {
      done(e as Error, undefined);
    }
  });

  app.post<{ Body: LineWebhookBody }>(
    "/",
    {
      config: { rawBody: true },
      schema: { hide: true },
    },
    async (request, reply) => {
      const signature = request.headers["x-line-signature"] as string | undefined;
      const rawBody = JSON.stringify(request.body);

      if (!signature || !verifyLineSignature(rawBody, signature)) {
        return reply.code(401).send({ error: "Invalid signature" });
      }

      // Process events in parallel — fire-and-forget, always 200 to LINE
      const tasks = request.body.events.map(async (event) => {
        try {
          if (event.type === "follow") {
            // Fetch display name from LINE profile if needed — for now use userId as fallback
            const displayName = (event as { type: "follow"; source: { userId: string; displayName?: string } }).source.displayName ?? "คุณ";
            await sendGreeting(event.source.userId, displayName);
            return;
          }

          if (event.type === "postback" && (event as { type: "postback"; postback: { data: string }; source: { userId: string }; replyToken: string }).postback.data === "action=orders") {
            const e = event as { type: "postback"; postback: { data: string }; source: { userId: string }; replyToken: string };
            await replyWithOrders(e.replyToken, e.source.userId);
            return;
          }
        } catch (err) {
          request.log.error({ err, eventType: event.type }, "LINE webhook event handler failed");
        }
      });

      await Promise.allSettled(tasks);
      return reply.code(200).send({});
    },
  );
}
