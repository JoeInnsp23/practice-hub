"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { SUPPORT_EMAIL } from "@/lib/config";

export default function OnboardingPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  // Exponential backoff: 10s → 15s → 20s → 30s (capped)
  const getPollingInterval = () => {
    if (!pollingEnabled) return false;

    if (pollCount < 6) return 10000;       // First minute: 10s
    if (pollCount < 14) return 15000;      // Minutes 1-3: 15s
    if (pollCount < 23) return 20000;      // Minutes 3-6: 20s
    return 30000;                          // After 6 minutes: 30s
  };

  const { data: statusData, refetch } = trpc.onboarding.getOnboardingStatus.useQuery(
    { clientId: clientId || "" },
    {
      enabled: !!clientId,
      refetchInterval: getPollingInterval(),
      onSuccess: () => {
        // Increment poll count on each successful poll
        if (pollingEnabled) {
          setPollCount((prev) => prev + 1);
        }
      },
    }
  );

  const reVerificationMutation = trpc.onboarding.requestReVerification.useMutation();

  // Redirect to portal if approved OR stop polling if rejected
  useEffect(() => {
    if (statusData?.canAccessPortal) {
      setPollingEnabled(false);
      router.push("/portal");
    } else if (statusData?.session?.status === "rejected") {
      // Stop polling if verification was rejected
      setPollingEnabled(false);
    }
  }, [statusData?.canAccessPortal, statusData?.session?.status, router]);

  const handleManualRefresh = () => {
    // Reset poll count on manual refresh for immediate updates
    setPollCount(0);
    refetch();
  };

  const handleRestartVerification = async () => {
    if (!clientId) return;

    try {
      const result = await reVerificationMutation.mutateAsync({ clientId });

      // Show result with verification URL
      if (result.emailSent) {
        alert(`${result.message}\n\nOr use this link: ${result.verificationUrl}`);
      } else {
        alert(`${result.message}\n\nVerification link: ${result.verificationUrl}`);
      }

      // Enable polling again and reset count
      setPollCount(0);
      setPollingEnabled(true);
      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to restart verification");
    }
  };

  if (!statusData || !statusData.hasOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 flex items-center justify-center">
        <Card className="p-8 max-w-2xl">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Onboarding Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find an onboarding session for your account.
            </p>
            <Button onClick={() => router.push("/portal")}>
              Go to Portal
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { session: onboardingSession, kycVerification, canAccessPortal, blockingReason } = statusData;

  // Get verification URL from session metadata
  const verificationUrl = onboardingSession.status === "pending_approval" && kycVerification
    ? (kycVerification.metadata as any)?.verificationUrl
    : null;

  const isApproved = canAccessPortal;
  const isPending = onboardingSession.status === "pending_approval";
  const isRejected = onboardingSession.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to access the client portal
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`
              h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0
              ${isApproved ? "bg-green-100 dark:bg-green-950" : ""}
              ${isPending ? "bg-yellow-100 dark:bg-yellow-950" : ""}
              ${isRejected ? "bg-red-100 dark:bg-red-950" : ""}
            `}>
              {isApproved && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              {isPending && <Clock className="h-6 w-6 text-yellow-600" />}
              {isRejected && <AlertCircle className="h-6 w-6 text-red-600" />}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                {isApproved && "Verification Complete"}
                {isPending && "Verification Pending"}
                {isRejected && "Verification Declined"}
              </h2>
              <p className="text-muted-foreground">
                {isApproved && "Your identity has been verified. Redirecting to portal..."}
                {isPending && blockingReason}
                {isRejected && blockingReason}
              </p>

              {isPending && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>
                    Checking status every{" "}
                    {pollCount < 6 ? "10" : pollCount < 14 ? "15" : pollCount < 23 ? "20" : "30"} seconds...
                  </span>
                </div>
              )}
            </div>

            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </Card>

        {/* Restart Verification Card */}
        {isRejected && (
          <Card className="p-6 border-2 border-red-600 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Request New Verification</h3>

                <p className="text-sm text-muted-foreground mb-4">
                  Your previous verification was declined. If you believe this was an error or have
                  new/corrected documents, you can request a new verification.
                </p>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Please note:</strong> Make sure you have valid, unaltered identity
                      documents before requesting a new verification. Repeated failed verifications
                      may result in additional review.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleRestartVerification}
                  disabled={reVerificationMutation.isPending}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {reVerificationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating New Verification...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request New Verification
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground mt-3">
                  If you need assistance, please contact support at {SUPPORT_EMAIL}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Verification Link Card */}
        {isPending && verificationUrl && (
          <Card className="p-6 border-2 border-primary mb-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Complete Identity Verification</h3>

                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to complete your identity verification through our secure
                  partner, LEM Verify. This process includes:
                </p>

                <ul className="text-sm text-muted-foreground space-y-1 mb-4 ml-4">
                  <li>• Upload identity documents (passport or driving license)</li>
                  <li>• Face matching verification</li>
                  <li>• Liveness detection</li>
                  <li>• AML and PEP screening</li>
                </ul>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Please note:</strong> You may need to upload your identity documents
                      again on the verification platform. This is required for biometric verification
                      and compliance checks.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full md:w-auto"
                >
                  <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                    Complete Verification
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>

                <p className="text-xs text-muted-foreground mt-3">
                  Verification typically takes 2-5 minutes. Results are usually available within 24 hours.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* KYC Status Card */}
        {kycVerification && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Verification Status</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Document Verification</span>
                <span className={`text-sm font-medium ${
                  kycVerification.documentVerified ? "text-green-600" : "text-muted-foreground"
                }`}>
                  {kycVerification.documentVerified ? "Complete" : "Pending"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Face Matching</span>
                <span className={`text-sm font-medium ${
                  kycVerification.facematchResult === "pass" ? "text-green-600" : "text-muted-foreground"
                }`}>
                  {kycVerification.facematchResult === "pass" ? "Passed" : "Pending"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Liveness Check</span>
                <span className={`text-sm font-medium ${
                  kycVerification.livenessResult === "pass" ? "text-green-600" : "text-muted-foreground"
                }`}>
                  {kycVerification.livenessResult === "pass" ? "Passed" : "Pending"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">AML Screening</span>
                <span className={`text-sm font-medium ${
                  kycVerification.amlStatus === "clear" ? "text-green-600" :
                  kycVerification.amlStatus ? "text-yellow-600" : "text-muted-foreground"
                }`}>
                  {kycVerification.amlStatus === "clear" ? "Clear" :
                   kycVerification.amlStatus || "Pending"}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Help Section */}
        <Card className="p-6 mt-6 bg-muted/50">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you're experiencing issues with verification or have questions, please contact our
            support team.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              Contact Support
            </a>
          </Button>
        </Card>
      </div>
    </div>
  );
}
