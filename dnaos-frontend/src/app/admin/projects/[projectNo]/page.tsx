import { ProjectDetail } from "@/features/projects/project-detail";

type ProjectDetailPageProps = {
  params: Promise<{
    projectNo: string;
  }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectNo } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <ProjectDetail projectNo={projectNo} />
      </div>
    </main>
  );
}
