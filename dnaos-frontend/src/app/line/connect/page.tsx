import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connect LINE | DNA OS",
  description: "LINE account connection for DNA OS users.",
};

type LineConnectPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LineConnectPage({
  searchParams,
}: LineConnectPageProps) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center">
        <Card className="w-full">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              LINE-first access
            </Badge>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">Connect with LINE</CardTitle>
              <CardDescription>
                Normal users must enter DNA OS through a verified LINE account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>LINE integration is not configured yet</AlertTitle>
              <AlertDescription>
                This page is ready as the required entry point. Unknown LINE users will
                not be auto-created when the callback is implemented.
              </AlertDescription>
            </Alert>
            {next ? (
              <p className="text-sm text-muted-foreground">
                After verification, you will continue to{" "}
                <span className="font-mono text-foreground">{next}</span>.
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button type="button" disabled className="w-full">
              Continue with LINE
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
