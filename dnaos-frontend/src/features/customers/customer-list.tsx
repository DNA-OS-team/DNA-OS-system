"use client";

import { Building2, CreditCard, ExternalLink, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyStatusBadge } from "@/components/shared/status-badge";
import { listCustomers } from "./customer-api";
import { CustomerDialog } from "./customer-dialog";
import type { Customer } from "./types";

function LineBadge({ lineDisplayName }: { lineDisplayName?: string | null }) {
  if (lineDisplayName) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#06C755]/10 px-2 py-0.5 text-[10px] font-semibold text-[#06C755]">
        <span className="size-1.5 rounded-full bg-[#06C755]" />
        LINE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
      ไม่มี LINE
    </span>
  );
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listCustomers()
      .then((r) => { if (active) setCustomers(r.customers); })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = customers.filter((c) =>
    !query ||
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <CustomerDialog
        customer={selected}
        onClose={() => setSelected(null)}
        onUpdated={(updated) => {
          setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
          setSelected(updated);
        }}
        onDeleted={(id) => {
          setCustomers((prev) => prev.filter((c) => c.id !== id));
          setSelected(null);
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground mt-0.5">จัดการบริษัทลูกค้า สถานที่ และเครดิต</p>
        </div>
        <Link className={buttonVariants()} href="/admin/customers/new">
          <Plus className="size-4" />
          เพิ่มลูกค้าใหม่
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="ค้นหาชื่อหรืออีเมล..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse h-32" />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">ไม่พบลูกค้า</p>
          </div>
        )}
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="group relative rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
            onClick={() => setSelected(customer)}
          >
            {/* Link to full page — stop propagation so card click still opens dialog */}
            <a
              href={`/admin/customers/${customer.id}`}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
              title="เปิดหน้าเต็ม"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3.5" />
            </a>

            <div className="flex items-start gap-2 mb-3 pr-6">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
                <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{customer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{customer.taxId ? `เลขภาษี ${customer.taxId}` : "ยังไม่มีเลขภาษี"}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <CompanyStatusBadge status={customer.status} />
              <LineBadge lineDisplayName={customer.lineDisplayName} />
            </div>

            <div className="space-y-1 text-xs text-muted-foreground mb-3">
              {customer.email && <p className="truncate">✉ {customer.email}</p>}
              {customer.phone && <p>☎ {customer.phone}</p>}
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="size-3" />
                <span>{customer.siteCount ?? 0} สถานที่</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="size-3" />
                <span className={customer.customerCreditProfile ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                  {customer.customerCreditProfile ? "มีเครดิต" : "ยังไม่ตั้งค่า"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">{filtered.length} บริษัท</p>
      )}
    </div>
  );
}
