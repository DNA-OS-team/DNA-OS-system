"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSuperadmin } from "./auth-api";
import {
  superadminLoginSchema,
  type SuperadminLoginValues,
} from "./schemas";

export function SuperadminLoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SuperadminLoginValues>({
    resolver: zodResolver(superadminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: SuperadminLoginValues) {
    setFormError(null);

    try {
      const result = await loginSuperadmin(values);
      window.localStorage.setItem(
        "dnaos_superadmin",
        JSON.stringify(result.superadmin)
      );
      router.push("/admin/customers");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in");
    }
  }

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-md border bg-background">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">Superadmin sign in</CardTitle>
          <CardDescription>DNA OS break-glass access</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Sign in unavailable</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldError message={form.formState.errors.username?.message}>
            <Label htmlFor="superadmin-username">Username</Label>
            <Input
              id="superadmin-username"
              type="text"
              autoComplete="username"
              placeholder="dnaos"
              {...form.register("username")}
            />
          </FieldError>

          <FieldError message={form.formState.errors.password?.message}>
            <Label htmlFor="superadmin-password">Password</Label>
            <div className="relative">
              <Input
                id="superadmin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-11"
                {...form.register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </FieldError>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            <LockKeyhole aria-hidden="true" />
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Hidden platform recovery access only
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function FieldError({
  children,
  message,
}: {
  children: ReactNode;
  message?: string;
}) {
  return (
    <div className="space-y-2">
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
