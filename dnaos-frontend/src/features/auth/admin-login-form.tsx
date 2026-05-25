"use client";

import { zodResolver } from "@/lib/zod-resolver";
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
import { loginAdmin } from "./auth-api";
import { adminLoginSchema, type AdminLoginValues } from "./schemas";

export function AdminLoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginValues) {
    setFormError(null);

    try {
      const result = await loginAdmin(values);
      window.localStorage.setItem("dnaos_admin", JSON.stringify(result.admin));
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้");
    }
  }

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-md border bg-background">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">เข้าสู่ระบบ Admin</CardTitle>
          <CardDescription>เข้าถึงได้ด้วยชื่อผู้ใช้และรหัสผ่านสำหรับ ADMIN เท่านั้น</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>ไม่สามารถเข้าสู่ระบบได้</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldError message={form.formState.errors.username?.message}>
            <Label htmlFor="admin-username">ชื่อผู้ใช้</Label>
            <Input
              id="admin-username"
              type="text"
              autoComplete="username"
              placeholder="dnaos"
              {...form.register("username")}
            />
          </FieldError>

          <FieldError message={form.formState.errors.password?.message}>
            <Label htmlFor="admin-password">รหัสผ่าน</Label>
            <div className="relative">
              <Input
                id="admin-password"
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
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
            {form.formState.isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            บทบาทลูกค้า พาร์ทเนอร์ รถร่วม คนขับ และผู้ชมใช้ LINE เท่านั้น
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
