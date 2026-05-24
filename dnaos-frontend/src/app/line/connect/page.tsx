import type { Metadata } from "next";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    token?: string;
    channel?: string;
  }>;
};

export default async function LineConnectPage({
  searchParams,
}: LineConnectPageProps) {
  const { next, token, channel } = await searchParams;
  const lineStartUrl = buildLineStartUrl({ next, token, channel });

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
              <ShieldCheck aria-hidden="true" />
              <AlertTitle>LINE-only authentication</AlertTitle>
              <AlertDescription>
                Your LINE profile is checked against an existing DNA OS user before
                access is granted.
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
            <a href={lineStartUrl} className={cn(buttonVariants(), "w-full")}>
              Continue with LINE
              <ArrowRight aria-hidden="true" />
            </a>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

const CHANNEL_START: Record<string, string> = {
  fleet:    "/api/backend/auth/line-fleet/start",
  supplier: "/api/backend/auth/line-supplier/start",
};

function buildLineStartUrl(input: { next?: string; token?: string; channel?: string }) {
  const startPath = CHANNEL_START[input.channel ?? ""] ?? "/api/backend/auth/line/start";
  const url = new URL(startPath, "http://x");
  if (input.next) url.searchParams.set("next", input.next);
  if (input.token) url.searchParams.set("token", input.token);
  return url.pathname + url.search;
}
