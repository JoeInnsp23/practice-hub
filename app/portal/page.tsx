"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/app/_trpc/client";
import { useClientPortalContext } from "@/contexts/client-portal-context";

export default function ClientPortalDashboard() {
  const router = useRouter();
  const { currentClientId } = useClientPortalContext();

  // Check onboarding status and redirect if not approved
  const { data: onboardingStatus, isLoading } = trpc.onboarding.getOnboardingStatus.useQuery(
    { clientId: currentClientId || "" },
    { enabled: !!currentClientId }
  );

  useEffect(() => {
    if (onboardingStatus && !onboardingStatus.canAccessPortal && currentClientId) {
      router.push(`/client-portal/onboarding/pending?clientId=${currentClientId}`);
    }
  }, [onboardingStatus, currentClientId, router]);

  // Show loading state while checking access
  if (isLoading || (onboardingStatus && !onboardingStatus.canAccessPortal)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-2">
        Welcome to Your Client Portal
      </h1>
      <p className="text-muted-foreground mb-8">
        Access your proposals, invoices, and documents in one secure location.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No proposals yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No invoices yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No documents yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
