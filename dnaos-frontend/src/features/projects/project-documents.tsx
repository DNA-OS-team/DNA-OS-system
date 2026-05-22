"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FolderPlus, Link2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createDocumentGroup, listProjectDocuments } from "./project-api";
import {
  documentGroupFormSchema,
  type DocumentGroupFormValues,
} from "./schemas";
import type { DocumentGroup, DocumentGroupStatus, Project } from "./types";

const groupStatuses: DocumentGroupStatus[] = ["OPEN", "CLOSED", "ARCHIVED"];

type ProjectDocumentsProps = {
  projectNo: string;
};

export function ProjectDocuments({ projectNo }: ProjectDocumentsProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DocumentGroupFormValues>({
    resolver: zodResolver(documentGroupFormSchema),
    defaultValues: {
      title: "",
      rootOrderNo: "",
      status: "OPEN",
    },
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });

  useEffect(() => {
    let isMounted = true;

    loadDocuments(isMounted);

    return () => {
      isMounted = false;
    };
  }, [projectNo]);

  async function loadDocuments(isMounted = true) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listProjectDocuments(projectNo);

      if (isMounted) {
        setProject(result.project);
        setDocumentGroups(result.documentGroups);
      }
    } catch (requestError) {
      if (isMounted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "ไม่สามารถโหลดเอกสารได้"
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  async function onSubmit(values: DocumentGroupFormValues) {
    setError(null);

    try {
      await createDocumentGroup(projectNo, values);
      form.reset({
        title: "",
        rootOrderNo: "",
        status: "OPEN",
      });
      await loadDocuments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ไม่สามารถสร้างชุดเอกสารได้"
      );
    }
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href={`/admin/projects/${projectNo}`}
      >
        <ArrowLeft />
        โปรเจกต์
      </Link>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{projectNo}</p>
          <h1 className="text-2xl font-semibold tracking-normal">
            เอกสารโปรเจกต์
          </h1>
          <p className="text-sm text-muted-foreground">
            {project?.title ?? "ชุดเอกสารและลิงก์อ้างอิง"}
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/documents/search"
        >
          <Link2 />
          ค้นหาเอกสาร
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการเอกสารไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>สร้างชุดเอกสาร</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_220px_180px]">
            <Field message={form.formState.errors.title?.message}>
              <Label htmlFor="title">ชื่อ</Label>
              <Input id="title" {...form.register("title")} />
            </Field>
            <Field message={form.formState.errors.rootOrderNo?.message}>
              <Label htmlFor="rootOrderNo">หมายเลข order หลัก</Label>
              <Input id="rootOrderNo" {...form.register("rootOrderNo")} />
            </Field>
            <Field message={form.formState.errors.status?.message}>
              <Label htmlFor="status">สถานะ</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  form.setValue("status", value as DocumentGroupStatus)
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupStatuses.map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {statusOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <FolderPlus />
              {form.formState.isSubmitting ? "กำลังสร้าง..." : "สร้างชุดเอกสาร"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>ชุดเอกสาร</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>กลุ่ม</TableHead>
                <TableHead>Order หลัก</TableHead>
                <TableHead>เอกสารอ้างอิง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    กำลังโหลดชุดเอกสาร...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && documentGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    ยังไม่มีชุดเอกสาร
                  </TableCell>
                </TableRow>
              ) : null}
              {documentGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div>
                      <div className="font-mono text-sm">{group.groupNo}</div>
                      <div className="font-medium">{group.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>{group.rootOrderNo ?? "-"}</TableCell>
                  <TableCell>{group.references?.length ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={group.status === "OPEN" ? "secondary" : "outline"}>
                      {group.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/document-groups/${group.groupNo}`}
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

function Field({
  children,
  className,
  message,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
