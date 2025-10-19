"use client";

import { Download, FileSpreadsheet, Settings } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { TaskSummary } from "./tasks/types";
import {
  DEFAULT_TASK_EXPORT_COLUMNS,
  exportTasks,
  type TaskExportColumn,
} from "@/lib/export/task-export";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataExportButtonProps {
  data: TaskSummary[];
  filename?: string;
  className?: string;
}

export function DataExportButton({
  data,
  filename = "tasks",
  className,
}: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isColumnSelectOpen, setIsColumnSelectOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "xlsx">("csv");
  const [columns, setColumns] = useState<TaskExportColumn[]>(
    DEFAULT_TASK_EXPORT_COLUMNS,
  );

  const handleExport = (format: "csv" | "xlsx") => {
    // Open column selection dialog
    setSelectedFormat(format);
    setIsColumnSelectOpen(true);
  };

  const handleConfirmExport = () => {
    try {
      setIsExporting(true);

      const enabledColumns = columns.filter((col) => col.enabled);
      if (enabledColumns.length === 0) {
        toast.error("Please select at least one column to export");
        return;
      }

      exportTasks(data, columns, selectedFormat, filename);
      toast.success(
        `Exported ${data.length} tasks as ${selectedFormat.toUpperCase()}`,
      );
      setIsColumnSelectOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumn = (index: number) => {
    setColumns((prev) =>
      prev.map((col, i) =>
        i === index ? { ...col, enabled: !col.enabled } : col,
      ),
    );
  };

  const selectAllColumns = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, enabled: true })));
  };

  const deselectAllColumns = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, enabled: false })));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isExporting || data.length === 0}
            className={className}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("xlsx")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selection Dialog */}
      <Dialog open={isColumnSelectOpen} onOpenChange={setIsColumnSelectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Columns to Export</DialogTitle>
            <DialogDescription>
              Choose which columns to include in your {selectedFormat.toUpperCase()}{" "}
              export ({data.length} tasks)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllColumns}
                className="flex-1"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deselectAllColumns}
                className="flex-1"
              >
                Deselect All
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`column-${index}`}
                      checked={column.enabled}
                      onCheckedChange={() => toggleColumn(index)}
                    />
                    <Label
                      htmlFor={`column-${index}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Settings className="h-3 w-3" />
              {columns.filter((col) => col.enabled).length} of {columns.length}{" "}
              columns selected
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsColumnSelectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={
                isExporting || columns.filter((col) => col.enabled).length === 0
              }
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
