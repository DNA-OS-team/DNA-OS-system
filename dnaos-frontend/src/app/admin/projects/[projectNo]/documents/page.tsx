import { ProjectDocuments } from "@/features/projects/project-documents";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectNo: string;
  }>;
};

export default async function ProjectDocumentsPage({
  params,
}: ProjectDocumentsPageProps) {
  const { projectNo } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <ProjectDocuments projectNo={projectNo} />
      </div>
    </main>
  );
}
