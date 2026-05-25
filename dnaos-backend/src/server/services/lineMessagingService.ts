import { createHmac } from "crypto";
import { env } from "../../config/env.js";
import { getPrisma } from "../db/prisma.js";

const LINE_API = "https://api.line.me/v2/bot";

// ─── Signature ────────────────────────────────────────────────────────────────

export function verifyLineSignature(rawBody: string, signature: string): boolean {
  const secret = env.LINE_MESSAGING_CHANNEL_SECRET ?? env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  return expected === signature;
}

// ─── Signature helpers ────────────────────────────────────────────────────────

export function verifySupplierSignature(rawBody: string, signature: string): boolean {
  const secret = env.LINE_SUPPLIER_OA_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  return expected === signature;
}

export function verifyFleetSignature(rawBody: string, signature: string): boolean {
  const secret = env.LINE_FLEET_OA_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  return expected === signature;
}

// ─── Low-level send helpers ───────────────────────────────────────────────────

async function oaPost(token: string, path: string, body: unknown) {
  const res = await fetch(`${LINE_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function linePost(path: string, body: unknown) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set");
  return oaPost(env.LINE_CHANNEL_ACCESS_TOKEN, path, body);
}

async function supplierOaPost(path: string, body: unknown) {
  if (!env.LINE_SUPPLIER_OA_ACCESS_TOKEN) throw new Error("LINE_SUPPLIER_OA_ACCESS_TOKEN not set");
  return oaPost(env.LINE_SUPPLIER_OA_ACCESS_TOKEN, path, body);
}

async function fleetOaPost(path: string, body: unknown) {
  if (!env.LINE_FLEET_OA_ACCESS_TOKEN) throw new Error("LINE_FLEET_OA_ACCESS_TOKEN not set");
  return oaPost(env.LINE_FLEET_OA_ACCESS_TOKEN, path, body);
}

async function linePush(to: string, messages: unknown[]) {
  return linePost("/message/push", { to, messages });
}

async function lineReply(replyToken: string, messages: unknown[]) {
  return linePost("/message/reply", { replyToken, messages });
}

export async function supplierPush(to: string, messages: unknown[]) {
  return supplierOaPost("/message/push", { to, messages });
}

export async function fleetPush(to: string, messages: unknown[]) {
  return fleetOaPost("/message/push", { to, messages });
}

export async function supplierReply(replyToken: string, messages: unknown[]) {
  return supplierOaPost("/message/reply", { replyToken, messages });
}

export async function fleetReply(replyToken: string, messages: unknown[]) {
  return fleetOaPost("/message/reply", { replyToken, messages });
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function liffUrl(path = "") {
  const id = env.LINE_LIFF_ID;
  if (id) return `https://liff.line.me/${id}${path}`;
  return `${env.FRONTEND_URL}/liff${path}`;
}

// ─── Quick Reply helpers ──────────────────────────────────────────────────────

type QuickReplyItem = {
  type: "action";
  action:
    | { type: "postback"; label: string; data: string; displayText?: string }
    | { type: "uri"; label: string; uri: string }
    | { type: "message"; label: string; text: string };
};

function quickReplyItems(items: QuickReplyItem["action"][]) {
  return {
    items: items.map((action) => ({ type: "action" as const, action })),
  };
}

// Common quick replies
const qrProductMenu: QuickReplyItem["action"] = {
  type: "postback", label: "📦 สินค้า", data: "action=products", displayText: "ดูสินค้า",
};
const qrOrderMenu: QuickReplyItem["action"] = {
  type: "postback", label: "📋 ออเดอร์ฉัน", data: "action=orders", displayText: "ดูออเดอร์ฉัน",
};
const qrOpenShop: QuickReplyItem["action"] = {
  type: "uri", label: "🛒 สั่งซื้อใน LIFF", uri: liffUrl("/shop"),
};
const qrContact: QuickReplyItem["action"] = {
  type: "message", label: "📞 ติดต่อเรา", text: "ติดต่อเรา",
};
const qrHelp: QuickReplyItem["action"] = {
  type: "message", label: "❓ ช่วยเหลือ", text: "ช่วยเหลือ",
};

// ─── Greeting (follow event) ──────────────────────────────────────────────────

export async function sendGreeting(userId: string, displayName: string) {
  const text =
    `สวัสดีครับ คุณ${displayName} 👋\n` +
    `ยินดีต้อนรับสู่ DNA OS ระบบสั่งวัสดุก่อสร้าง\n\n` +
    `📦 ดูสินค้าพิมพ์ "สินค้า"\n` +
    `📋 ดูออเดอร์พิมพ์ "ออเดอร์"\n` +
    `🛒 สั่งซื้อผ่าน LINE Mini App ได้เลย`;

  await linePush(userId, [
    {
      type: "text",
      text,
      quickReply: quickReplyItems([qrProductMenu, qrOpenShop, qrOrderMenu]),
    },
  ]);
}

// ─── Help Menu ────────────────────────────────────────────────────────────────

export async function replyWithHelp(replyToken: string) {
  await lineReply(replyToken, [
    {
      type: "text",
      text:
        "สามารถใช้งานผ่านแชทได้เลยครับ:\n\n" +
        "📦 พิมพ์ \"สินค้า\" — ดูรายการสินค้าทั้งหมด\n" +
        "📋 พิมพ์ \"ออเดอร์\" — ดูสถานะคำสั่งซื้อ\n" +
        "🛒 กด \"สั่งซื้อใน LIFF\" — เปิดระบบสั่งซื้อ\n" +
        "📞 พิมพ์ \"ติดต่อ\" — ข้อมูลติดต่อเจ้าหน้าที่",
      quickReply: quickReplyItems([qrProductMenu, qrOrderMenu, qrOpenShop]),
    },
  ]);
}

// ─── Contact reply ────────────────────────────────────────────────────────────

export async function replyWithContact(replyToken: string) {
  await lineReply(replyToken, [
    {
      type: "text",
      text:
        "📞 ติดต่อ DNA OS\n\n" +
        "โทร: 02-xxx-xxxx\n" +
        "เวลาทำการ: จันทร์–เสาร์ 8:00–17:00 น.\n" +
        "อีเมล: info@dnaos.co.th",
      quickReply: quickReplyItems([qrProductMenu, qrOrderMenu]),
    },
  ]);
}

// ─── Orders Flex Message ──────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  SUBMITTED: "ส่งแล้ว",
  PRICING: "กำลังเสนอราคา",
  QUOTED: "ส่ง QT แล้ว",
  CONFIRMED: "ยืนยันแล้ว",
  PROCUREMENT: "จัดหาสินค้า",
  DISPATCHING: "กำลังจัดส่ง",
  PARTIALLY_DELIVERED: "ส่งบางส่วน",
  DELIVERED: "ส่งครบแล้ว",
  INVOICED: "ออก Invoice แล้ว",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  DRAFT: "#9ca3af",
  SUBMITTED: "#3b82f6",
  PRICING: "#f59e0b",
  QUOTED: "#8b5cf6",
  CONFIRMED: "#10b981",
  PROCUREMENT: "#f59e0b",
  DISPATCHING: "#f59e0b",
  PARTIALLY_DELIVERED: "#f97316",
  DELIVERED: "#22c55e",
  INVOICED: "#6366f1",
  PAID: "#22c55e",
  CANCELLED: "#ef4444",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
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
  const color = ORDER_STATUS_COLOR[order.status] ?? "#9ca3af";
  const label = ORDER_STATUS_LABEL[order.status] ?? order.status;

  return {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "0px",
      contents: [
        // Status bar
        {
          type: "box",
          layout: "horizontal",
          paddingAll: "12px",
          backgroundColor: color + "22",
          contents: [
            { type: "text", text: order.orderNo, weight: "bold", size: "sm", color: "#111827", flex: 1 },
            {
              type: "box",
              layout: "vertical",
              backgroundColor: color,
              cornerRadius: "12px",
              paddingStart: "8px",
              paddingEnd: "8px",
              paddingTop: "3px",
              paddingBottom: "3px",
              contents: [
                { type: "text", text: label, size: "xxs", color: "#ffffff", weight: "bold" },
              ],
            },
          ],
          alignItems: "center",
        },
        // Details
        {
          type: "box",
          layout: "vertical",
          paddingAll: "12px",
          spacing: "sm",
          contents: [
            ...(order.customerSite ? [{
              type: "box", layout: "horizontal",
              contents: [
                { type: "text", text: "📍 ส่งที่", size: "xs", color: "#6b7280", flex: 2 },
                { type: "text", text: order.customerSite.siteName, size: "xs", color: "#111827", flex: 3, wrap: true },
              ],
            }] : []),
            {
              type: "box", layout: "horizontal",
              contents: [
                { type: "text", text: "📅 วันที่สั่ง", size: "xs", color: "#6b7280", flex: 2 },
                { type: "text", text: fmtDate(order.createdAt), size: "xs", color: "#111827", flex: 3 },
              ],
            },
            ...(order.requestedDeliveryAt ? [{
              type: "box", layout: "horizontal",
              contents: [
                { type: "text", text: "🚚 ต้องการ", size: "xs", color: "#6b7280", flex: 2 },
                { type: "text", text: fmtDate(order.requestedDeliveryAt), size: "xs", color: "#111827", flex: 3 },
              ],
            }] : []),
            {
              type: "box", layout: "horizontal",
              contents: [
                { type: "text", text: "📦 รายการ", size: "xs", color: "#6b7280", flex: 2 },
                { type: "text", text: `${order.items.length} รายการ`, size: "xs", color: "#111827", flex: 3 },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      contents: [{
        type: "button",
        action: { type: "uri", label: "ดูรายละเอียด", uri: detailUrl },
        style: "primary",
        height: "sm",
        color: "#1d4ed8",
      }],
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
            include: { company: { select: { id: true, type: true } } },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!identity || !identity.user.memberships[0]) {
    await lineReply(replyToken, [
      {
        type: "text",
        text: "ไม่พบบัญชีในระบบครับ กรุณากดเข้าสู่ระบบก่อนใช้งาน",
        quickReply: quickReplyItems([qrOpenShop, qrContact]),
      },
    ]);
    return;
  }

  const membership = identity.user.memberships[0];
  if (membership.company.type !== "CUSTOMER") {
    await lineReply(replyToken, [
      {
        type: "text",
        text: "บัญชีนี้ไม่ใช่บัญชีลูกค้า ไม่สามารถดูคำสั่งซื้อได้",
        quickReply: quickReplyItems([qrHelp]),
      },
    ]);
    return;
  }

  const orders = await prisma.customerOrder.findMany({
    where: {
      customerCompanyId: membership.company.id,
      status: { notIn: ["CANCELLED", "DRAFT"] },
    },
    include: { customerSite: true, items: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (orders.length === 0) {
    await lineReply(replyToken, [
      {
        type: "text",
        text: "ยังไม่มีคำสั่งซื้อที่กำลังดำเนินการครับ",
        quickReply: quickReplyItems([qrOpenShop, qrProductMenu]),
      },
    ]);
    return;
  }

  await lineReply(replyToken, [
    {
      type: "flex",
      altText: `คำสั่งซื้อของคุณ (${orders.length} รายการ)`,
      contents: { type: "carousel", contents: orders.map(orderBubble) },
      quickReply: quickReplyItems([qrOpenShop, qrProductMenu, qrContact]),
    },
  ]);
}

// ─── Product Catalog Flex Message ────────────────────────────────────────────

function fmtPrice(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function productBubble(p: {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string;
  pricePerTon: number | null;
  pricePerCubic: number | null;
}) {
  const shopUrl = liffUrl("/shop");
  const priceRows = [
    p.pricePerTon !== null ? {
      type: "box", layout: "horizontal",
      contents: [
        { type: "text", text: "ต่อตัน", size: "xs", color: "#6b7280", flex: 2 },
        { type: "text", text: `฿${fmtPrice(p.pricePerTon)}`, size: "xs", color: "#1d4ed8", flex: 3, weight: "bold" },
      ],
    } : null,
    p.pricePerCubic !== null ? {
      type: "box", layout: "horizontal",
      contents: [
        { type: "text", text: "ต่อคิว", size: "xs", color: "#6b7280", flex: 2 },
        { type: "text", text: `฿${fmtPrice(p.pricePerCubic)}`, size: "xs", color: "#1d4ed8", flex: 3, weight: "bold" },
      ],
    } : null,
  ].filter(Boolean);

  return {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "none",
      paddingAll: "0px",
      contents: [
        ...(p.imageUrl ? [{
          type: "image", url: p.imageUrl, aspectRatio: "4:3", aspectMode: "cover", size: "full",
        }] : [{
          type: "box",
          layout: "vertical",
          height: "80px",
          backgroundColor: "#f3f4f6",
          contents: [
            { type: "text", text: "📦", size: "xxl", align: "center", offsetTop: "20px" },
          ],
        }]),
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          paddingAll: "12px",
          contents: [
            { type: "text", text: p.category, size: "xxs", color: "#9ca3af" },
            { type: "text", text: p.name, weight: "bold", size: "sm", color: "#111827", wrap: true },
            { type: "separator", margin: "sm" },
            ...(priceRows.length > 0 ? priceRows : [
              { type: "text", text: "ติดต่อเพื่อขอราคา", size: "xs", color: "#6b7280" },
            ]),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      contents: [{
        type: "button",
        action: { type: "uri", label: "🛒 สั่งซื้อใน LINE", uri: shopUrl },
        style: "primary",
        height: "sm",
        color: "#00b900",
      }],
    },
  };
}

type ProductEntry = {
  id: string; name: string; imageUrl: string | null; category: string;
  pricePerTon: number | null; pricePerCubic: number | null;
};

async function loadProducts(categoryName?: string): Promise<ProductEntry[]> {
  const prisma = getPrisma();

  const supplierProducts = await prisma.supplierProduct.findMany({
    where: {
      isAvailable: true,
      ...(categoryName ? {
        productVariant: { product: { category: { name: { equals: categoryName, mode: "insensitive" } } } },
      } : {}),
    },
    include: {
      productVariant: {
        include: { product: { include: { category: { select: { name: true } } } } },
      },
    },
    orderBy: { productVariant: { product: { name: "asc" } } },
  });

  const productMap = new Map<string, ProductEntry>();
  for (const sp of supplierProducts) {
    const pv = sp.productVariant;
    const prod = pv.product;
    const price = Number(sp.price);
    const unit = pv.unit.toLowerCase();
    const isTon = unit.includes("ตัน") || unit === "ton" || unit === "t";
    const isCubic = unit.includes("คิว") || unit.includes("ลูกบาศก์") || unit === "m3";

    if (!productMap.has(prod.id)) {
      productMap.set(prod.id, {
        id: prod.id, name: prod.name,
        imageUrl: (prod as { imageUrl?: string | null }).imageUrl ?? null,
        category: prod.category.name,
        pricePerTon: null, pricePerCubic: null,
      });
    }
    const entry = productMap.get(prod.id)!;
    if (isTon && (entry.pricePerTon === null || price < entry.pricePerTon)) entry.pricePerTon = price;
    if (isCubic && (entry.pricePerCubic === null || price < entry.pricePerCubic)) entry.pricePerCubic = price;
  }

  return Array.from(productMap.values());
}

export async function replyWithProductCatalog(replyToken: string, categoryName?: string) {
  const products = await loadProducts(categoryName);

  if (products.length === 0) {
    await lineReply(replyToken, [{
      type: "text",
      text: categoryName
        ? `ไม่พบสินค้าในหมวด "${categoryName}" ขณะนี้`
        : "ยังไม่มีสินค้าในระบบขณะนี้ กรุณาติดต่อเจ้าหน้าที่",
      quickReply: quickReplyItems([qrProductMenu, qrContact]),
    }]);
    return;
  }

  const bubbles = products.slice(0, 12).map(productBubble);

  // Category quick replies
  const categories = [...new Set(products.map((p) => p.category))].slice(0, 5);
  const categoryQR: QuickReplyItem["action"][] = categories.map((cat) => ({
    type: "postback" as const,
    label: `${cat}`,
    data: `action=products&category=${encodeURIComponent(cat)}`,
    displayText: `ดูสินค้า ${cat}`,
  }));

  await lineReply(replyToken, [
    {
      type: "text",
      text: categoryName
        ? `สินค้าหมวด "${categoryName}" จำนวน ${bubbles.length} รายการ 👇`
        : `สินค้าทั้งหมด ${bubbles.length} รายการ\nกดเลือกหมวดหมู่ หรือกด "สั่งซื้อ" ในแต่ละรายการ 👇`,
      quickReply: quickReplyItems([...categoryQR, qrOpenShop, qrOrderMenu]),
    },
    {
      type: "flex",
      altText: `สินค้า DNA OS (${bubbles.length} รายการ)`,
      contents: { type: "carousel", contents: bubbles },
    },
  ]);
}

// ─── Text keyword handler ─────────────────────────────────────────────────────

export async function handleTextMessage(
  replyToken: string,
  lineUserId: string,
  text: string,
) {
  const t = text.trim().toLowerCase();

  if (t.includes("สินค้า") || t.includes("product") || t.includes("catalogue") || t.includes("catalog")) {
    await replyWithProductCatalog(replyToken);
    return;
  }

  if (
    t.includes("ออเดอร์") || t.includes("order") || t.includes("สั่งซื้อ") ||
    t.includes("คำสั่งซื้อ") || t.includes("สถานะ")
  ) {
    await replyWithOrders(replyToken, lineUserId);
    return;
  }

  if (t.includes("ติดต่อ") || t.includes("contact") || t.includes("โทร") || t.includes("phone")) {
    await replyWithContact(replyToken);
    return;
  }

  if (t.includes("ช่วยเหลือ") || t.includes("help") || t.includes("วิธีใช้") || t === "?") {
    await replyWithHelp(replyToken);
    return;
  }

  // Default: unknown message
  await lineReply(replyToken, [{
    type: "text",
    text: "สามารถพิมพ์คำสั่งเหล่านี้ได้ครับ:\n• สินค้า\n• ออเดอร์\n• ติดต่อ\n• ช่วยเหลือ",
    quickReply: quickReplyItems([qrProductMenu, qrOrderMenu, qrOpenShop, qrHelp]),
  }]);
}

// ─── Rich Menu (ใช้ run ครั้งเดียวผ่าน admin command) ─────────────────────────

export async function createDnaRichMenu(): Promise<string> {
  const frontendUrl = env.FRONTEND_URL;
  const shopLiffUrl = liffUrl("/shop");

  const body = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "DNA OS Main Menu",
    chatBarText: "เมนู",
    areas: [
      // Row 1: primary actions
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "postback", label: "📦 สินค้า", data: "action=products", displayText: "ดูสินค้า" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "uri", label: "🛒 สั่งซื้อ", uri: shopLiffUrl },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "postback", label: "📋 ออเดอร์", data: "action=orders", displayText: "ดูออเดอร์ฉัน" },
      },
      // Row 2: secondary
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: { type: "uri", label: "ลงทะเบียนรถร่วม", uri: `${frontendUrl}/line/connect?next=/partner` },
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: { type: "message", label: "📞 ติดต่อ", text: "ติดต่อ" },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: { type: "message", label: "❓ ช่วยเหลือ", text: "ช่วยเหลือ" },
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

// ─── Supplier OA ───────────────────────────────────────────────────────────────

export async function sendSupplierGreeting(userId: string, displayName: string) {
  const poUrl = liffUrl("/supplier/po");
  await supplierPush(userId, [
    {
      type: "flex",
      altText: `ยินดีต้อนรับ ${displayName} — DNA OS Supplier`,
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical", spacing: "md",
          contents: [
            { type: "text", text: `สวัสดีครับ ${displayName} 👋`, weight: "bold", size: "lg" },
            { type: "text", text: "ยินดีต้อนรับสู่ระบบซัพพลายเออร์ DNA OS", wrap: true, color: "#666666", size: "sm" },
            { type: "separator", margin: "md" },
            { type: "text", text: "คุณสามารถ:", size: "sm", margin: "md" },
            { type: "text", text: "• ดูและยืนยัน PO\n• จัดการสินค้าและสต๊อก\n• ดูรายได้และการชำระเงิน", wrap: true, size: "sm", color: "#444444" },
          ],
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{
            type: "button", style: "primary",
            action: { type: "uri", label: "เข้าสู่ระบบซัพพลายเออร์", uri: poUrl },
          }],
        },
      },
    },
  ]);
}

export async function pushSupplierNewPO(lineUserId: string, poNo: string, itemCount: number, totalAmount: number) {
  const poUrl = liffUrl("/supplier/po");
  await supplierPush(lineUserId, [
    {
      type: "flex",
      altText: `📋 PO ใหม่ ${poNo}`,
      contents: {
        type: "bubble",
        header: {
          type: "box", layout: "vertical", backgroundColor: "#1DB446",
          contents: [{ type: "text", text: "📋 มี PO ใหม่เข้ามา!", color: "#ffffff", weight: "bold" }],
        },
        body: {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [
            { type: "text", text: poNo, weight: "bold", size: "xl" },
            { type: "text", text: `${itemCount} รายการ · ฿${totalAmount.toLocaleString("th-TH")}`, color: "#666666", size: "sm" },
          ],
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{
            type: "button", style: "primary",
            action: { type: "uri", label: "ดู PO", uri: poUrl },
          }],
        },
      },
    },
  ]);
}

export async function createSupplierRichMenu(): Promise<string> {
  const poUrl = liffUrl("/supplier/po");
  const productsUrl = liffUrl("/supplier/products");
  const inventoryUrl = liffUrl("/supplier/inventory");
  const paymentsUrl = liffUrl("/supplier/payments");

  const body = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "DNA OS Supplier Menu",
    chatBarText: "เมนูซัพพลายเออร์",
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: "uri", label: "📋 PO ของฉัน", uri: poUrl } },
      { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: "uri", label: "🛍️ สินค้า", uri: productsUrl } },
      { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: "uri", label: "📦 สต๊อก", uri: inventoryUrl } },
      { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: "uri", label: "💰 รายได้", uri: paymentsUrl } },
      { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: "message", label: "📞 ติดต่อ", text: "ติดต่อ" } },
      { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: "message", label: "❓ ช่วยเหลือ", text: "ช่วยเหลือ" } },
    ],
  };

  const result = (await supplierOaPost("/richmenu", body)) as { richMenuId: string };
  return result.richMenuId;
}

export async function setSupplierDefaultRichMenu(richMenuId: string) {
  if (!env.LINE_SUPPLIER_OA_ACCESS_TOKEN) throw new Error("LINE_SUPPLIER_OA_ACCESS_TOKEN not set");
  const res = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.LINE_SUPPLIER_OA_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`setSupplierDefaultRichMenu failed: ${res.status}`);
}

// ─── Fleet OA ──────────────────────────────────────────────────────────────────

export async function sendFleetGreeting(userId: string, displayName: string) {
  const jobsUrl = liffUrl("/fleet/jobs");
  await fleetPush(userId, [
    {
      type: "flex",
      altText: `ยินดีต้อนรับ ${displayName} — DNA OS รถร่วม`,
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical", spacing: "md",
          contents: [
            { type: "text", text: `สวัสดีครับ ${displayName} 👋`, weight: "bold", size: "lg" },
            { type: "text", text: "ยินดีต้อนรับสู่ระบบรถร่วม DNA OS", wrap: true, color: "#666666", size: "sm" },
            { type: "separator", margin: "md" },
            { type: "text", text: "คุณสามารถ:", size: "sm", margin: "md" },
            { type: "text", text: "• ดูงานที่ได้รับมอบหมาย\n• อัปเดตสถานะการส่งสินค้า\n• ส่ง Delivery Proof\n• ดูรายได้", wrap: true, size: "sm", color: "#444444" },
          ],
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{
            type: "button", style: "primary",
            action: { type: "uri", label: "ดูงานของฉัน", uri: jobsUrl },
          }],
        },
      },
    },
  ]);
}

export async function pushFleetNewJob(lineUserId: string, jobRef: string, from: string, to: string, scheduledAt: string) {
  const jobsUrl = liffUrl("/fleet/jobs");
  await fleetPush(lineUserId, [
    {
      type: "flex",
      altText: `🚛 งานใหม่ ${jobRef}`,
      contents: {
        type: "bubble",
        header: {
          type: "box", layout: "vertical", backgroundColor: "#F4A700",
          contents: [{ type: "text", text: "🚛 มีงานใหม่เข้ามา!", color: "#ffffff", weight: "bold" }],
        },
        body: {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [
            { type: "text", text: jobRef, weight: "bold", size: "xl" },
            { type: "text", text: `📍 จาก: ${from}`, wrap: true, size: "sm" },
            { type: "text", text: `📍 ถึง: ${to}`, wrap: true, size: "sm" },
            { type: "text", text: `🕐 ${scheduledAt}`, size: "sm", color: "#888888" },
          ],
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{
            type: "button", style: "primary",
            action: { type: "uri", label: "ดูรายละเอียด", uri: jobsUrl },
          }],
        },
      },
    },
  ]);
}

export async function createFleetRichMenu(): Promise<string> {
  const jobsUrl = liffUrl("/fleet/jobs");
  const earningsUrl = liffUrl("/fleet/earnings");
  const frontendUrl = env.FRONTEND_URL;

  const body = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "DNA OS Fleet Menu",
    chatBarText: "เมนูรถร่วม",
    areas: [
      { bounds: { x: 0, y: 0, width: 1250, height: 843 }, action: { type: "uri", label: "🚛 งานของฉัน", uri: jobsUrl } },
      { bounds: { x: 1250, y: 0, width: 1250, height: 843 }, action: { type: "uri", label: "💰 รายได้", uri: earningsUrl } },
      { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: "uri", label: "👤 โปรไฟล์", uri: `${frontendUrl}/liff/fleet` } },
      { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: "message", label: "📞 ติดต่อ", text: "ติดต่อ" } },
      { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: "message", label: "❓ ช่วยเหลือ", text: "ช่วยเหลือ" } },
    ],
  };

  const result = (await fleetOaPost("/richmenu", body)) as { richMenuId: string };
  return result.richMenuId;
}

export async function setFleetDefaultRichMenu(richMenuId: string) {
  if (!env.LINE_FLEET_OA_ACCESS_TOKEN) throw new Error("LINE_FLEET_OA_ACCESS_TOKEN not set");
  const res = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.LINE_FLEET_OA_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`setFleetDefaultRichMenu failed: ${res.status}`);
}
