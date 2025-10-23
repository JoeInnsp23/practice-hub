import { Cookie, FileText, Shield } from "lucide-react";
import { LegalEditor } from "@/components/legal/legal-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Legal Settings | Admin | Practice Hub",
  description:
    "Manage legal page content - Privacy Policy, Terms of Service, and Cookie Policy",
};

/**
 * Admin Legal Settings Page
 * Allows administrators to edit legal page content
 * Accessible at /admin/settings/legal (admin-only)
 */
export default function AdminLegalSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Legal Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization's legal pages. Changes are versioned and
          tracked.
        </p>
      </div>

      {/* Legal Page Editors */}
      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger
            value="cookie_policy"
            className="flex items-center gap-2"
          >
            <Cookie className="h-4 w-4" />
            Cookie Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <LegalEditor pageType="privacy" title="Privacy Policy" />
        </TabsContent>

        <TabsContent value="terms">
          <LegalEditor pageType="terms" title="Terms of Service" />
        </TabsContent>

        <TabsContent value="cookie_policy">
          <LegalEditor pageType="cookie_policy" title="Cookie Policy" />
        </TabsContent>
      </Tabs>

      {/* Help Text */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-semibold mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use markdown formatting for better readability</li>
          <li>All changes are versioned and tracked in the activity log</li>
          <li>
            Legal pages are visible to all users at /privacy, /terms, and
            /cookie-policy
          </li>
          <li>
            Review changes carefully before saving - this content has legal
            implications
          </li>
          <li>
            Consider having legal counsel review changes before publication
          </li>
        </ul>
      </div>
    </div>
  );
}
