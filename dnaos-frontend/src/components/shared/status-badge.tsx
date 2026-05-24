import { cn } from "@/lib/utils";

type Color = "success" | "warning" | "danger" | "info" | "purple" | "neutral";

const COLOR_CLASS: Record<Color, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger:  "badge-danger",
  info:    "badge-info",
  purple:  "badge-purple",
  neutral: "badge-neutral",
};

export function StatusBadge({
  label,
  color,
  dot = false,
  className,
}: {
  label: string;
  color: Color;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLOR_CLASS[color],
        className
      )}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-70" />
      )}
      {label}
    </span>
  );
}

/* ── Domain-specific helpers ───────────────────────────────── */

// Customer / Company status
export function CompanyStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    ACTIVE:   { label: "ใช้งาน",    color: "success" },
    INACTIVE: { label: "ปิดใช้",    color: "neutral" },
    SUSPENDED:{ label: "ระงับ",     color: "danger"  },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} dot />;
}

// Customer Order status
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    DRAFT:             { label: "ร่าง",            color: "neutral"  },
    SUBMITTED:         { label: "ส่งแล้ว",          color: "info"     },
    PRICING:           { label: "กำหนดราคา",       color: "warning"  },
    QUOTED:            { label: "ส่ง QT แล้ว",      color: "warning"  },
    CONFIRMED:         { label: "ยืนยันแล้ว",       color: "success"  },
    PROCUREMENT:       { label: "จัดซื้อ",          color: "info"     },
    DISPATCHING:       { label: "กำลังส่ง",         color: "info"     },
    PARTIALLY_DELIVERED:{ label: "ส่งบางส่วน",      color: "warning"  },
    DELIVERED:         { label: "ส่งครบ",           color: "success"  },
    INVOICED:          { label: "ออก Invoice แล้ว", color: "purple"   },
    PAID:              { label: "ชำระแล้ว",         color: "success"  },
    CANCELLED:         { label: "ยกเลิก",           color: "danger"   },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Invoice status
export function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    DRAFT:          { label: "ร่าง",             color: "neutral" },
    SENT:           { label: "ส่งแล้ว",           color: "info"    },
    PARTIALLY_PAID: { label: "ชำระบางส่วน",      color: "warning" },
    PAID:           { label: "ชำระครบ",           color: "success" },
    VOID:           { label: "ยกเลิก",            color: "danger"  },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Transport Job status
export function TransportStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    CREATED:         { label: "รอมอบหมาย",         color: "neutral"  },
    ASSIGNED:        { label: "มอบหมายแล้ว",        color: "info"     },
    ACCEPTED:        { label: "รับงานแล้ว",         color: "info"     },
    GOING_TO_PICKUP: { label: "กำลังไปรับ",         color: "warning"  },
    ARRIVED_PICKUP:  { label: "ถึงจุดรับ",          color: "warning"  },
    LOADED:          { label: "บรรทุกแล้ว",         color: "warning"  },
    IN_TRANSIT:      { label: "กำลังขนส่ง",         color: "info"     },
    ARRIVED_SITE:    { label: "ถึงไซต์",            color: "warning"  },
    DELIVERED:       { label: "ส่งสำเร็จ",          color: "success"  },
    COMPLETED:       { label: "เสร็จสิ้น",          color: "success"  },
    CANCELLED:       { label: "ยกเลิก",             color: "danger"   },
    FAILED:          { label: "ล้มเหลว",            color: "danger"   },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Debt collection state
export function DebtStateBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    CURRENT:    { label: "ปกติ",         color: "success" },
    OVERDUE:    { label: "เกินกำหนด",    color: "warning" },
    WARNING:    { label: "แจ้งเตือน",    color: "warning" },
    COLLECTION: { label: "ติดตามหนี้",   color: "danger"  },
    PROMISED:   { label: "สัญญาชำระ",   color: "info"    },
    PARTIAL:    { label: "ชำระบางส่วน",  color: "warning" },
    LEGAL:      { label: "ดำเนินคดี",    color: "purple"  },
    CLOSED:     { label: "ปิดแล้ว",      color: "neutral" },
  };
  const cfg = map[state] ?? { label: state, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Settlement status
export function SettlementStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    DRAFT:           { label: "ร่าง",             color: "neutral" },
    PENDING_APPROVAL:{ label: "รออนุมัติ",         color: "warning" },
    APPROVED:        { label: "อนุมัติแล้ว",       color: "success" },
    PAYMENT_ORDERED: { label: "สั่งจ่ายแล้ว",      color: "info"    },
    PAID:            { label: "จ่ายแล้ว",           color: "success" },
    CANCELLED:       { label: "ยกเลิก",            color: "danger"  },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Alert severity
export function AlertSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    CRITICAL: { label: "วิกฤต",  color: "danger"  },
    WARNING:  { label: "เตือน",  color: "warning" },
    INFO:     { label: "ข้อมูล", color: "info"    },
  };
  const cfg = map[severity] ?? { label: severity, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} dot />;
}

// Dispute status
export function DisputeStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    OPEN:        { label: "เปิด",       color: "danger"  },
    UNDER_REVIEW:{ label: "กำลังตรวจ", color: "warning" },
    RESOLVED:    { label: "แก้ไขแล้ว", color: "success" },
    CLOSED:      { label: "ปิด",        color: "neutral" },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}

// Supplier PO status
export function PoStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    DRAFT:              { label: "ร่าง",               color: "neutral" },
    SENT:               { label: "ส่งแล้ว",             color: "info"    },
    ACKNOWLEDGED:       { label: "รับทราบ",             color: "info"    },
    CONFIRMED:          { label: "ยืนยันแล้ว",          color: "success" },
    PARTIALLY_FULFILLED:{ label: "ส่งบางส่วน",          color: "warning" },
    FULFILLED:          { label: "ส่งครบ",              color: "success" },
    BILLED:             { label: "เรียกเก็บแล้ว",       color: "purple"  },
    PAID:               { label: "จ่ายแล้ว",             color: "success" },
    CANCELLED:          { label: "ยกเลิก",              color: "danger"  },
    REJECTED:           { label: "ปฏิเสธ",              color: "danger"  },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" };
  return <StatusBadge label={cfg.label} color={cfg.color} />;
}
