"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { FileText } from "lucide-react";

interface LegalPageViewerProps {
  pageType: "privacy" | "terms" | "cookie_policy";
  title?: string;
}

/**
 * Legal Page Viewer Component
 * Displays legal content (Privacy Policy, Terms of Service, Cookie Policy)
 * Fetches content from the database via tRPC
 */
export function LegalPageViewer({ pageType, title }: LegalPageViewerProps) {
  const { data: legalPage, isLoading, error } = trpc.legal.getByType.useQuery({
    pageType,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <Skeleton className="h-8 w-64" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Failed to load legal content</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!legalPage) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Legal content not found</p>
            <p className="text-sm mt-2">
              Please contact your administrator to set up legal pages.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-8">
        {/* Legal content with preserved formatting */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div
            className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
            // biome-ignore lint: displaying user-generated legal content
            dangerouslySetInnerHTML={{
              __html: legalPage.content
                .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 mt-8">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-3 mt-6">$2</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mb-2 mt-4">$3</h3>')
                .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
                .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                .replace(/\n\n/g, '<br/><br/>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        </div>

        {/* Metadata footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Version:</strong> {legalPage.version} |{" "}
            <strong>Last Updated:</strong>{" "}
            {new Date(legalPage.updatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
