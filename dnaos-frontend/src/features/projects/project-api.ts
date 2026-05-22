import { apiFetch } from "@/lib/api";
import type {
  CustomerOption,
  DocumentGroup,
  DocumentReference,
  DocumentSearchResult,
  Project,
} from "./types";
import type {
  DocumentGroupFormValues,
  DocumentReferenceFormValues,
  ProjectFormValues,
} from "./schemas";

export type ProjectListFilters = {
  q?: string;
  status?: "all" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
};

export function listProjectCustomerOptions() {
  return apiFetch<{ customers: CustomerOption[] }>("/admin/projects/customer-options");
}

export function listProjects(filters: ProjectListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return apiFetch<{ projects: Project[] }>(
    `/admin/projects${query ? `?${query}` : ""}`
  );
}

export function createProject(input: ProjectFormValues) {
  return apiFetch<{ project: Project }>("/admin/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getProject(projectNo: string) {
  return apiFetch<{ project: Project }>(`/admin/projects/${projectNo}`);
}

export function updateProject(projectNo: string, input: ProjectFormValues) {
  return apiFetch<{ project: Project }>(`/admin/projects/${projectNo}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listProjectDocuments(projectNo: string) {
  return apiFetch<{ project: Project; documentGroups: DocumentGroup[] }>(
    `/admin/projects/${projectNo}/documents`
  );
}

export function createDocumentGroup(
  projectNo: string,
  input: DocumentGroupFormValues
) {
  return apiFetch<{ documentGroup: DocumentGroup }>(
    `/admin/projects/${projectNo}/document-groups`,
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        rootOrderNo: input.rootOrderNo || null,
      }),
    }
  );
}

export function getDocumentGroup(groupNo: string) {
  return apiFetch<{ documentGroup: DocumentGroup }>(
    `/admin/document-groups/${groupNo}`
  );
}

export function createDocumentReference(
  groupNo: string,
  input: DocumentReferenceFormValues
) {
  return apiFetch<{ documentReference: DocumentReference }>(
    `/admin/document-groups/${groupNo}/references`,
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        documentId: input.documentId || undefined,
      }),
    }
  );
}

export function searchDocuments(query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  return apiFetch<DocumentSearchResult>(`/admin/documents/search?${params.toString()}`);
}
