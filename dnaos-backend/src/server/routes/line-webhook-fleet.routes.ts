import type { FastifyInstance } from "fastify";
import {
  verifyFleetSignature,
  sendFleetGreeting,
  fleetReply,
  liffUrl,
} from "../services/lineMessagingService.js";
import { getPrisma } from "../db/prisma.js";

type LineEvent =
  | { type: "follow"; source: { userId: string }; replyToken?: string }
  | { type: "message"; source: { userId: string }; replyToken: string; message: { type: string; text?: string } }
  | { type: string; [k: string]: unknown };

type LineWebhookBody = { events: LineEvent[] };

export async function registerLineFleetWebhookRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    try { done(null, JSON.parse(body as string)); } catch (e) { done(e as Error, undefined); }
  });

  app.post<{ Body: LineWebhookBody }>("/", { schema: { hide: true } }, async (request, reply) => {
    const signature = request.headers["x-line-signature"] as string | undefined;
    const rawBody = JSON.stringify(request.body);

    if (!signature || !verifyFleetSignature(rawBody, signature)) {
      return reply.code(401).send({ error: "Invalid signature" });
    }

    const tasks = request.body.events.map(async (event) => {
      try {
        if (event.type === "follow") {
          const e = event as { type: "follow"; source: { userId: string } };
          const prisma = getPrisma();
          const identity = await prisma.userIdentity.findFirst({
            where: { providerUserId: e.source.userId, provider: "LINE" },
            include: { user: { select: { name: true } } },
          });
          const displayName = identity?.displayName ?? identity?.user?.name ?? "คุณ";
          await sendFleetGreeting(e.source.userId, displayName);
          return;
        }

        if (event.type === "message") {
          const e = event as { type: "message"; message: { type: string; text?: string }; source: { userId: string }; replyToken: string };
          if (e.message.type === "text") {
            const t = (e.message.text ?? "").toLowerCase();
            const jobsUrl = liffUrl("/fleet/jobs");
            if (t.includes("งาน") || t.includes("job") || t.includes("ส่ง")) {
              await fleetReply(e.replyToken, [{
                type: "text",
                text: "ดูงานของคุณได้ที่นี่ครับ 🚛",
                quickReply: {
                  items: [{ type: "action", action: { type: "uri", label: "ดูงาน", uri: jobsUrl } }],
                },
              }]);
            } else {
              await fleetReply(e.replyToken, [{
                type: "text",
                text: "กดเมนูด้านล่างเพื่อดูงานและอัปเดตสถานะได้เลยครับ 👇",
              }]);
            }
          }
          return;
        }
      } catch (err) {
        request.log.error({ err, eventType: event.type }, "Fleet webhook handler failed");
      }
    });

    await Promise.allSettled(tasks);
    return reply.code(200).send({});
  });
}
