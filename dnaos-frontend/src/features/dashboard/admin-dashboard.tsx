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
              : "Unable to load dashboard"
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
            Admin dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Operational overview for customers, projects, partner approvals, and stock.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeToggle />
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/orders"
          >
            <ClipboardList />
            Orders
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/documents/search"
          >
            <FileSearch />
            Documents
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/projects/new"
          >
            <FolderKanban />
            New project
          </Link>
          <Link
            className={buttonVariants({ size: "sm" })}
            href="/admin/partner-products"
          >
            <PackageCheck />
            Partner products
          </Link>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <MetricGrid metrics={dashboard.metrics} isLoading={isLoading} />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending partner products</CardTitle>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/admin/partner-products"
            >
              Open queue
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <LoadingRow columns={4} /> : null}
                {!isLoading && dashboard.pendingPartnerProducts.length === 0 ? (
                  <EmptyRow columns={4} label="No pending partner products." />
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
                        Review
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
            <CardTitle>Low stock</CardTitle>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/admin/supplier-inventory"
            >
              Inventory
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <LoadingRow columns={2} /> : null}
                {!isLoading && dashboard.lowStockItems.length === 0 ? (
                  <EmptyRow columns={2} label="No low stock items." />
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
                          threshold {formatNumber(item.lowStockThreshold)}
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
          <CardTitle>Recent projects</CardTitle>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/projects"
          >
            Projects
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={5} /> : null}
              {!isLoading && dashboard.recentProjects.length === 0 ? (
                <EmptyRow columns={5} label="No projects yet." />
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
                      Open
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
      label: "Customers",
      value: metrics.customers,
      href: "/admin/customers",
      icon: Building2,
    },
    {
      label: "Suppliers",
      value: metrics.suppliers,
      href: "/admin/partner-products",
      icon: Users,
    },
    {
      label: "Products",
      value: metrics.products,
      href: "/admin/products",
      icon: Boxes,
    },
    {
      label: "Projects",
      value: metrics.projects,
      href: "/admin/projects",
      icon: FolderKanban,
    },
    {
      label: "Document groups",
      value: metrics.documentGroups,
      href: "/admin/documents/search",
      icon: ClipboardList,
    },
    {
      label: "Pending approvals",
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
        Loading...
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
