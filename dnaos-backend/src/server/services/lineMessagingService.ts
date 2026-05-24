import { createHmac } from "crypto";
import { env } from "../../config/env.js";
import { getPrisma } from "../db/prisma.js";

const LINE_API = "https://api.line.me/v2/bot";

// ─── Signature ───────────────────────────────────────────────────────────────

export function verifyLineSignature(rawBody: string, signature: string): boolean {
  if (!env.LINE_CHANNEL_SECRET) return false;
  const expected = createHmac("sha256", env.LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest("base64");
  return expected === signature;
}

// ─── Low-level send helpers ───────────────────────────────────────────────────

async function linePost(path: string, body: unknown) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set");
  const res = await fetch(`${LINE_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function linePush(to: string, messages: unknown[]) {
  return linePost("/message/push", { to, messages });
}

async function lineReply(replyToken: string, messages: unknown[]) {
  return linePost("/message/reply", { replyToken, messages });
}

// ─── Greeting (follow event) ──────────────────────────────────────────────────

export async function sendGreeting(userId: string, displayName: string) {
  const text =
    `สวัสดี คุณ ${displayName} 🌝\n` +
    `นี่คือบัญชีทางการของ DNA OS Co., Ltd.\n` +
    `ขอบคุณที่เป็นเพื่อนกับเรา 😉\n\n` +
    `เราจะส่งข่าวสารล่าสุดผ่านบัญชีทางการนี้เป็นระยะ 💌\n` +
    `เตรียมรับได้เลย! 🎁✨✨`;
  await linePush(userId, [{ type: "text", text }]);
}

// ─── Orders Flex Message ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  DELIVERED: "ส่งแล้ว",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#9ca3af",
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function orderBubble(order: {
  id: string;
  orderNo: string;
  status: string;
  createdAt: Date;
  requestedDeliveryAt: Date | null;
  customerSite: { siteName: string } | null;
  items: { id: string }[];
}) {
  const detailUrl = `${env.FRONTEND_URL}/customer/orders/${order.id}`;
  const color = STATUS_COLOR[order.status] ?? "#9ca3af";
  const label = STATUS_LABEL[order.status] ?? order.status;

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: order.orderNo,
              weight: "bold",
              size: "md",
              color: "#111827",
              flex: 1,
            },
            {
              type: "text",
              text: label,
              size: "xs",
              color: "#ffffff",
              align: "center",
              offsetTop: "2px",
              background: color,
              // padding via wrapper box below
            },
          ],
          justifyContent: "space-between",
          alignItems: "center",
          paddingAll: "12px",
          backgroundColor: "#f9fafb",
        },
      ],
      paddingAll: "0px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "12px",
      contents: [
        ...(order.customerSite
          ? [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "สถานที่", size: "xs", color: "#6b7280", flex: 2 },
                  { type: "text", text: order.customerSite.siteName, size: "xs", color: "#111827", flex: 3, wrap: true },
                ],
              },
            ]
          : []),
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "วันที่สั่ง", size: "xs", color: "#6b7280", flex: 2 },
            { type: "text", text: fmtDate(order.createdAt), size: "xs", color: "#111827", flex: 3 },
          ],
        },
        ...(order.requestedDeliveryAt
          ? [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ต้องการภายใน", size: "xs", color: "#6b7280", flex: 2 },
                  { type: "text", text: fmtDate(order.requestedDeliveryAt), size: "xs", color: "#111827", flex: 3 },
                ],
              },
            ]
          : []),
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "รายการ", size: "xs", color: "#6b7280", flex: 2 },
            { type: "text", text: `${order.items.length} รายการ`, size: "xs", color: "#111827", flex: 3 },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "ดูรายละเอียด", uri: detailUrl },
          style: "primary",
          height: "sm",
          color: "#1d4ed8",
        },
      ],
    },
  };
}

export async function replyWithOrders(replyToken: string, lineUserId: string) {
  const prisma = getPrisma();

  const identity = await prisma.userIdentity.findUnique({
    where: { provider_providerUserId: { provider: "LINE", providerUserId: lineUserId } },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { company: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!identity || !identity.user.memberships[0]) {
    await lineReply(replyToken, [
      { type: "text", text: "ไม่พบบัญชีผู้ใช้ในระบบ กรุณาติดต่อเจ้าหน้าที่" },
    ]);
    return;
  }

  const companyId = identity.user.memberships[0].companyId;

  const orders = await prisma.customerOrder.findMany({
    where: { customerCompanyId: companyId },
    include: {
      customerSite: true,
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (orders.length === 0) {
    await lineReply(replyToken, [
      { type: "text", text: "ยังไม่มีคำสั่งซื้อในระบบ" },
    ]);
    return;
  }

  await lineReply(replyToken, [
    {
      type: "flex",
      altText: `คำสั่งซื้อของคุณ (${orders.length} รายการ)`,
      contents: {
        type: "carousel",
        contents: orders.map(orderBubble),
      },
    },
  ]);
}

// ─── Rich Menu creation (run once manually) ───────────────────────────────────

export async function createDnaRichMenu(): Promise<string> {
  const frontendUrl = env.FRONTEND_URL;

  const body = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "DNA OS Main Menu",
    chatBarText: "เมนู",
    areas: [
      // Row 1
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "postback", label: "ข้อมูลออร์เดอร์", data: "action=orders", displayText: "ดูคำสั่งซื้อของฉัน" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "uri", label: "สินค้า", uri: `${frontendUrl}/customer/products` },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "uri", label: "แนะนำ", uri: `${frontendUrl}/customer/recommend` },
      },
      // Row 2
      {
        bounds: { x: 0, y: 843, width: 833, height: 743 },
        action: { type: "uri", label: "ลงทะเบียนรถร่วม", uri: `${frontendUrl}/line/connect?next=/partner` },
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 743 },
        action: { type: "uri", label: "ติดต่อเรา", uri: `${frontendUrl}/contact` },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 743 },
        action: { type: "uri", label: "ลงทะเบียนพาร์ทเนอร์", uri: `${frontendUrl}/line/connect?next=/supplier` },
      },
    ],
  };

  const result = (await linePost("/richmenu", body)) as { richMenuId: string };
  return result.richMenuId;
}

export async function setDefaultRichMenu(richMenuId: string) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set");
  const res = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`setDefaultRichMenu failed: ${res.status}`);
}
