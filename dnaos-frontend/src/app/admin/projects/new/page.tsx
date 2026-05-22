import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/admin/projects"
        >
          Projects
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">New project</h1>
          <p className="text-sm text-muted-foreground">
            Create a project number and bind it to a customer site.
          </p>
        </div>
        <ProjectForm />
      </div>
    </main>
  );
}
