import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { SuperadminLoginForm } from "@/features/auth/superadmin-login-form";

export const metadata: Metadata = {
  title: "Superadmin Sign In | DNA OS",
  description: "Hidden superadmin sign in for DNA OS Construction Platform.",
};

export default function SuperadminLoginPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="max-w-2xl space-y-6">
          <Badge variant="outline" className="w-fit">
            Superadmin
          </Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              DNA OS Platform Access
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Hidden recovery access for platform setup, tenant control, and emergency
              system administration.
            </p>
          </div>
          <div className="grid max-w-xl gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-md border bg-card p-3">Platform setup</div>
            <div className="rounded-md border bg-card p-3">Tenant control</div>
            <div className="rounded-md border bg-card p-3">Audit visibility</div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <SuperadminLoginForm />
        </div>
      </section>
    </main>
  );
}
