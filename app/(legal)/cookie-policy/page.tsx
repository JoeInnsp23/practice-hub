import { LegalPageViewer } from "@/components/legal/legal-page-viewer";

export const metadata = {
  title: "Cookie Policy | Practice Hub",
  description:
    "Cookie Policy for Practice Hub - Learn about how we use cookies and similar tracking technologies.",
};

/**
 * Cookie Policy Page
 * Public-facing legal page showing the organization's Cookie Policy
 * Accessible at /cookie-policy
 */
export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Learn about how we use cookies and similar tracking technologies
          </p>
        </div>

        {/* Legal Content */}
        <LegalPageViewer pageType="cookie_policy" title="Cookie Policy" />

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
