import { DocumentGroupDetail } from "@/features/projects/document-group-detail";

type DocumentGroupDetailPageProps = {
  params: Promise<{
    groupNo: string;
  }>;
};

export default async function DocumentGroupDetailPage({
  params,
}: DocumentGroupDetailPageProps) {
  const { groupNo } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DocumentGroupDetail groupNo={groupNo} />
      </div>
    </main>
  );
}
