"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAlerts,
  resolveAlert,
  type AlertItem,
  type AlertSeverity,
} from "./alert-api";

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  CRITICAL: "วิกฤต",
  WARNING: "เตือน",
  INFO: "ข้อมูล",
};

const SEVERITY_VARIANT: Record<AlertSeverity, "destructive" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  WARNING: "secondary",
  INFO: "outline",
};

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  if (severity === "CRITICAL") return <AlertTriangle className="size-4 text-destructive" />;
  if (severity === "WARNING") return <Bell className="size-4 text-yellow-600" />;
  return <Info className="size-4 text-muted-foreground" />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AlertCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(severity?: AlertSeverity) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAlerts({ severity, take: 100 });
      setAlerts(data.alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(filterSeverity === "ALL" ? undefined : filterSeverity);
  }, [filterSeverity]);

  async function handleResolve(alertId: string) {
    setResolvingId(alertId);
    try {
      await resolveAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "resolve ไม่สำเร็จ");
    } finally {
      setResolvingId(null);
    }
  }

  const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warning = alerts.filter((a) => a.severity === "WARNING").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Alert Center</h1>
        <p className="text-sm text-muted-foreground">การแจ้งเตือนที่ยังไม่ได้รับการแก้ไข</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {critical > 0 && (
            <Badge variant="destructive">{critical} วิกฤต</Badge>
          )}
          {warning > 0 && (
            <Badge variant="secondary">{warning} เตือน</Badge>
          )}
          {alerts.length === 0 && !isLoading && (
            <Badge variant="outline" className="text-green-700 border-green-700">ไม่มีการแจ้งเตือนที่รอแก้ไข</Badge>
          )}
        </div>
        <div className="ml-auto">
          <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as AlertSeverity | "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทั้งหมด</SelectItem>
              <SelectItem value="CRITICAL">วิกฤต</SelectItem>
              <SelectItem value="WARNING">เตือน</SelectItem>
              <SelectItem value="INFO">ข้อมูล</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>การแจ้งเตือนที่ยังค้างอยู่ ({isLoading ? "..." : alerts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="px-6 py-4 text-sm text-muted-foreground">กำลังโหลด...</div>
          )}
          {!isLoading && alerts.length === 0 && (
            <div className="px-6 py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle className="size-8 text-green-600" />
              <span>ไม่มีการแจ้งเตือนที่รอแก้ไข</span>
            </div>
          )}
          <div className="divide-y">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-6 py-4 ${!alert.isRead ? "bg-muted/30" : ""}`}
              >
                <div className="mt-0.5"><SeverityIcon severity={alert.severity} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={SEVERITY_VARIANT[alert.severity]} className="text-xs">
                      {SEVERITY_LABEL[alert.severity]}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{alert.alertType}</span>
                    {!alert.isRead && (
                      <span className="size-2 rounded-full bg-blue-500 inline-block" />
                    )}
                  </div>
                  <p className="mt-1 text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(alert.createdAt)}</p>
                  {alert.entityType && alert.entityId && (
                    <p className="text-xs text-muted-foreground">{alert.entityType} #{alert.entityId.slice(0, 8)}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolvingId === alert.id}
                  onClick={() => handleResolve(alert.id)}
                >
                  {resolvingId === alert.id ? "กำลัง..." : "Resolve"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
