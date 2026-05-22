import { DocumentSearch } from "@/features/projects/document-search";

export default function DocumentSearchPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DocumentSearch />
      </div>
    </main>
  );
}
