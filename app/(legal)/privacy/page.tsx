import { LegalPageViewer } from "@/components/legal/legal-page-viewer";

export const metadata = {
  title: "Privacy Policy | Practice Hub",
  description:
    "Privacy Policy for Practice Hub - Learn how we collect, use, and protect your personal information in compliance with UK GDPR.",
};

/**
 * Privacy Policy Page
 * Public-facing legal page showing the organization's Privacy Policy
 * Accessible at /privacy
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Learn how we collect, use, and protect your personal information
          </p>
        </div>

        {/* Legal Content */}
        <LegalPageViewer pageType="privacy" title="Privacy Policy" />

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
