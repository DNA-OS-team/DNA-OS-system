"use client";

import { zodResolver } from "@/lib/zod-resolver";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProject,
  listProjectCustomerOptions,
  updateProject,
} from "./project-api";
import { projectFormSchema, type ProjectFormValues } from "./schemas";
import type { CustomerOption, Project, ProjectStatus } from "./types";

const projectStatuses: ProjectStatus[] = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

type ProjectFormProps = {
  project?: Project;
};

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customerCompanyId: project?.customerCompanyId ?? "",
      customerSiteId: project?.customerSiteId ?? "",
      title: project?.title ?? "",
      status: project?.status ?? "ACTIVE",
    },
  });
  const customerCompanyId = useWatch({
    control: form.control,
    name: "customerCompanyId",
  });
  const customerSiteId = useWatch({
    control: form.control,
    name: "customerSiteId",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerCompanyId),
    [customerCompanyId, customers]
  );

  useEffect(() => {
    let isMounted = true;

    listProjectCustomerOptions()
      .then((result) => {
        if (isMounted) {
          setCustomers(result.customers);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setFormError(
            error instanceof Error ? error.message : "ไม่สามารถโหลดลูกค้าได้"
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(values: ProjectFormValues) {
    setFormError(null);

    try {
      const result = project
        ? await updateProject(project.projectNo, values)
        : await createProject(values);

      router.push(`/admin/projects/${result.project.projectNo}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ไม่สามารถบันทึกโปรเจกต์ได้");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>ดำเนินการโปรเจกต์ไม่สำเร็จ</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{project ? "รายละเอียดโปรเจกต์" : "โปรเจกต์ใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field message={form.formState.errors.title?.message}>
            <Label htmlFor="title">ชื่อโปรเจกต์</Label>
            <Input id="title" {...form.register("title")} />
          </Field>

          <Field message={form.formState.errors.status?.message}>
            <Label htmlFor="status">สถานะ</Label>
            <Select
              value={status}
              onValueChange={(value) => form.setValue("status", value as ProjectStatus)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field message={form.formState.errors.customerCompanyId?.message}>
            <Label htmlFor="customerCompanyId">ลูกค้า</Label>
            <Select
              value={customerCompanyId}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }

                form.setValue("customerCompanyId", value);
                form.setValue("customerSiteId", "");
              }}
            >
              <SelectTrigger id="customerCompanyId" className="w-full">
                <SelectValue placeholder="เลือกลูกค้า" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field message={form.formState.errors.customerSiteId?.message}>
            <Label htmlFor="customerSiteId">สถานที่</Label>
            <Select
              value={customerSiteId}
              onValueChange={(value) => {
                if (value) {
                  form.setValue("customerSiteId", value);
                }
              }}
              disabled={!selectedCustomer}
            >
              <SelectTrigger id="customerSiteId" className="w-full">
                <SelectValue placeholder="เลือกสถานที่" />
              </SelectTrigger>
              <SelectContent>
                {(selectedCustomer?.customerSites ?? []).map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.siteName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึกโปรเจกต์"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function Field({
  children,
  className,
  message,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
