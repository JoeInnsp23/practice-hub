import Papa from "papaparse";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";
import type { TaskSummary } from "@/components/client-hub/tasks/types";

export interface TaskExportColumn {
  key: keyof TaskSummary | string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_TASK_EXPORT_COLUMNS: TaskExportColumn[] = [
  { key: "title", label: "Title", enabled: true },
  { key: "description", label: "Description", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "priority", label: "Priority", enabled: true },
  { key: "clientName", label: "Client", enabled: true },
  { key: "assigneeName", label: "Assignee", enabled: true },
  { key: "reviewerName", label: "Reviewer", enabled: false },
  { key: "dueDate", label: "Due Date", enabled: true },
  { key: "targetDate", label: "Target Date", enabled: false },
  { key: "completedAt", label: "Completed At", enabled: false },
  { key: "estimatedHours", label: "Estimated Hours", enabled: false },
  { key: "actualHours", label: "Actual Hours", enabled: false },
  { key: "progress", label: "Progress (%)", enabled: true },
  { key: "category", label: "Category", enabled: false },
  { key: "tags", label: "Tags", enabled: false },
];

/**
 * Format a task value for export
 */
function formatTaskValue(task: TaskSummary, key: string): string {
  const value = task[key as keyof TaskSummary];

  if (value === null || value === undefined) {
    return "";
  }

  // Handle dates
  if (key.includes("Date") || key.includes("At")) {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "string") {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
  }

  // Handle arrays (tags)
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Export tasks to CSV format
 */
export function exportTasksToCSV(
  tasks: TaskSummary[],
  columns: TaskExportColumn[],
): string {
  const enabledColumns = columns.filter((col) => col.enabled);

  // Prepare data rows
  const data = tasks.map((task) => {
    const row: Record<string, string> = {};
    for (const column of enabledColumns) {
      row[column.label] = formatTaskValue(task, column.key);
    }
    return row;
  });

  // Convert to CSV using papaparse
  const csv = Papa.unparse(data);
  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export tasks to XLSX format
 */
export function exportTasksToXLSX(
  tasks: TaskSummary[],
  columns: TaskExportColumn[],
): ArrayBuffer {
  const enabledColumns = columns.filter((col) => col.enabled);

  // Prepare data rows
  const data = tasks.map((task) => {
    const row: Record<string, string> = {};
    for (const column of enabledColumns) {
      row[column.label] = formatTaskValue(task, column.key);
    }
    return row;
  });

  // Create worksheet
  const worksheet = XLSXUtils.json_to_sheet(data);

  // Auto-size columns
  const columnWidths = enabledColumns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(workbook, worksheet, "Tasks");

  // Generate buffer
  const buffer = XLSXWrite(workbook, { type: "array", bookType: "xlsx" });
  return buffer as ArrayBuffer;
}

/**
 * Download XLSX file
 */
export function downloadXLSX(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xlsx`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Main export function with format selection
 */
export function exportTasks(
  tasks: TaskSummary[],
  columns: TaskExportColumn[],
  format: "csv" | "xlsx",
  filename: string = "tasks",
): void {
  if (format === "csv") {
    const csv = exportTasksToCSV(tasks, columns);
    downloadCSV(csv, filename);
  } else {
    const buffer = exportTasksToXLSX(tasks, columns);
    downloadXLSX(buffer, filename);
  }
}
