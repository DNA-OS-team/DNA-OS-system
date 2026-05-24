"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  Package,
  PackageCheck,
  Receipt,
  Scale,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "ภาพรวม",
    items: [
      { label: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Alerts", href: "/admin/alerts", icon: Bell },
    ],
  },
  {
    title: "ลูกค้า & การขาย",
    items: [
      { label: "ลูกค้า", href: "/admin/customers", icon: Building2 },
      { label: "คำสั่งซื้อ", href: "/admin/orders", icon: ClipboardList },
      { label: "โปรเจกต์", href: "/admin/projects", icon: FolderKanban },
    ],
  },
  {
    title: "เอกสาร & การเงิน",
    items: [
      { label: "เอกสาร", href: "/admin/documents/search", icon: FileSearch },
      { label: "Invoice", href: "/admin/invoices", icon: Receipt },
      { label: "ลูกหนี้", href: "/admin/debt", icon: Wallet },
    ],
  },
  {
    title: "สินค้า & คลัง",
    items: [
      { label: "สินค้า", href: "/admin/products", icon: Package },
      { label: "ซัพพลายเออร์", href: "/admin/partner-products", icon: PackageCheck },
      { label: "ใบสั่งซื้อ (PO)", href: "/admin/procurement/purchase-orders", icon: ShoppingCart },
    ],
  },
  {
    title: "โลจิสติกส์",
    items: [
      { label: "งานขนส่ง", href: "/admin/logistics", icon: Truck },
      { label: "ข้อพิพาท", href: "/admin/disputes", icon: Scale },
    ],
  },
  {
    title: "การเงิน",
    items: [
      { label: "Settlement", href: "/admin/settlements", icon: BarChart3 },
    ],
  },
];

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("shrink-0", collapsed ? "size-5" : "size-4")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-sidebar transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
      style={{ borderColor: "var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b px-3", collapsed && "justify-center")}
        style={{ borderColor: "var(--sidebar-border)" }}>
        {collapsed ? (
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            D
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              DNA
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-wide">
              DNA OS
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2" style={{ borderColor: "var(--sidebar-border)" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="size-4" /> : (
            <>
              <ChevronLeft className="size-4" />
              <span>ย่อเมนู</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
