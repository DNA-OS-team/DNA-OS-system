import type { ReactNode } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">D</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">DNA OS</span>
          </div>
          <span className="text-xs text-muted-foreground">Customer Portal</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-4">
        {children}
      </main>
    </div>
  );
}
