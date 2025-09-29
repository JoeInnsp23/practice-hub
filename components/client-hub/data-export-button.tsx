/*
 * DataExportButton Component
 * TEMPORARILY DISABLED - Export functionality is currently not available
 * This component will be re-enabled once backend export endpoints are implemented
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

interface DataExportButtonProps {
  endpoint: string;
  filename: string;
  filters?: Record<string, any>;
  className?: string;
}

export function DataExportButton({
  endpoint,
  filename,
  filters = {},
  className,
}: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);

      // Build query params
      const params = new URLSearchParams({ format });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "all") {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${endpoint}?${params}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className={className}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
