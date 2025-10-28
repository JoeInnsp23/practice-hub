"use client";

import { CheckCircle2, Download, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

interface SignedDocumentsListProps {
  clientId: string;
}

export function SignedDocumentsList({ clientId }: SignedDocumentsListProps) {
  const utils = trpc.useUtils();

  // Fetch signed documents
  const { data: documents, isLoading } =
    trpc.clientPortal.getSignedDocuments.useQuery(
      { clientId },
      { enabled: !!clientId },
    );

  const handleDownload = async (documentId: string, _name: string) => {
    try {
      const result = await utils.clientPortal.getSignedDocumentPdf.fetch({
        documentId,
      });
      if (result.url) {
        window.open(result.url, "_blank");
        toast.success("Download started");
      } else {
        toast.error("Signed document not available");
      }
    } catch (_error) {
      toast.error("Failed to download document");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground mt-4">
          Loading signed documents...
        </p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Signed Documents</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          You have no signed documents yet. Once you sign a document, it will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-card-foreground">
                  {doc.name}
                </h3>
                <Badge variant="default" className="text-xs">
                  ✓ Signed
                </Badge>
              </div>

              {doc.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {doc.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Signed by: {doc.signedBy || "You"}</span>
                <span>•</span>
                <span>
                  Signed: {doc.signedAt ? formatDate(doc.signedAt) : "Unknown"}
                </span>
                {doc.size && (
                  <>
                    <span>•</span>
                    <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                )}
              </div>

              {doc.uploadedBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded by:{" "}
                  {`${doc.uploadedBy.firstName || ""} ${doc.uploadedBy.lastName || ""}`.trim() ||
                    doc.uploadedBy.email}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => handleDownload(doc.id, doc.name)}
            className="ml-4"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
