import Link from "next/link";
import { Building2, ChevronRight, Package, Truck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DNA OS",
  description: "ระบบปฏิบัติการพาณิชย์ก่อสร้าง",
};

const portals = [
  {
    key: "customer",
    icon: Building2,
    title: "ลูกค้า",
    description: "ติดตามคำสั่งซื้อ สถานะการส่งสินค้า และเอกสารของคุณ",
    href: "/line/connect?next=/customer/orders",
    iconClass: "text-blue-500",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    key: "partner",
    icon: Truck,
    title: "พาร์ทเนอร์รถร่วม",
    description: "รับงานขนส่ง ติดตามสถานะงาน และบันทึกการส่งสินค้า",
    href: "/line/connect?next=/partner",
    iconClass: "text-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    key: "supplier",
    icon: Package,
    title: "ซัพพลายเออร์",
    description: "จัดการใบสั่งซื้อ อัพเดทสต็อก และยืนยันการจัดส่ง",
    href: "/line/connect?next=/supplier",
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            ระบบปฏิบัติการพาณิชย์ก่อสร้าง
          </p>
          <h1 className="text-3xl font-bold tracking-tight">DNA OS</h1>
          <p className="text-sm text-muted-foreground">เลือกพอร์ทัลที่ต้องการเข้าใช้งาน</p>
        </div>

        {/* Portal cards */}
        <div className="flex flex-col gap-3">
          {portals.map(({ key, icon: Icon, title, description, href, iconClass, bgClass }) => (
            <Link
              key={key}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
                <Icon className={`size-6 ${iconClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* Admin link */}
        <p className="text-center text-xs text-muted-foreground">
          ผู้ดูแลระบบ?{" "}
          <Link href="/admin/login" className="text-primary hover:underline">
            เข้าสู่ระบบ Admin
          </Link>
        </p>
      </div>
    </main>
  );
}
