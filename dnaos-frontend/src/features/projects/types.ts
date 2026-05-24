import type { Customer, CustomerSite } from "@/features/customers/types";

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type DocumentGroupStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type DocumentTypeCode = "ORD" | "BOQ" | "QT" | "PO" | "INV" | "RCP" | "PV" | "PMT";
export type DocumentReferenceRelationType =
  | "SOURCE"
  | "PARENT"
  | "CHILD"
  | "GENERATED_FROM"
  | "PAID_BY"
  | "SETTLED_BY";

export type CustomerOption = Customer & {
  customerSites: CustomerSite[];
};

export type Project = {
  id: string;
  projectNo: string;
  customerCompanyId: string;
  customerSiteId: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  customerCompany?: Customer;
  customerSite?: CustomerSite;
  documentGroupCount?: number;
};

export type DocumentReference = {
  id: string;
  documentGroupId: string | null;
  documentId: string;
  relatedDocumentId: string;
  relationType: DocumentReferenceRelationType;
  createdAt: string;
  documentGroup?: DocumentGroup | null;
};

export type DocumentGroup = {
  id: string;
  groupNo: string;
  projectId: string;
  projectNo: string;
  rootOrderId: string | null;
  rootOrderNo: string | null;
  customerCompanyId: string;
  title: string;
  status: DocumentGroupStatus;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  customerCompany?: Customer;
  references?: DocumentReference[];
};

export type DocumentSearchResult = {
  projects: Project[];
  documentGroups: DocumentGroup[];
  documentReferences: DocumentReference[];
};
