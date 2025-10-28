"use client";

/**
 * Import History Content Component
 *
 * Displays import logs with filtering, summary stats, and detailed error views
 */

import { format } from "date-fns";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ListTodo,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataToCSV } from "@/lib/services/csv-import";
import { trpc } from "@/lib/trpc/client";

type EntityType = "clients" | "tasks" | "services";
type ImportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partial";

export function ImportHistoryContent() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "all">("all");

  // Fetch import logs with filters
  const { data: importLogs, isLoading } = trpc.importLogs.list.useQuery(
    {
      entityType: entityTypeFilter === "all" ? undefined : entityTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    {
      refetchInterval: 5000, // Refetch every 5 seconds for pending/processing imports
    },
  );

  // Fetch summary statistics
  const { data: summary } = trpc.importLogs.getSummary.useQuery();

  if (isLoading) {
    return <div>Loading import history...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {summary && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Import Statistics</CardTitle>
            <CardDescription>Overview of all CSV imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Imports"
                value={summary.totalImports}
                icon={FileSpreadsheet}
                description={`${summary.successfulImports} successful`}
              />
              <StatCard
                title="Rows Processed"
                value={summary.totalRowsProcessed.toLocaleString()}
                icon={CheckCircle2}
                description={`${summary.totalRowsFailed.toLocaleString()} failed`}
                variant="success"
              />
              <StatCard
                title="By Entity Type"
                value=""
                icon={FileText}
                description={`Clients: ${summary.byEntityType.clients} | Tasks: ${summary.byEntityType.tasks} | Services: ${summary.byEntityType.services}`}
                variant="info"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Import List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Import Logs</CardTitle>
              <CardDescription>
                Filter and view detailed import results
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={entityTypeFilter}
                onValueChange={(value) =>
                  setEntityTypeFilter(value as EntityType | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as ImportStatus | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="glass-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importLogs && importLogs.length > 0 ? (
                  importLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.fileName}
                      </TableCell>
                      <TableCell>
                        <EntityTypeBadge type={log.entityType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{log.totalRows}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {log.processedRows}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {log.failedRows}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.startedAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ImportLogDetailsDialog log={log as ImportLog} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No import logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Summary stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "info";
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: StatCardProps) {
  const iconColors = {
    default: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className={`p-2 rounded-lg bg-muted ${iconColors[variant]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        {value && <p className="text-2xl font-bold">{value}</p>}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

// Entity type badge
function EntityTypeBadge({ type }: { type: EntityType }) {
  const config = {
    clients: {
      icon: Users,
      label: "Clients",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    tasks: {
      icon: ListTodo,
      label: "Tasks",
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
    services: {
      icon: Briefcase,
      label: "Services",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
  };

  const { icon: Icon, label, color } = config[type];

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

// Status badge
function StatusBadge({ status }: { status: ImportStatus }) {
  const config = {
    completed: {
      icon: CheckCircle2,
      label: "Completed",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    partial: {
      icon: AlertCircle,
      label: "Partial",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    pending: {
      icon: AlertCircle,
      label: "Pending",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    },
    processing: {
      icon: AlertCircle,
      label: "Processing",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
  };

  const { icon: Icon, label, color } = config[status];

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

// Import log details dialog
interface ImportLogError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportLog {
  id: string;
  fileName: string;
  entityType: EntityType;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  skippedRows: number;
  dryRun: boolean;
  startedAt: Date | string;
  completedAt: Date | string | null;
  errors?: ImportLogError[];
}

function ImportLogDetailsDialog({ log }: { log: ImportLog }) {
  const handleDownloadErrors = () => {
    if (!log.errors || log.errors.length === 0) return;

    const csv = dataToCSV(log.errors as any, [
      "row",
      "field",
      "message",
      "value",
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${log.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Details: {log.fileName}</DialogTitle>
          <DialogDescription>
            Imported on{" "}
            {format(new Date(log.startedAt), "MMMM d, yyyy 'at' HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Entity Type" value={log.entityType} />
              <InfoItem
                label="Status"
                value={<StatusBadge status={log.status} />}
              />
              <InfoItem label="Total Rows" value={log.totalRows} />
              <InfoItem
                label="Processed"
                value={log.processedRows}
                className="text-green-600"
              />
              <InfoItem
                label="Failed"
                value={log.failedRows}
                className="text-red-600"
              />
              <InfoItem
                label="Skipped"
                value={log.skippedRows}
                className="text-yellow-600"
              />
              <InfoItem label="Dry Run" value={log.dryRun ? "Yes" : "No"} />
              <InfoItem
                label="Duration"
                value={
                  log.completedAt
                    ? `${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                    : "N/A"
                }
              />
            </div>
          </div>

          {/* Errors */}
          {log.errors && log.errors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Errors ({log.errors.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrors}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Errors CSV
                </Button>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.errors.map((error) => (
                      <TableRow key={`error-${error.row}-${error.field}`}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {error.field}
                        </TableCell>
                        <TableCell className="text-red-600 dark:text-red-400">
                          {error.message}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {error.value || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Success message if no errors */}
          {(!log.errors || log.errors.length === 0) &&
            log.status === "completed" && (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  All rows imported successfully with no errors!
                </p>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Info item helper
interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoItem({ label, value, className }: InfoItemProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-semibold ${className || ""}`}>{value}</p>
    </div>
  );
}
