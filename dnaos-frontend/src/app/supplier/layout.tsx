import type { ReactNode } from "react";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600">
            <span className="text-xs font-bold text-white">D</span>
          </div>
          <span className="font-semibold text-sm">DNA OS</span>
          <span className="text-xs text-muted-foreground ml-1">ซัพพลายเออร์</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-8">{children}</main>
    </div>
  );
}
