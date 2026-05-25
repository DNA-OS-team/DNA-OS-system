"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, History, Banknote } from "lucide-react";

function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/liff/fleet/jobs", label: "งานของฉัน", icon: Truck },
    { href: "/liff/fleet/earnings", label: "รายได้", icon: Banknote },
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
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function LiffFleetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
