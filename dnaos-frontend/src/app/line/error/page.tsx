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

type LineErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

const reasonMessages: Record<string, string> = {
  unknown_line_user:
    "This LINE account is not linked to a DNA OS user. Contact the system administrator to create an invitation link.",
  invalid_state: "LINE verification expired or could not be validated. Please try again.",
  line_not_configured: "LINE channel settings are not configured on the server yet.",
  invalid_token: "The LINE invitation link is invalid or expired.",
  line_already_linked: "This LINE account is already linked to another DNA OS user.",
  user_already_linked: "This DNA OS user already has a linked LINE account.",
  user_not_active: "This DNA OS user is not active.",
  no_active_membership: "This user does not have an active company membership.",
  line_callback_failed: "LINE verification could not be completed."
};

export default async function LineErrorPage({ searchParams }: LineErrorPageProps) {
  const { reason } = await searchParams;
  const message =
    reason && reasonMessages[reason]
      ? reasonMessages[reason]
      : "Contact the system administrator to link your LINE account before using this platform.";

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
                {message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
