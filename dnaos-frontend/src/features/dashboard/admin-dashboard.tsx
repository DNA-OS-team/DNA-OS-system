"use client";

import {
  AlertTriangle,
  Banknote,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  Package,
  PackageCheck,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboard } from "./dashboard-api";
import type { AdminDashboardData, DashboardMetricSet, RecentAlert } from "./types";

const emptyDashboard: AdminDashboardData = {
  metrics: {
    customers: 0,
    suppliers: 0,
    products: 0,
    projects: 0,
    documentGroups: 0,
    pendingPartnerProducts: 0,
    lowStockItems: 0,
    grossMarginPct: null,
    revenueLast30d: 0,
    newOrders: 0,
    pendingPOs: 0,
    trucksNotAssigned: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    paymentUnreconciled: 0,
    totalOutstanding: 0,
    supplierPayable: 0,
    fleetPayable: 0,
    alerts: { critical: 0, warning: 0, info: 0, total: 0 },
  },
  recentAlerts: [],
  pendingPartnerProducts: [],
  lowStockItems: [],
  recentProjects: [],
};

function fmt(n: number, money = false) {
  if (money) return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  return n.toLocaleString("th-TH");
}

function today() {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getAdminDashboard()
      .then((r) => { if (mounted) setDashboard(r); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : "โหลดไม่ได้"); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const m = dashboard.metrics;
  const criticalAlerts = m.alerts?.critical ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/alerts" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Bell className="size-4" />
            {criticalAlerts > 0 && (
              <span className="size-2 rounded-full bg-destructive absolute -top-0.5 -right-0.5" />
            )}
            Alerts
            {criticalAlerts > 0 && (
              <span className="badge-danger rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none ml-1">
                {criticalAlerts}
              </span>
            )}
          </Link>
          <Link href="/admin/orders/new" className={buttonVariants({ size: "sm" })}>
            <ClipboardList className="size-4" />
            สร้างคำสั่งซื้อ
          </Link>
        </div>
      </div>

      {/* ── Critical alert banner ───────────────────────────── */}
      {!isLoading && criticalAlerts > 0 && (
        <Alert variant="destructive" className="border-destructive/50">
          <ShieldAlert className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>มี <strong>{criticalAlerts}</strong> Alert วิกฤตที่ต้องดำเนินการด่วน</span>
            <Link href="/admin/alerts" className={buttonVariants({ variant: "destructive", size: "sm" })}>
              ดู Alert
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ══════════════════════════════════════════════════════
          ส่วนที่ 1 — FINANCIAL KPIs
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">ภาพรวมการเงิน</h2>
        </div>

        {/* Row 1: Revenue + Margin */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FinanceKPI
            label="รายได้ 30 วัน"
            value={isLoading ? null : m.revenueLast30d ?? 0}
            suffix="บาท"
            money
            icon={TrendingUp}
            color="success"
            href="/admin/invoices"
          />
          <FinanceKPI
            label="Gross Margin"
            value={isLoading ? null : m.grossMarginPct ?? null}
            suffix="%"
            icon={TrendingUp}
            color={m.grossMarginPct !== null && (m.grossMarginPct ?? 0) < 20 ? "danger" : "success"}
            href="/admin/invoices"
            isPercent
          />
          <FinanceKPI
            label="ลูกหนี้คงค้าง"
            value={isLoading ? null : m.totalOutstanding}
            suffix="บาท"
            money
            icon={Wallet}
            color={m.totalOutstanding > 0 ? "warning" : "neutral"}
            href="/admin/debt"
          />
          <FinanceKPI
            label="รอยืนยันการชำระ"
            value={isLoading ? null : m.paymentUnreconciled ?? 0}
            suffix="ใบ"
            icon={ClipboardList}
            color={(m.paymentUnreconciled ?? 0) > 0 ? "warning" : "neutral"}
            href="/admin/invoices"
          />
        </div>

        {/* Row 2: Invoices + Payables */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FinanceKPI
            label="Invoice ยังไม่ชำระ"
            value={isLoading ? null : m.unpaidInvoices}
            suffix="ใบ"
            icon={ClipboardList}
            color={m.unpaidInvoices > 0 ? "warning" : "neutral"}
            href="/admin/invoices"
          />
          <FinanceKPI
            label="Invoice เกินกำหนด"
            value={isLoading ? null : m.overdueInvoices}
            suffix="ใบ"
            icon={TrendingDown}
            color={m.overdueInvoices > 0 ? "danger" : "neutral"}
            href="/admin/invoices"
            urgent={m.overdueInvoices > 0}
          />
          <FinanceKPI
            label="ต้องจ่ายซัพพลายเออร์"
            value={isLoading ? null : m.supplierPayable}
            suffix="บาท"
            money
            icon={Banknote}
            color={m.supplierPayable > 0 ? "info" : "neutral"}
            href="/admin/settlements"
          />
          <FinanceKPI
            label="ต้องจ่ายผู้ขนส่ง"
            value={isLoading ? null : m.fleetPayable}
            suffix="บาท"
            money
            icon={Truck}
            color={m.fleetPayable > 0 ? "info" : "neutral"}
            href="/admin/settlements"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ส่วนที่ 2 — OPERATIONS (real-time)
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Operations (ต้องดำเนินการ)</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OpsCard
            label="คำสั่งซื้อใหม่ (24h)"
            value={isLoading ? null : m.newOrders}
            icon={ClipboardList}
            href="/admin/orders"
            urgent={m.newOrders > 0}
          />
          <OpsCard
            label="PO รอซัพพลายเออร์"
            value={isLoading ? null : m.pendingPOs}
            icon={PackageCheck}
            href="/admin/orders"
            urgent={m.pendingPOs > 0}
          />
          <OpsCard
            label="งานขนส่งรอมอบหมาย"
            value={isLoading ? null : m.trucksNotAssigned}
            icon={Truck}
            href="/admin/logistics"
            urgent={m.trucksNotAssigned > 0}
          />
          <OpsCard
            label="รอตรวจสอบสินค้า"
            value={isLoading ? null : m.pendingPartnerProducts}
            icon={Package}
            href="/admin/partner-products"
            urgent={m.pendingPartnerProducts > 0}
          />
        </div>

        {/* Ops: Reference counts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RefCard label="ลูกค้า" value={isLoading ? null : m.customers} icon={Building2} href="/admin/customers" />
          <RefCard label="สินค้า" value={isLoading ? null : m.products} icon={Boxes} href="/admin/products" />
          <RefCard label="โปรเจกต์" value={isLoading ? null : m.projects} icon={ClipboardList} href="/admin/projects" />
          <RefCard label="สต็อกต่ำ" value={isLoading ? null : m.lowStockItems} icon={TrendingDown} href="/admin/supplier-inventory" urgent={(m.lowStockItems ?? 0) > 0} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ส่วนที่ 3 — ACTION QUEUES
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-muted-foreground/40" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">คิวงาน</h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {/* Pending partner products */}
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">รอตรวจสอบสินค้าซัพพลายเออร์</CardTitle>
              <Link href="/admin/partner-products" className={buttonVariants({ variant: "outline", size: "sm" })}>
                เปิดคิว
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <QueueSkeleton />
              ) : dashboard.pendingPartnerProducts.length === 0 ? (
                <QueueEmpty label="ไม่มีสินค้ารอตรวจสอบ" />
              ) : (
                <div className="divide-y">
                  {dashboard.pendingPartnerProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.requestedProductName}</p>
                        <p className="text-xs text-muted-foreground">{item.supplierCompany?.name ?? "-"} · {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs tabular-nums text-muted-foreground">{Number(item.stockQty).toLocaleString()} {item.unit}</span>
                        <Link href={`/admin/partner-products/${item.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                          ตรวจสอบ
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent alerts */}
          <RecentAlertsCard alerts={dashboard.recentAlerts} isLoading={isLoading} />
        </div>

        {/* Recent projects */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">โปรเจกต์ล่าสุด</CardTitle>
            <Link href="/admin/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
              ดูทั้งหมด
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <QueueSkeleton />
            ) : dashboard.recentProjects.length === 0 ? (
              <QueueEmpty label="ยังไม่มีโปรเจกต์" />
            ) : (
              <div className="divide-y">
                {dashboard.recentProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{p.projectNo}</span>
                        <span className="text-sm font-medium truncate">{p.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.customerCompany?.name ?? "-"} · {p.customerSite?.siteName ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={p.status === "ACTIVE" ? "default" : "outline"} className="text-xs">
                        {p.status === "ACTIVE" ? "ดำเนินการ" : p.status === "COMPLETED" ? "เสร็จแล้ว" : p.status === "ON_HOLD" ? "หยุดชั่วคราว" : "ยกเลิก"}
                      </Badge>
                      <Link href={`/admin/projects/${p.projectNo}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        เปิด
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

type Color = "success" | "warning" | "danger" | "info" | "neutral";

const COLOR_ICON: Record<Color, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger:  "text-red-500",
  info:    "text-blue-500",
  neutral: "text-muted-foreground",
};

const COLOR_VALUE: Record<Color, string> = {
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  danger:  "text-red-700 dark:text-red-400",
  info:    "text-blue-700 dark:text-blue-400",
  neutral: "",
};

const COLOR_BORDER: Record<Color, string> = {
  success: "",
  warning: "border-amber-200 dark:border-amber-900",
  danger:  "border-red-200 dark:border-red-900",
  info:    "",
  neutral: "",
};

function FinanceKPI({
  label, value, suffix, money, icon: Icon, color, href, urgent, isPercent,
}: {
  label: string;
  value: number | null;
  suffix: string;
  money?: boolean;
  icon: React.ElementType;
  color: Color;
  href: string;
  urgent?: boolean;
  isPercent?: boolean;
}) {
  const displayValue = value === null ? "—" :
    isPercent ? (value !== null ? `${value}%` : "N/A") :
    money ? fmt(value, true) : fmt(value);

  return (
    <Link href={href} className="block group">
      <div className={`rounded-xl border bg-card px-4 py-3.5 transition-shadow hover:shadow-md ${urgent ? COLOR_BORDER[color] : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`size-3.5 ${COLOR_ICON[color]}`} />
        </div>
        <div className={`text-xl font-bold tabular-nums leading-none ${value !== null && (value as number) !== 0 ? COLOR_VALUE[color] : ""}`}>
          {displayValue}
        </div>
        {!isPercent && value !== null && (
          <div className="text-xs text-muted-foreground mt-1">{suffix}</div>
        )}
      </div>
    </Link>
  );
}

function OpsCard({
  label, value, icon: Icon, href, urgent,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link href={href} className="block group">
      <div className={`rounded-xl border px-4 py-3.5 transition-all hover:shadow-md
        ${urgent ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900" : "bg-card"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`size-3.5 ${urgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className={`text-2xl font-bold tabular-nums leading-none ${urgent ? "text-amber-700 dark:text-amber-300" : ""}`}>
          {value === null ? "—" : value.toLocaleString("th-TH")}
        </div>
        {urgent && value !== null && value > 0 && (
          <div className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">ต้องดำเนินการ</div>
        )}
      </div>
    </Link>
  );
}

function RefCard({
  label, value, icon: Icon, href, urgent,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link href={href} className="block group">
      <div className={`rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-shadow
        ${urgent ? "border-red-200 dark:border-red-900" : ""}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`size-3.5 ${urgent ? "text-red-500" : "text-muted-foreground"}`} />
        </div>
        <div className={`text-xl font-bold tabular-nums mt-1 ${urgent ? "text-red-700 dark:text-red-400" : ""}`}>
          {value === null ? "—" : value.toLocaleString("th-TH")}
        </div>
      </div>
    </Link>
  );
}

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: "badge-danger",
  WARNING:  "badge-warning",
  INFO:     "badge-neutral",
};
const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: "วิกฤต",
  WARNING:  "เตือน",
  INFO:     "ข้อมูล",
};

function RecentAlertsCard({ alerts, isLoading }: { alerts: RecentAlert[]; isLoading: boolean }) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">Alert ล่าสุด</CardTitle>
        <Link href="/admin/alerts" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ดูทั้งหมด
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <QueueSkeleton />
        ) : alerts.length === 0 ? (
          <QueueEmpty label="ไม่มี alert ที่ยังเปิดอยู่" />
        ) : (
          <div className="divide-y">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[a.severity] ?? SEVERITY_CLASS.INFO}`}>
                  {SEVERITY_LABEL[a.severity] ?? a.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug truncate">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.createdAt).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function QueueEmpty({ label }: { label: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">{label}</div>
  );
}
