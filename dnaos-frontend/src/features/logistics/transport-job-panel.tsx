"use client";

import { Plus, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrderTransportJobs } from "./transport-job-api";
import { TransportJobForm } from "./transport-job-form";
import type { TransportJob } from "./types";
import { TransportStatusBadge } from "@/components/shared/status-badge";

type Props = { orderId: string };

export function TransportJobPanel({ orderId }: Props) {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const result = await getOrderTransportJobs(orderId);
      setJobs(result.jobs);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-4" />
          งานขนส่ง
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus />
          สร้างงานขนส่ง
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>สร้างงานขนส่ง</DialogTitle>
            </DialogHeader>
            <TransportJobForm
              orderId={orderId}
              onSuccess={() => {
                setDialogOpen(false);
                load();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หมายเลขงาน</TableHead>
              <TableHead>Fleet</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  ยังไม่มีงานขนส่ง
                </TableCell>
              </TableRow>
            ) : null}
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">{job.jobNo}</TableCell>
                <TableCell>{job.fleetCompany?.name ?? "-"}</TableCell>
                <TableCell>
                  <TransportStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/logistics/${job.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    เปิด
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
