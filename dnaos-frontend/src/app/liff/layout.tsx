"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ClipboardList, ShoppingCart } from "lucide-react";
import { CartProvider, useCart } from "@/features/liff/cart-context";

function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  const tabs = [
    { href: "/liff/shop", label: "สินค้า", icon: ShoppingBag },
    { href: "/liff/cart", label: "ตะกร้า", icon: ShoppingCart, badge: count },
    { href: "/liff/orders", label: "คำสั่งซื้อ", icon: ClipboardList },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
      <div className="flex">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className="relative">
                <Icon className="size-5" />
                {tab.badge ? (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </div>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen pb-16">
        {children}
      </div>
      <BottomNav />
    </CartProvider>
  );
}
