import { LegalPageViewer } from "@/components/legal/legal-page-viewer";

export const metadata = {
  title: "Terms of Service | Practice Hub",
  description:
    "Terms of Service for Practice Hub - Read our terms and conditions for using our practice management platform.",
};

/**
 * Terms of Service Page
 * Public-facing legal page showing the organization's Terms of Service
 * Accessible at /terms
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Please read these terms and conditions carefully before using our
            platform
          </p>
        </div>

        {/* Legal Content */}
        <LegalPageViewer pageType="terms" title="Terms of Service" />

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
