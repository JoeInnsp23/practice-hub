"use client";

import { FileText } from "lucide-react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

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
  const {
    data: legalPage,
    isLoading,
    error,
  } = trpc.legal.getByType.useQuery({
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
        {/* Legal content with safe markdown rendering */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={
              {
                h1: ({ ...props }) => (
                  <h1 className="text-3xl font-bold mb-4 mt-8" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-2xl font-semibold mb-3 mt-6" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-xl font-semibold mb-2 mt-4" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="mb-4 leading-relaxed" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc ml-6 mb-4" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal ml-6 mb-4" {...props} />
                ),
                li: ({ ...props }) => <li className="mb-1" {...props} />,
                strong: ({ ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                a: ({ ...props }) => (
                  <a
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse" {...props} />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th
                    className="border border-border px-4 py-2 bg-muted font-semibold text-left"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td className="border border-border px-4 py-2" {...props} />
                ),
              } as Components
            }
          >
            {legalPage.content}
          </ReactMarkdown>
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
