"use client";

import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  FileSearch,
  FolderKanban,
  PackageCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminDashboard } from "./dashboard-api";
import type { AdminDashboardData, DashboardMetricSet } from "./types";

const emptyDashboard: AdminDashboardData = {
  metrics: {
    customers: 0,
    suppliers: 0,
    products: 0,
    projects: 0,
    documentGroups: 0,
    pendingPartnerProducts: 0,
    lowStockItems: 0,
  },
  pendingPartnerProducts: [],
  lowStockItems: [],
  recentProjects: [],
};

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAdminDashboard()
      .then((result) => {
        if (isMounted) {
          setDashboard(result);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "ไม่สามารถโหลดแดชบอร์ดได้"
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            แดชบอร์ด Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมการดำเนินงาน ลูกค้า โปรเจกต์ การอนุมัติ และสต็อก
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeToggle />
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/orders"
          >
            <ClipboardList />
            คำสั่งซื้อ
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/documents/search"
          >
            <FileSearch />
            เอกสาร
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/projects/new"
          >
            <FolderKanban />
            โปรเจกต์ใหม่
          </Link>
          <Link
            className={buttonVariants({ size: "sm" })}
            href="/admin/partner-products"
          >
            <PackageCheck />
            สินค้าซัพพลายเออร์
          </Link>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>ไม่สามารถโหลดแดชบอร์ดได้</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <MetricGrid metrics={dashboard.metrics} isLoading={isLoading} />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รอตรวจสอบสินค้าซัพพลายเออร์</CardTitle>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/admin/partner-products"
            >
              เปิดคิว
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ซัพพลายเออร์</TableHead>
                  <TableHead>สต็อก</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <LoadingRow columns={4} /> : null}
                {!isLoading && dashboard.pendingPartnerProducts.length === 0 ? (
                  <EmptyRow columns={4} label="ไม่มีสินค้าซัพพลายเออร์ที่รอตรวจสอบ" />
                ) : null}
                {dashboard.pendingPartnerProducts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.requestedProductName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.requestedCategoryName || item.unit}
                      </div>
                    </TableCell>
                    <TableCell>{item.supplierCompany?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatNumber(item.stockQty)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                        href={`/admin/partner-products/${item.id}`}
                      >
                        ตรวจสอบ
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>สต็อกต่ำ</CardTitle>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/admin/supplier-inventory"
            >
              คลังสินค้า
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รายการ</TableHead>
                  <TableHead>คงเหลือ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <LoadingRow columns={2} /> : null}
                {!isLoading && dashboard.lowStockItems.length === 0 ? (
                  <EmptyRow columns={2} label="ไม่มีรายการสต็อกต่ำ" />
                ) : null}
                {dashboard.lowStockItems.map((item) => {
                  const product = item.supplierProduct?.productVariant?.product?.name ?? "-";
                  const variant = item.supplierProduct?.productVariant?.name ?? "-";

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{product}</div>
                        <div className="text-xs text-muted-foreground">
                          {variant} / {item.supplierProduct?.supplierCompany?.name ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{formatNumber(item.availableQty)} {item.unit}</div>
                        <Badge variant="outline">
                          เกณฑ์ {formatNumber(item.lowStockThreshold)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>โปรเจกต์ล่าสุด</CardTitle>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/projects"
          >
            โปรเจกต์
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>โปรเจกต์</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สถานที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={5} /> : null}
              {!isLoading && dashboard.recentProjects.length === 0 ? (
                <EmptyRow columns={5} label="ยังไม่มีโปรเจกต์" />
              ) : null}
              {dashboard.recentProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{project.projectNo}</div>
                    <div className="font-medium">{project.title}</div>
                  </TableCell>
                  <TableCell>{project.customerCompany?.name ?? "-"}</TableCell>
                  <TableCell>{project.customerSite?.siteName ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === "ACTIVE" ? "secondary" : "outline"}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/projects/${project.projectNo}`}
                    >
                      เปิด
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricGrid({
  metrics,
  isLoading,
}: {
  metrics: DashboardMetricSet;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: "ลูกค้า",
      value: metrics.customers,
      href: "/admin/customers",
      icon: Building2,
    },
    {
      label: "ซัพพลายเออร์",
      value: metrics.suppliers,
      href: "/admin/partner-products",
      icon: Users,
    },
    {
      label: "สินค้า",
      value: metrics.products,
      href: "/admin/products",
      icon: Boxes,
    },
    {
      label: "โปรเจกต์",
      value: metrics.projects,
      href: "/admin/projects",
      icon: FolderKanban,
    },
    {
      label: "ชุดเอกสาร",
      value: metrics.documentGroups,
      href: "/admin/documents/search",
      icon: ClipboardList,
    },
    {
      label: "รออนุมัติ",
      value: metrics.pendingPartnerProducts,
      href: "/admin/partner-products",
      icon: PackageCheck,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link key={card.label} href={card.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="flex h-28 flex-col justify-between p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">
                  {isLoading ? "-" : card.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function LoadingRow({ columns }: { columns: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="text-muted-foreground">
        กำลังโหลด...
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ columns, label }: { columns: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
}
