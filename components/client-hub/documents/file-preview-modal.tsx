"use client";

import { Download, X } from "lucide-react";
import Image from "next/image";
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
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">
          {mimeType || "Unknown type"} • {formatFileSize(size)}
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              {mimeType || "Unknown type"} • {formatFileSize(size)}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto px-8 md:px-10">
            {canPreview ? (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
                {isImage && url && (
                  <div className="relative w-full h-[600px]">
                    <Image
                      src={url}
                      alt={name}
                      fill
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
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
                <p className="text-lg font-medium mb-2">
                  Preview not available
                </p>
                <p className="text-sm">
                  This file type cannot be previewed. Click download to view the
                  file.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
