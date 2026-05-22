"use client";

import { ArrowLeft, Files } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProject } from "./project-api";
import { ProjectForm } from "./project-form";
import type { Project } from "./types";

type ProjectDetailProps = {
  projectNo: string;
};

export function ProjectDetail({ projectNo }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getProject(projectNo)
      .then((result) => {
        if (isMounted) {
          setProject(result.project);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load project"
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
  }, [projectNo]);

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/projects"
      >
        <ArrowLeft />
        Projects
      </Link>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Project unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading project...</p>
      ) : null}

      {project ? (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={project.status === "ACTIVE" ? "secondary" : "outline"}>
                  {project.status}
                </Badge>
                <Badge variant="outline">{project.customerCompany?.name}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                {project.projectNo}
              </p>
              <h1 className="text-2xl font-semibold tracking-normal">
                {project.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Site: {project.customerSite?.siteName ?? "-"}
              </p>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/admin/projects/${project.projectNo}/documents`}
            >
              <Files />
              Documents
            </Link>
          </div>
          <Separator />
          <ProjectForm project={project} />
        </>
      ) : null}
    </div>
  );
}
