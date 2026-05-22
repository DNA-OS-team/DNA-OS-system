import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "LINE Access Denied | DNA OS",
  description: "LINE access denied for DNA OS.",
};

export default function LineErrorPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Access denied</CardTitle>
            <CardDescription>LINE account is not linked to DNA OS.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>LINE account not authorized</AlertTitle>
              <AlertDescription>
                Contact the system administrator to link your LINE account before using
                this platform.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
