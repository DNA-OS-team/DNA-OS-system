"use client";

import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Package,
  PackageCheck,
  Receipt,
  Scale,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "@/features/auth/auth-api";

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
      { label: "การแจ้งเตือน", href: "/admin/alerts", icon: Bell },
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
      { label: "ใบแจ้งหนี้", href: "/admin/invoices", icon: Receipt },
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
      { label: "Settlement", href: "/admin/settlements", icon: BarChart3 },
    ],
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("shrink-0 size-4", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logoutAdmin();
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
    >
      <LogOut className="size-4 shrink-0 opacity-70 group-hover:opacity-100" />
      <span>{loading ? "กำลังออก..." : "ออกจากระบบ"}</span>
    </button>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="relative flex w-[220px] shrink-0 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm">
          <span className="text-xs font-black tracking-tighter text-sidebar-primary-foreground">DNA</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">DNA OS</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-2">
        <LogoutButton />
      </div>
    </aside>
  );
}
