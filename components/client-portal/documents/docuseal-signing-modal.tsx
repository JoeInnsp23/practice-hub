"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
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
  DialogTitle,
} from "@/components/ui/dialog";

interface DocuSealSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    description?: string | null;
    signingUrl?: string | null;
  } | null;
  clientId: string;
}

export function DocuSealSigningModal({
  isOpen,
  onClose,
  document,
  clientId,
}: DocuSealSigningModalProps) {
  const utils = trpc.useUtils();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && document?.signingUrl) {
      setIsLoading(true);

      // Listen for DocuSeal completion messages
      const handleMessage = (event: MessageEvent) => {
        // Verify message is from DocuSeal
        if (event.data?.type === "docuseal:completed") {
          toast.success("Document signed successfully!");

          // Refresh document lists
          utils.clientPortal.getDocumentsToSign.invalidate({ clientId });
          utils.clientPortal.getSignedDocuments.invalidate({ clientId });

          // Close modal after a brief delay
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      };

      window.addEventListener("message", handleMessage);

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [isOpen, document, clientId, onClose, utils]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">{document.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {document.description ||
            "Sign the document using the DocuSeal interface below"}
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg h-full overflow-hidden flex flex-col">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.name}
            </CardTitle>
            {document.description && (
              <CardDescription>{document.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="flex-1 relative px-8 md:px-10 pb-8 md:pb-10">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading signing interface...
                  </p>
                </div>
              </div>
            )}

            {document.signingUrl ? (
              <iframe
                src={document.signingUrl}
                className="w-full h-full border-0 rounded-lg"
                onLoad={handleIframeLoad}
                title="Document Signing Interface"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Signing link not available for this document
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
