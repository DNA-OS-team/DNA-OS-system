import { AdminDashboard } from "@/features/dashboard/admin-dashboard";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <AdminDashboard />
      </div>
    </main>
  );
}
