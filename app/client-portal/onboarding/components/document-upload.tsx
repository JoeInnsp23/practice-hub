"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

interface OnboardingDocumentUploadProps {
  sessionId: string;
  onDocumentsUploaded: (extractedData: Record<string, any>) => void;
}

interface UploadedFile {
  filename: string;
  url: string;
  documentType: string;
  confidence: "high" | "medium" | "low";
  error?: string;
}

export function OnboardingDocumentUpload({
  sessionId,
  onDocumentsUploaded,
}: OnboardingDocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Validate file types
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic"];
    const validFiles = newFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("onboardingSessionId", sessionId);
      formData.append("tenantId", "placeholder"); // Will be extracted from session

      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Upload to API
      const response = await fetch("/api/onboarding/upload-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      setUploadedFiles(result.uploadedFiles);
      setFiles([]);

      // Notify parent with extracted data
      onDocumentsUploaded(result.extractedData);

      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>
            Uploaded {result.uploadedFiles.length} documents and extracted{" "}
            {Object.keys(result.extractedData).length} fields!
          </span>
        </div>
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? "border-primary bg-primary/5" : "border-border"}
          ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic"
          onChange={handleFileInput}
          disabled={uploading}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>

            <div>
              <p className="text-lg font-medium mb-1">
                Drag and drop your documents here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Accepted: PDF, JPG, PNG, HEIC (max 10MB each)</p>
              <p className="font-medium">
                Upload: Passport, Driving License, Proof of Address, Company Docs
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ready to Upload ({files.length})
          </h3>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted/50 rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Uploading & Extracting Data...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} Document{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Uploaded Successfully ({uploadedFiles.length})
          </h3>

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {file.documentType !== "unknown" && (
                        <span className="text-xs text-muted-foreground">
                          {file.documentType === "individual_id" && "ID Document"}
                          {file.documentType === "company_certificate" && "Company Doc"}
                          {file.documentType === "address_proof" && "Proof of Address"}
                        </span>
                      )}
                      {file.confidence === "high" && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Sparkles className="h-3 w-3" />
                          High Confidence
                        </span>
                      )}
                      {file.confidence === "medium" && (
                        <span className="text-xs text-yellow-600">Medium Confidence</span>
                      )}
                      {file.confidence === "low" && (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          Low Confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
            <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                We've automatically extracted information from your documents.
                Please review and verify the pre-filled fields in the next steps.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
