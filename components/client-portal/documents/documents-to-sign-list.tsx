"use client";

import { FileSignature, FileText, Inbox } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { DocuSealSigningModal } from "./docuseal-signing-modal";

interface Document {
  id: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  size?: number;
  uploadedBy?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface DocumentsToSignListProps {
  clientId: string;
}

export function DocumentsToSignList({ clientId }: DocumentsToSignListProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);

  // Fetch documents requiring signature
  const { data: documents, isLoading } =
    trpc.clientPortal.getDocumentsToSign.useQuery(
      { clientId },
      { enabled: !!clientId },
    );

  const handleSignClick = (doc: Document) => {
    setSelectedDocument(doc);
    setIsSigningModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground mt-4">Loading documents...</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Documents to Sign</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          You have no pending documents requiring your signature at this time.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground mb-1">
                  {doc.name}
                </h3>

                {doc.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Uploaded by:{" "}
                    {doc.uploadedBy
                      ? `${doc.uploadedBy.firstName || ""} ${doc.uploadedBy.lastName || ""}`.trim() ||
                        doc.uploadedBy.email
                      : "Unknown"}
                  </span>
                  <span>•</span>
                  <span>Sent: {formatDate(doc.createdAt)}</span>
                  {doc.size && (
                    <>
                      <span>•</span>
                      <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSignClick(doc as any)}
              className="ml-4"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Sign Document
            </Button>
          </div>
        ))}
      </div>

      <DocuSealSigningModal
        isOpen={isSigningModalOpen}
        onClose={() => {
          setIsSigningModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        clientId={clientId}
      />
    </>
  );
}
