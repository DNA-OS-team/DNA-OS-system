"use client";

import { FileSearch, FolderKanban, Link2, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchDocuments } from "./project-api";
import type { DocumentSearchResult } from "./types";

const emptyResult: DocumentSearchResult = {
  projects: [],
  documentGroups: [],
  documentReferences: [],
};

export function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DocumentSearchResult>(emptyResult);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                : "Unable to search documents"
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Document search
        </h1>
        <p className="text-sm text-muted-foreground">
          Search project numbers, document groups, order numbers, and references.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Search unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Reference lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search PRJ, GRP, order, QT, PO, INV, receipt..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.projects.length === 0 ? (
                <EmptyRow columns={4} label="No projects found." />
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
                      Open
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
          <CardTitle>Document groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Root order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.documentGroups.length === 0 ? (
                <EmptyRow columns={4} label="No document groups found." />
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
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={`/admin/document-groups/${group.groupNo}`}
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

      <Card>
        <CardHeader>
          <CardTitle>Document references</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Related document</TableHead>
                <TableHead>Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRow columns={4} /> : null}
              {!isLoading && result.documentReferences.length === 0 ? (
                <EmptyRow columns={4} label="No references found." />
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
        Searching...
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
