import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface LogsExportSectionProps {
  className?: string;
}

export default function LogsExportSection({ className }: LogsExportSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      // Call the API to export logs in CSV format
      const response = await fetch("/api/admin/logs/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format: "csv" }),
      });

      if (!response.ok) {
        throw new Error(`Failed to export logs: ${response.statusText}`);
      }

      // Get the CSV content and download it
      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Logs exported successfully");
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Failed to export logs. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeLogs = async () => {
    toast.warning(
      "Are you sure you want to purge all logs older than 90 days? This action cannot be undone.",
      {
        action: {
          label: "Purge",
          onClick: async () => {
            setIsPurging(true);
            try {
              // Call the API to purge old logs
              const response = await fetch("/api/admin/logs/manage", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "purgeOldLogs" }),
              });

              if (!response.ok) {
                throw new Error(`Failed to purge logs: ${response.statusText}`);
              }

              const result = await response.json();
              toast.success(result.message || "Logs purged successfully");
            } catch (error) {
              console.error("Error purging logs:", error);
              toast.error("Failed to purge logs. Please try again.");
            } finally {
              setIsPurging(false);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {
            setIsPurging(false);
          },
        },
        duration: 10000, // Give user 10 seconds to decide
      }
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Log Management</h3>
      </div>

      <p className="text-sm">Export logs for archival or analysis, and manage log retention.</p>

      <Separator />

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">Export Logs</h4>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 max-w-xs"
              onClick={handleExportLogs}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export Logs as CSV
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Exports all logs in CSV format.</p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-3">Log Retention</h4>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Warning: This action cannot be undone
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Purging logs will permanently delete all log entries older than 90 days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={handlePurgeLogs}
              disabled={isPurging}
            >
              {isPurging ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Purging...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Purge Old Logs
                </>
              )}
            </Button>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar size={14} />
              <span>Older than 90 days</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
