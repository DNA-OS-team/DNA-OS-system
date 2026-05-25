import type { FastifyInstance } from "fastify";
import {
  verifyLineSignature,
  sendGreeting,
  replyWithOrders,
  replyWithProductCatalog,
  replyWithHelp,
  replyWithContact,
  handleTextMessage,
} from "../services/lineMessagingService.js";

type LineEvent =
  | { type: "follow"; source: { userId: string }; replyToken?: string }
  | { type: "postback"; source: { userId: string }; replyToken: string; postback: { data: string } }
  | { type: "message"; source: { userId: string }; replyToken: string; message: { type: string; text?: string } }
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
    { schema: { hide: true } },
    async (request, reply) => {
      const signature = request.headers["x-line-signature"] as string | undefined;
      const rawBody = JSON.stringify(request.body);

      if (!signature || !verifyLineSignature(rawBody, signature)) {
        return reply.code(401).send({ error: "Invalid signature" });
      }

      const tasks = request.body.events.map(async (event) => {
        try {
          if (event.type === "follow") {
            const e = event as { type: "follow"; source: { userId: string; displayName?: string } };
            const displayName = e.source.displayName ?? "คุณ";
            await sendGreeting(e.source.userId, displayName);
            return;
          }

          if (event.type === "message") {
            const e = event as { type: "message"; message: { type: string; text?: string }; source: { userId: string }; replyToken: string };
            if (e.message.type === "text" && e.message.text) {
              await handleTextMessage(e.replyToken, e.source.userId, e.message.text);
            }
            return;
          }

          if (event.type === "postback") {
            const e = event as { type: "postback"; postback: { data: string }; source: { userId: string }; replyToken: string };
            const params = new URLSearchParams(e.postback.data);
            const action = params.get("action");

            if (action === "orders") {
              await replyWithOrders(e.replyToken, e.source.userId);
            } else if (action === "products") {
              const category = params.get("category") ?? undefined;
              await replyWithProductCatalog(e.replyToken, category);
            } else if (action === "help") {
              await replyWithHelp(e.replyToken);
            } else if (action === "contact") {
              await replyWithContact(e.replyToken);
            }
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
