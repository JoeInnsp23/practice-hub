"use client";

import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    document: {
      id: string;
      name: string;
      mimeType: string | null;
      size: number | null;
      url: string | null;
    };
  } | null;
  onDownload: () => void;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  document,
  onDownload,
}: FilePreviewModalProps) {
  if (!document) return null;

  const { name, mimeType, size, url } = document.document;

  const isImage = mimeType?.startsWith("image/");
  const isPDF = mimeType === "application/pdf";
  const canPreview = isImage || isPDF;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            {mimeType || "Unknown type"} • {formatFileSize(size)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {canPreview ? (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
              {isImage && url && (
                <img
                  src={url}
                  alt={name}
                  className="max-w-full max-h-[600px] object-contain rounded-lg"
                />
              )}
              {isPDF && url && (
                <iframe
                  src={url}
                  title={name}
                  className="w-full h-[600px] rounded-lg border"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Preview not available</p>
              <p className="text-sm">
                This file type cannot be previewed. Click download to view the
                file.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
