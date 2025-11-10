"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = "upload" | "preview" | "importing" | "summary";

interface PreviewResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; errors: string[] }>;
  previewRows: Array<{ row: number; data: Record<string, unknown> }>;
}

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; errors: string[] }>;
}

export function ClientImportModal({
  open,
  onOpenChange,
  onSuccess,
}: ClientImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );

  const previewMutation = trpc.clients.previewImport.useMutation({
    onSuccess: (data) => {
      setPreviewResult(data);
      setStep("preview");
    },
    onError: (error) => {
      toast.error(`Preview failed: ${error.message}`);
    },
  });

  const importMutation = trpc.clients.importClients.useMutation({
    onSuccess: (data) => {
      setImportSummary({
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors,
      });
      setStep("summary");
      toast.success(`Successfully imported ${data.imported} clients!`);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setStep("preview");
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setCsvFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!csvContent) {
      toast.error("Please upload a CSV file first");
      return;
    }

    setStep("importing");
    previewMutation.mutate({ csvContent });
  };

  const handleImport = () => {
    if (!csvContent) {
      toast.error("Please upload a CSV file first");
      return;
    }

    setStep("importing");
    importMutation.mutate({ csvContent });
  };

  const handleDownloadTemplate = () => {
    window.open("/api/templates/clients", "_blank");
  };

  const handleReset = () => {
    setStep("upload");
    setCsvFile(null);
    setCsvContent("");
    setPreviewResult(null);
    setImportSummary(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Import Clients from CSV</DialogTitle>
        <DialogDescription className="sr-only">
          Upload a CSV file to import multiple clients at once. Download the
          template for the correct format.
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Import Clients from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file to import multiple clients at once. Download the
              template for the correct format.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-8 md:px-10">
            {/* Download Template */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Need help? Download our CSV template with examples.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </AlertDescription>
            </Alert>

            {/* Upload Step */}
            {step === "upload" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload CSV File</p>
                    <p className="text-xs text-muted-foreground">
                      Select a CSV file with client data
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="mt-4"
                  />
                  {csvFile && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === "preview" && previewResult && (
              <div className="space-y-4">
                {/* Preview Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {previewResult.totalRows}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Valid
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {previewResult.validRows}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        {previewResult.errorRows}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Validation Errors */}
                {previewResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Validation Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {previewResult.errors.slice(0, 10).map((error) => (
                          <li key={`error-${error.row}`}>
                            Row {error.row}: {error.errors.join(", ")}
                          </li>
                        ))}
                        {previewResult.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ...and {previewResult.errors.length - 10} more
                            errors
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview Rows */}
                {previewResult.previewRows.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Preview (First 5 Rows)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Company Name</th>
                              <th className="text-left p-2">Email</th>
                              <th className="text-left p-2">Client Type</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewResult.previewRows.map((row) => (
                              <tr
                                key={`${row.data.email}-${row.data.company_name}`}
                                className="border-b"
                              >
                                <td className="p-2">
                                  {row.data.company_name as string}
                                </td>
                                <td className="p-2">
                                  {row.data.email as string}
                                </td>
                                <td className="p-2">
                                  {row.data.client_type as string}
                                </td>
                                <td className="p-2">
                                  <Badge variant="outline">
                                    {row.data.status as string}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Importing Step */}
            {step === "importing" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Processing import...
                </p>
              </div>
            )}

            {/* Summary Step */}
            {step === "summary" && importSummary && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-medium">Import Complete!</p>
                    <p className="text-sm mt-1">
                      Successfully imported {importSummary.imported} clients
                      {importSummary.skipped > 0 &&
                        `, skipped ${importSummary.skipped} duplicates`}
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Imported
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {importSummary.imported}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Skipped</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {importSummary.skipped}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        {importSummary.errors.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Error Details */}
                {importSummary.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Import Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {importSummary.errors.map((error) => (
                          <li key={`import-error-${error.row}`}>
                            Row {error.row}: {error.errors.join(", ")}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            {step === "upload" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  Cancel
                </Button>
                <Button onClick={handlePreview} disabled={!csvFile}>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Import
                </Button>
              </>
            )}

            {step === "preview" && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Upload Different File
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!previewResult || previewResult.validRows === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import {previewResult?.validRows || 0} Clients
                </Button>
              </>
            )}

            {step === "summary" && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Import More Clients
                </Button>
                <Button onClick={handleClose}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
