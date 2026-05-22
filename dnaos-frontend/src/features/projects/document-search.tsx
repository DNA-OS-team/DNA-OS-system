"use client";

import { FilePlus2, FileSearch, FolderKanban, Link2, Search } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { createDocumentReference, searchDocuments } from "./project-api";
import type {
  DocumentReferenceRelationType,
  DocumentSearchResult,
  DocumentTypeCode,
} from "./types";

const emptyResult: DocumentSearchResult = {
  projects: [],
  documentGroups: [],
  documentReferences: [],
};

const documentTypes: DocumentTypeCode[] = ["ORD", "BOQ", "QT", "PO", "INV", "RCP", "PV", "PMT"];

const relationTypes: DocumentReferenceRelationType[] = [
  "SOURCE",
  "PARENT",
  "CHILD",
  "GENERATED_FROM",
  "PAID_BY",
  "SETTLED_BY",
];

const documentTypeLabels: Record<DocumentTypeCode, string> = {
  ORD: "ORD - Order",
  BOQ: "BOQ - ใบปริมาณงานและราคา",
  QT: "QT - ใบเสนอราคา",
  PO: "PO - ใบสั่งซื้อ supplier",
  INV: "INV - ใบแจ้งหนี้",
  RCP: "RCP - ใบเสร็จรับเงิน",
  PV: "PV - ใบสำคัญจ่าย",
  PMT: "PMT - คำสั่งจ่ายเงิน",
};

const relationTypeLabels: Record<DocumentReferenceRelationType, string> = {
  SOURCE: "SOURCE - เอกสารต้นทาง",
  PARENT: "PARENT - เอกสารแม่",
  CHILD: "CHILD - เอกสารลูก",
  GENERATED_FROM: "GENERATED_FROM - สร้างจากเอกสารนี้",
  PAID_BY: "PAID_BY - ชำระโดย",
  SETTLED_BY: "SETTLED_BY - เคลียร์ยอดโดย",
};

export function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DocumentSearchResult>(emptyResult);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueGroupNo, setIssueGroupNo] = useState("");
  const [issueDocumentType, setIssueDocumentType] = useState<DocumentTypeCode>("QT");
  const [issueRelatedDocumentId, setIssueRelatedDocumentId] = useState("");
  const [issueRelationType, setIssueRelationType] =
    useState<DocumentReferenceRelationType>("GENERATED_FROM");
  const [isIssuingDocument, setIsIssuingDocument] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedDocumentId, setIssuedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (!query.trim()) {
        setResult(emptyResult);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      searchDocuments(query)
        .then((searchResult) => {
          if (isMounted) {
            setResult(searchResult);
          }
        })
        .catch((requestError: unknown) => {
          if (isMounted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "ไม่สามารถค้นหาเอกสารได้"
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  async function handleIssueDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssueError(null);
    setIssuedDocumentId(null);

    if (!issueGroupNo.trim()) {
      setIssueError("กรุณาระบุเลขชุดเอกสาร");
      return;
    }

    if (!issueRelatedDocumentId.trim()) {
      setIssueError("กรุณาระบุเลขเอกสารอ้างอิง");
      return;
    }

    setIsIssuingDocument(true);

    try {
      const result = await createDocumentReference(issueGroupNo.trim(), {
        documentType: issueDocumentType,
        relatedDocumentId: issueRelatedDocumentId.trim(),
        relationType: issueRelationType,
      });
      setIssuedDocumentId(result.documentReference.documentId);
      setQuery(result.documentReference.documentId);
    } catch (requestError) {
      setIssueError(
        requestError instanceof Error
          ? requestError.message
          : "ออกเลขเอกสารไม่สำเร็จ"
      );
    } finally {
      setIsIssuingDocument(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          ค้นหาเอกสาร
        </h1>
        <p className="text-sm text-muted-foreground">
          ค้นหาหมายเลขโปรเจกต์ ชุดเอกสาร หมายเลข order และเอกสารอ้างอิง
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>ไม่สามารถค้นหาได้</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="size-5 text-muted-foreground" />
            ออกเลขเอกสาร
          </CardTitle>
          <CardDescription>
            ใช้สำหรับออกเลขเอกสารและผูกความสัมพันธ์กับชุดเอกสารเดิม เลขเอกสารถูกสร้างจากฝั่ง server เท่านั้น
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {issueError ? (
            <Alert variant="destructive">
              <AlertTitle>ออกเลขเอกสารไม่สำเร็จ</AlertTitle>
              <AlertDescription>{issueError}</AlertDescription>
            </Alert>
          ) : null}

          {issuedDocumentId ? (
            <Alert>
              <AlertTitle>ออกเลขเอกสารสำเร็จ</AlertTitle>
              <AlertDescription>
                เลขเอกสารใหม่คือ <span className="font-mono">{issuedDocumentId}</span>
              </AlertDescription>
            </Alert>
          ) : null}

          <form className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1.1fr_1fr_auto]" onSubmit={handleIssueDocument}>
            <div className="space-y-2">
              <Label htmlFor="issue-group-no">ชุดเอกสาร</Label>
              <Input
                id="issue-group-no"
                value={issueGroupNo}
                onChange={(event) => setIssueGroupNo(event.target.value)}
                placeholder="GRP-2026-0001"
              />
            </div>

            <div className="space-y-2">
              <Label>ประเภทเอกสาร</Label>
              <Select
                value={issueDocumentType}
                onValueChange={(value) => setIssueDocumentType(value as DocumentTypeCode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((documentType) => (
                    <SelectItem key={documentType} value={documentType}>
                      {documentTypeLabels[documentType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-related-document">เอกสารอ้างอิง</Label>
              <Input
                id="issue-related-document"
                value={issueRelatedDocumentId}
                onChange={(event) => setIssueRelatedDocumentId(event.target.value)}
                placeholder="ORD / BOQ / QT / PO"
              />
            </div>

            <div className="space-y-2">
              <Label>ความสัมพันธ์</Label>
              <Select
                value={issueRelationType}
                onValueChange={(value) =>
                  setIssueRelationType(value as DocumentReferenceRelationType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationTypes.map((relationType) => (
                    <SelectItem key={relationType} value={relationType}>
                      {relationTypeLabels[relationType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isIssuingDocument}>
                <FilePlus2 />
                {isIssuingDocument ? "กำลังออกเลข..." : "ออกเอกสาร"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ค้นหาเอกสารอ้างอิง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="ค้นหา PRJ, GRP, order, QT, PO, INV, ใบเสร็จ..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>โปรเจกต์</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>โปรเจกต์</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.projects.length === 0 ? (
                <EmptyRow columns={4} label="ไม่พบโปรเจกต์" />
              ) : null}
              {result.projects.map((project) => (
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
                  <TableCell>
                    <Badge variant="outline">{project.status}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle>ชุดเอกสาร</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>กลุ่ม</TableHead>
                <TableHead>โปรเจกต์</TableHead>
                <TableHead>Order หลัก</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.documentGroups.length === 0 ? (
                <EmptyRow columns={4} label="ไม่พบชุดเอกสาร" />
              ) : null}
              {result.documentGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{group.groupNo}</div>
                    <div className="font-medium">{group.title}</div>
                  </TableCell>
                  <TableCell>{group.projectNo}</TableCell>
                  <TableCell>{group.rootOrderNo ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIssueGroupNo(group.groupNo);
                          setIssueRelatedDocumentId(group.rootOrderNo ?? group.projectNo);
                        }}
                      >
                        ใช้ชุดนี้
                      </Button>
                      <Link
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                        href={`/admin/document-groups/${group.groupNo}`}
                      >
                        เปิด
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <TableHead>กลุ่ม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.documentReferences.length === 0 ? (
                <EmptyRow columns={4} label="ไม่พบเอกสารอ้างอิง" />
              ) : null}
              {result.documentReferences.map((reference) => (
                <TableRow key={reference.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSearch className="size-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{reference.documentId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{reference.relationType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {reference.relatedDocumentId}
                  </TableCell>
                  <TableCell>
                    {reference.documentGroup?.groupNo ? (
                      <Link
                        className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                        href={`/admin/document-groups/${reference.documentGroup.groupNo}`}
                      >
                        <Link2 className="size-3" />
                        {reference.documentGroup.groupNo}
                      </Link>
                    ) : (
                      "-"
                    )}
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

function LoadingRow({ columns }: { columns: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="text-muted-foreground">
        กำลังค้นหา...
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
