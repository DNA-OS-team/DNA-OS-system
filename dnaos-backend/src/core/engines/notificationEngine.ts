import { env } from "../../config/env.js";
import type { NotificationType } from "../../generated/prisma/enums.js";

// ─── Template Registry ────────────────────────────────────────────────────────

type TemplateData = {
  ORDER_CREATED: { orderNo: string; customerName: string; totalAmount: string };
  SUPPLIER_PO_CREATED: { poNo: string; supplierName: string; totalAmount: string };
  SUPPLIER_PO_CONFIRMED: { poNo: string; supplierName: string };
  TRANSPORT_JOB_ASSIGNED: { jobNo: string; truckPlate: string; scheduledAt: string };
  TRANSPORT_JOB_DELIVERED: { jobNo: string; orderNo: string };
  INVOICE_CREATED: { invoiceNo: string; customerName: string; totalAmount: string; dueDate: string };
  PAYMENT_CONFIRMED: { invoiceNo: string; amount: string };
  DEBT_OVERDUE: { customerName: string; totalOutstanding: string; daysPastDue: number };
};

type Templates = {
  [K in NotificationType]: (data: TemplateData[K]) => string;
};

export const TEMPLATES: Templates = {
  ORDER_CREATED: ({ orderNo, customerName, totalAmount }) =>
    `📦 คำสั่งซื้อใหม่\nOrder: ${orderNo}\nลูกค้า: ${customerName}\nมูลค่า: ${totalAmount} บาท`,

  SUPPLIER_PO_CREATED: ({ poNo, supplierName, totalAmount }) =>
    `📋 PO ใหม่ส่งให้ซัพพลายเออร์\nPO: ${poNo}\nซัพพลายเออร์: ${supplierName}\nมูลค่า: ${totalAmount} บาท`,

  SUPPLIER_PO_CONFIRMED: ({ poNo, supplierName }) =>
    `✅ ซัพพลายเออร์ยืนยัน PO\nPO: ${poNo}\nโดย: ${supplierName}`,

  TRANSPORT_JOB_ASSIGNED: ({ jobNo, truckPlate, scheduledAt }) =>
    `🚛 มอบหมายงานขนส่ง\nงาน: ${jobNo}\nทะเบียน: ${truckPlate}\nกำหนดรับ: ${scheduledAt}`,

  TRANSPORT_JOB_DELIVERED: ({ jobNo, orderNo }) =>
    `✅ ส่งมอบสินค้าเรียบร้อย\nงาน: ${jobNo}\nOrder: ${orderNo}`,

  INVOICE_CREATED: ({ invoiceNo, customerName, totalAmount, dueDate }) =>
    `🧾 Invoice ใหม่\nเลขที่: ${invoiceNo}\nลูกค้า: ${customerName}\nยอด: ${totalAmount} บาท\nครบกำหนด: ${dueDate}`,

  PAYMENT_CONFIRMED: ({ invoiceNo, amount }) =>
    `💰 ยืนยันการชำระเงิน\nInvoice: ${invoiceNo}\nจำนวน: ${amount} บาท`,

  DEBT_OVERDUE: ({ customerName, totalOutstanding, daysPastDue }) =>
    `⚠️ ลูกหนี้เกินกำหนด\nลูกค้า: ${customerName}\nยอดค้าง: ${totalOutstanding} บาท\nเกินกำหนด ${daysPastDue} วัน`,
};

export function buildMessage<K extends NotificationType>(type: K, data: TemplateData[K]): string {
  const fn = TEMPLATES[type] as (d: TemplateData[K]) => string;
  return fn(data);
}

// ─── LINE Messaging API ────────────────────────────────────────────────────────

export class LineApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "LineApiError";
  }
}

export async function sendLineMessage(recipientLineId: string, message: string): Promise<void> {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new LineApiError(0, "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า");

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: recipientLineId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LineApiError(res.status, `LINE API error ${res.status}: ${body}`);
  }
}

export async function sendLineMulticast(recipientLineIds: string[], message: string): Promise<void> {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new LineApiError(0, "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า");

  const res = await fetch("https://api.line.me/v2/bot/message/multicast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: recipientLineIds,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LineApiError(res.status, `LINE multicast error ${res.status}: ${body}`);
  }
}
