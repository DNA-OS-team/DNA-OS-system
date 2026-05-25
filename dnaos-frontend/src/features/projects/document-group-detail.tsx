"use client";

import { zodResolver } from "@/lib/zod-resolver";
import { ArrowLeft, Link2 } from "lucide-react";
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
import {
  createDocumentReference,
  getDocumentGroup,
} from "./project-api";
import {
  documentReferenceFormSchema,
  type DocumentReferenceFormValues,
} from "./schemas";
import type {
  DocumentGroup,
  DocumentReferenceRelationType,
  DocumentTypeCode,
} from "./types";

const documentTypes: DocumentTypeCode[] = ["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"];
const relationTypes: DocumentReferenceRelationType[] = [
  "SOURCE",
  "PARENT",
  "CHILD",
  "GENERATED_FROM",
  "PAID_BY",
  "SETTLED_BY",
];

type DocumentGroupDetailProps = {
  groupNo: string;
};

export function DocumentGroupDetail({ groupNo }: DocumentGroupDetailProps) {
  const [documentGroup, setDocumentGroup] = useState<DocumentGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DocumentReferenceFormValues>({
    resolver: zodResolver(documentReferenceFormSchema),
    defaultValues: {
      documentId: "",
      documentType: "QT",
      relatedDocumentId: "",
      relationType: "GENERATED_FROM",
    },
  });
  const documentType = useWatch({
    control: form.control,
    name: "documentType",
  });
  const relationType = useWatch({
    control: form.control,
    name: "relationType",
  });

  useEffect(() => {
    let isMounted = true;

    loadGroup(isMounted);

    return () => {
      isMounted = false;
    };
  }, [groupNo]);

  async function loadGroup(isMounted = true) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getDocumentGroup(groupNo);

      if (isMounted) {
        setDocumentGroup(result.documentGroup);
      }
    } catch (requestError) {
      if (isMounted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "ไม่สามารถโหลดชุดเอกสารได้"
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  async function onSubmit(values: DocumentReferenceFormValues) {
    setError(null);

    try {
      await createDocumentReference(groupNo, values);
      form.reset({
        documentId: "",
        documentType: "QT",
        relatedDocumentId: "",
        relationType: "GENERATED_FROM",
      });
      await loadGroup();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ไม่สามารถสร้างเอกสารอ้างอิงได้"
      );
    }
  }

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href={
          documentGroup?.project?.projectNo
            ? `/admin/projects/${documentGroup.project.projectNo}/documents`
            : "/admin/projects"
        }
      >
        <ArrowLeft />
        เอกสาร
      </Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          {documentGroup ? (
            <Badge variant={documentGroup.status === "OPEN" ? "secondary" : "outline"}>
              {documentGroup.status}
            </Badge>
          ) : null}
          <Badge variant="outline">{documentGroup?.projectNo ?? "-"}</Badge>
        </div>
        <p className="font-mono text-sm text-muted-foreground">{groupNo}</p>
        <h1 className="text-2xl font-semibold tracking-normal">
          {documentGroup?.title ?? "ชุดเอกสาร"}
        </h1>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการชุดเอกสารไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มเอกสารอ้างอิง</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field message={form.formState.errors.documentId?.message}>
              <Label htmlFor="documentId">หมายเลขเอกสาร</Label>
              <Input
                id="documentId"
                placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                {...form.register("documentId")}
              />
            </Field>
            <Field message={form.formState.errors.documentType?.message}>
              <Label htmlFor="documentType">ประเภทเอกสาร</Label>
              <Select
                value={documentType}
                onValueChange={(value) =>
                  form.setValue("documentType", value as DocumentTypeCode)
                }
              >
                <SelectTrigger id="documentType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field message={form.formState.errors.relatedDocumentId?.message}>
              <Label htmlFor="relatedDocumentId">หมายเลขเอกสารที่เกี่ยวข้อง</Label>
              <Input id="relatedDocumentId" {...form.register("relatedDocumentId")} />
            </Field>
            <Field message={form.formState.errors.relationType?.message}>
              <Label htmlFor="relationType">ความสัมพันธ์</Label>
              <Select
                value={relationType}
                onValueChange={(value) =>
                  form.setValue("relationType", value as DocumentReferenceRelationType)
                }
              >
                <SelectTrigger id="relationType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Link2 />
              {form.formState.isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มเอกสาร"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>เอกสารอ้างอิง</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เอกสาร</TableHead>
                <TableHead>ความสัมพันธ์</TableHead>
                <TableHead>เอกสารที่เกี่ยวข้อง</TableHead>
                <TableHead>สร้างเมื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    กำลังโหลดเอกสารอ้างอิง...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && (documentGroup?.references?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    ยังไม่มีเอกสารอ้างอิง
                  </TableCell>
                </TableRow>
              ) : null}
              {(documentGroup?.references ?? []).map((reference) => (
                <TableRow key={reference.id}>
                  <TableCell className="font-mono text-sm">
                    {reference.documentId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{reference.relationType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {reference.relatedDocumentId}
                  </TableCell>
                  <TableCell>
                    {new Date(reference.createdAt).toLocaleDateString()}
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
