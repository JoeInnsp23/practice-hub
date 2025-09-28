"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: string;
  templateEndpoint?: string;
  entityName: string;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  dryRun: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  skipped?: Array<{
    row: number;
    reason: string;
  }>;
}

export function DataImportModal({
  isOpen,
  onClose,
  endpoint,
  templateEndpoint,
  entityName,
  onSuccess,
}: DataImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsImporting(true);
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", String(isDryRun));

      setProgress(40);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
      setProgress(100);

      if (data.success && !isDryRun) {
        toast.success(
          `Successfully imported ${data.summary.successful} ${entityName}`
        );
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import data");
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!templateEndpoint) return;

    try {
      const response = await fetch(templateEndpoint);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityName}_import_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsDryRun(true);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityName}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple {entityName.toLowerCase()} at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          {templateEndpoint && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Download Template</p>
                  <p className="text-xs text-muted-foreground">
                    Use our template for proper formatting
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Dry Run Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dryRun"
              checked={isDryRun}
              onCheckedChange={(checked) => setIsDryRun(checked as boolean)}
              disabled={isImporting}
            />
            <Label
              htmlFor="dryRun"
              className="text-sm font-normal cursor-pointer"
            >
              Dry run (validate without importing)
            </Label>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {isDryRun ? "Validating..." : "Importing..."}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <Alert
                className={
                  result.success
                    ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                    : "border-destructive"
                }
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {result.dryRun ? "Validation" : "Import"} Complete
                    </p>
                    <div className="text-sm space-y-0.5">
                      <p>Total rows: {result.summary.total}</p>
                      <p className="text-green-600 dark:text-green-400">
                        ✓ Valid: {result.summary.successful}
                      </p>
                      {result.summary.failed > 0 && (
                        <p className="text-destructive">
                          ✗ Failed: {result.summary.failed}
                        </p>
                      )}
                      {result.summary.skipped > 0 && (
                        <p className="text-orange-600 dark:text-orange-400">
                          ⚠ Skipped: {result.summary.skipped}
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 bg-destructive/10 rounded flex items-start gap-2"
                      >
                        <XCircle className="h-3 w-3 text-destructive mt-0.5" />
                        <div>
                          <span className="font-medium">Row {error.row}:</span>{" "}
                          {error.message} ({error.field})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {result.skipped && result.skipped.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Skipped:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.skipped.map((skip, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 bg-orange-100 dark:bg-orange-900/20 rounded"
                      >
                        Row {skip.row}: {skip.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success message for dry run */}
              {result.success && result.dryRun && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Validation successful! Uncheck "Dry run" and click Import to
                    proceed with actual import.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            {isDryRun ? "Validate" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}