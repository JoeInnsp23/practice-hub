"use client";

import { FileText, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { LegalVersionHistoryDialog } from "./legal-version-history-dialog";

interface LegalEditorProps {
  pageType: "privacy" | "terms" | "cookie_policy";
  title: string;
}

/**
 * Legal Editor Component
 * Allows admins to edit legal page content
 * Includes version tracking and history
 */
export function LegalEditor({ pageType, title }: LegalEditorProps) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current legal page
  const { data: legalPage, isLoading } = trpc.legal.getByType.useQuery({
    pageType,
  });

  // Update content when legal page data is fetched
  useEffect(() => {
    if (legalPage && !hasChanges) {
      setContent(legalPage.content);
    }
  }, [legalPage, hasChanges]);

  // Update mutation
  const updateMutation = trpc.legal.update.useMutation({
    onSuccess: () => {
      toast.success(`${title} updated successfully!`);
      setHasChanges(false);
      // Invalidate queries to refresh data
      utils.legal.getByType.invalidate({ pageType });
      utils.legal.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== legalPage?.content);
  };

  const handleSave = () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    updateMutation.mutate({
      pageType,
      content,
    });
  };

  const handleReset = () => {
    if (legalPage) {
      setContent(legalPage.content);
      setHasChanges(false);
      toast.success("Changes reset");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        {legalPage && (
          <p className="text-sm text-muted-foreground">
            Current Version: {legalPage.version} | Last Updated:{" "}
            {new Date(legalPage.updatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Editor */}
        <div className="space-y-2">
          <Label htmlFor={`content-${pageType}`}>Content (Markdown)</Label>
          <Textarea
            id={`content-${pageType}`}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter legal content in markdown format..."
            className="min-h-[400px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            You can use markdown formatting: # for headings, ** for bold, - for
            lists
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={updateMutation.isPending}
            >
              Reset
            </Button>
          )}

          {legalPage && legalPage.version > 1 && (
            <div className="ml-auto">
              <LegalVersionHistoryDialog
                pageType={pageType}
                pageTitle={title}
                currentVersion={legalPage.version}
              />
            </div>
          )}
        </div>

        {/* Character count */}
        <div className="text-xs text-muted-foreground text-right">
          {content.length.toLocaleString()} characters
        </div>
      </CardContent>
    </Card>
  );
}
