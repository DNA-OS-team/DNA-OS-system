import type { FastifyInstance } from "fastify";
import {
  verifySupplierSignature,
  sendSupplierGreeting,
  supplierReply,
} from "../services/lineMessagingService.js";
import { getPrisma } from "../db/prisma.js";
import { env } from "../../config/env.js";
import { liffUrl } from "../services/lineMessagingService.js";

type LineEvent =
  | { type: "follow"; source: { userId: string }; replyToken?: string }
  | { type: "message"; source: { userId: string }; replyToken: string; message: { type: string; text?: string } }
  | { type: "postback"; source: { userId: string }; replyToken: string; postback: { data: string } }
  | { type: string; [k: string]: unknown };

type LineWebhookBody = { events: LineEvent[] };

export async function registerLineSupplierWebhookRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    try { done(null, JSON.parse(body as string)); } catch (e) { done(e as Error, undefined); }
  });

  app.post<{ Body: LineWebhookBody }>("/", { schema: { hide: true } }, async (request, reply) => {
    const signature = request.headers["x-line-signature"] as string | undefined;
    const rawBody = JSON.stringify(request.body);

    if (!signature || !verifySupplierSignature(rawBody, signature)) {
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
          await sendSupplierGreeting(e.source.userId, displayName);
          return;
        }

        if (event.type === "message") {
          const e = event as { type: "message"; message: { type: string; text?: string }; source: { userId: string }; replyToken: string };
          if (e.message.type === "text") {
            const t = (e.message.text ?? "").toLowerCase();
            const poUrl = liffUrl("/supplier/po");
            if (t.includes("po") || t.includes("คำสั่ง") || t.includes("order")) {
              await supplierReply(e.replyToken, [{
                type: "text",
                text: "ดู PO ของคุณได้ที่นี่ครับ 📋",
                quickReply: {
                  items: [{ type: "action", action: { type: "uri", label: "ดู PO", uri: poUrl } }],
                },
              }]);
            } else {
              await supplierReply(e.replyToken, [{
                type: "text",
                text: "สามารถกดเมนูด้านล่างเพื่อใช้งานระบบซัพพลายเออร์ได้เลยครับ 👇",
              }]);
            }
          }
          return;
        }
      } catch (err) {
        request.log.error({ err, eventType: event.type }, "Supplier webhook handler failed");
      }
    });

    await Promise.allSettled(tasks);
    return reply.code(200).send({});
  });
}
