"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { InvitationEmailPreviewParams } from "@/lib/email/preview";
import { generateInvitationEmailPreview } from "@/lib/email/preview";

interface EmailPreviewModalProps {
  previewData: InvitationEmailPreviewParams;
  triggerButton?: React.ReactNode;
}

export function EmailPreviewModal({
  previewData,
  triggerButton,
}: EmailPreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      generateInvitationEmailPreview(previewData)
        .then(setHtmlContent)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, previewData]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" type="button">
            <Eye className="mr-2 h-4 w-4" />
            Preview Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Email Preview</DialogTitle>
        <DialogDescription className="sr-only">
          This is how the invitation email will appear to{" "}
          <span className="font-semibold">{previewData.email}</span>
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              This is how the invitation email will appear to{" "}
              <span className="font-semibold">{previewData.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto px-8 md:px-10 pb-8 md:pb-10">
            <div className="border rounded-lg bg-slate-50 dark:bg-slate-900 h-full">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              ) : (
                <div className="p-4">
                  <div
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                    style={{ maxWidth: "600px", margin: "0 auto" }}
                  >
                    <iframe
                      srcDoc={htmlContent}
                      title="Email Preview"
                      className="w-full h-[600px] border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
