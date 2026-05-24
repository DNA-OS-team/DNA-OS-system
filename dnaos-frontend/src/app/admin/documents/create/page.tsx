import { DocumentCreateWorkbench } from "@/features/documents/document-create-workbench";

export default function DocumentCreatePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <DocumentCreateWorkbench />
      </div>
    </main>
  );
}
