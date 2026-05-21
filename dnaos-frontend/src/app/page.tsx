import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Construction Commerce Operating System
        </p>
        <div>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            DNA OS Construction Platform
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Foundation ready for the customer storefront, partner portal, fleet portal,
            and admin backoffice.
          </p>
        </div>

        <Card className="w-full max-w-md text-left">
          <CardHeader>
            <CardTitle>UI foundation ready</CardTitle>
            <CardDescription>
              Tailwind CSS and shadcn/ui components are configured for the app shell.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              This demo card uses project theme tokens from globals.css and source-owned
              shadcn/ui components.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="button">Primary action</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
