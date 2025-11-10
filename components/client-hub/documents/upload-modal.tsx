"use client";

import { CheckCircle, File, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    files: FileList,
    metadata: {
      client: string;
      tags: string[];
      parentId: string | null;
    },
  ) => Promise<void>;
  currentFolderId: string | null;
}

export function UploadModal({
  isOpen,
  onClose,
  onUpload,
  currentFolderId,
}: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [client, setClient] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const fileList = new DataTransfer();
      files.forEach((file) => {
        fileList.items.add(file);
      });

      await onUpload(fileList.files, {
        client,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        parentId: currentFolderId,
      });

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        toast.success(`Successfully uploaded ${files.length} file(s)`);
        setFiles([]);
        setClient("");
        setTags("");
        setIsUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);
    } catch {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Failed to upload files");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Upload Documents</DialogTitle>
        <DialogDescription className="sr-only">
          Drag and drop files or click to select files to upload
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Drag and drop files or click to select files to upload
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-8 md:px-10">
            {/* Drop Zone */}
            <button
              type="button"
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors w-full",
                isDragging
                  ? "border-blue-500 bg-primary/5 dark:bg-primary/10"
                  : "border-gray-300 dark:border-gray-600",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  document.getElementById("file-upload")?.click();
                }
              }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your files here, or
              </p>
              <label htmlFor="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  data-testid="document-upload-input"
                />
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </button>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {isUploading && uploadProgress === 100 && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client (Optional)</Label>
                <Select
                  value={client}
                  onValueChange={setClient}
                  disabled={isUploading}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abc-company">ABC Company Ltd</SelectItem>
                    <SelectItem value="xyz-ltd">XYZ Ltd</SelectItem>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="tech-innovations">
                      Tech Innovations Ltd
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., tax, invoice, contract"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading {files.length} file(s)...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading
                ? "Uploading..."
                : `Upload ${files.length || ""} File${files.length !== 1 ? "s" : ""}`}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
