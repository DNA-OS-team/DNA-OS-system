import type { FastifyInstance } from "fastify";
import {
  verifyLineSignature,
  sendGreeting,
  replyWithOrders,
} from "../services/lineMessagingService.js";

type FollowEvent = { type: "follow"; source: { userId: string }; replyToken?: string };
type PostbackEvent = { type: "postback"; source: { userId: string }; replyToken: string; postback: { data: string } };
type OtherEvent = { type: string; source?: { userId?: string }; [k: string]: unknown };
type LineEvent = FollowEvent | PostbackEvent | OtherEvent;

type LineWebhookBody = {
  events: LineEvent[];
};

function isFollowEvent(e: LineEvent): e is FollowEvent {
  return e.type === "follow";
}

function isPostbackEvent(e: LineEvent): e is PostbackEvent {
  return e.type === "postback" && "postback" in e;
}

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
          if (isFollowEvent(event)) {
            const displayName = (event as FollowEvent & { source: { displayName?: string } }).source.displayName ?? "คุณ";
            await sendGreeting(event.source.userId, displayName);
            return;
          }

          if (isPostbackEvent(event) && event.postback.data === "action=orders") {
            await replyWithOrders(event.replyToken, event.source.userId);
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
