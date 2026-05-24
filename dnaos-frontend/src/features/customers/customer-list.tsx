"use client";

import { Building2, CreditCard, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyStatusBadge } from "@/components/shared/status-badge";
import { listCustomers } from "./customer-api";
import type { Customer } from "./types";

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
          <Link
            key={customer.id}
            href={`/admin/customers/${customer.id}`}
            className="group rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all block"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
                  <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.taxId ? `เลขภาษี ${customer.taxId}` : "ยังไม่มีเลขภาษี"}</p>
                </div>
              </div>
              <CompanyStatusBadge status={customer.status} />
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
          </Link>
        ))}
      </div>
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">{filtered.length} บริษัท</p>
      )}
    </div>
  );
}
