"use client";

import { FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProjects } from "./project-api";
import type { Project, ProjectStatus } from "./types";

const statuses: Array<"all" | ProjectStatus> = [
  "all",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      listProjects({ q: query, status })
        .then((result) => {
          if (isMounted) {
            setProjects(result.projects);
          }
        })
        .catch((requestError: unknown) => {
          if (isMounted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "ไม่สามารถโหลดโปรเจกต์ได้"
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">โปรเจกต์</h1>
          <p className="text-sm text-muted-foreground">
            จัดการหมายเลขโปรเจกต์ สถานที่ลูกค้า และชุดเอกสาร
          </p>
        </div>
        <Link className={buttonVariants()} href="/admin/projects/new">
          <Plus />
          โปรเจกต์ใหม่
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ไม่สามารถโหลดโปรเจกต์ได้</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองโปรเจกต์</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหาโปรเจกต์ ลูกค้า หรือชื่อเรื่อง"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "all" | ProjectStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {statusOption === "all" ? "ทุกสถานะ" : statusOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ทะเบียนโปรเจกต์</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>โปรเจกต์</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สถานที่</TableHead>
                <TableHead>กลุ่ม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    กำลังโหลดโปรเจกต์...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    ไม่พบโปรเจกต์
                  </TableCell>
                </TableRow>
              ) : null}
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-mono text-sm">{project.projectNo}</div>
                        <div className="font-medium">{project.title}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.customerCompany?.name ?? "-"}</TableCell>
                  <TableCell>{project.customerSite?.siteName ?? "-"}</TableCell>
                  <TableCell>{project.documentGroupCount ?? 0}</TableCell>
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
