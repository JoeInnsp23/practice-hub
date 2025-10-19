"use client";

import { CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Card } from "@/components/ui/card";
import { useClientPortalSession } from "@/lib/client-portal-auth-client";

export default function SignProposalPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Check if user is authenticated in client portal
  const { data: clientPortalSession } = useClientPortalSession();

  // Redirect authenticated portal users to the portal signing page
  useEffect(() => {
    if (clientPortalSession?.user) {
      router.replace(`/portal/proposals/${proposalId}/sign`);
    }
  }, [clientPortalSession, proposalId, router]);

  // Fetch proposal data and DocuSeal submission details (public endpoint)
  const { data: proposalData, isLoading } =
    trpc.proposals.getProposalForSignature.useQuery(proposalId);

  useEffect(() => {
    if (proposalData?.docusealSubmissionId) {
      // Construct DocuSeal embedded URL
      const docusealHost =
        process.env.NEXT_PUBLIC_DOCUSEAL_HOST || "http://localhost:3030";
      const embeddedUrl = `${docusealHost}/s/${proposalData.docusealSubmissionId}`;
      setIframeUrl(embeddedUrl);
    }
  }, [proposalData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-muted-foreground">Loading proposal...</div>
      </div>
    );
  }

  if (!proposalData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Proposal Not Found</h1>
          <p className="text-muted-foreground">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  if (proposalData.status === "signed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Already Signed</h1>
          <p className="text-muted-foreground">
            This proposal has already been signed.
          </p>
        </Card>
      </div>
    );
  }

  // Check if proposal has expired
  if (
    proposalData.validUntil &&
    new Date() > new Date(proposalData.validUntil)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">
            Proposal Expired
          </h1>
          <p className="text-muted-foreground">
            This proposal expired on{" "}
            {new Date(proposalData.validUntil).toLocaleDateString()}. Please
            contact us for a new proposal.
          </p>
        </Card>
      </div>
    );
  }

  if (!iframeUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-muted-foreground">Preparing signature...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Sign Proposal</h1>
          <p className="text-muted-foreground mt-1">
            Proposal #{proposalData.proposalNumber}
          </p>
        </div>

        {/* DocuSeal Embedded Iframe */}
        <Card className="glass-card overflow-hidden">
          <iframe
            src={iframeUrl}
            className="w-full h-[800px] border-0"
            title="Sign Proposal"
            allow="camera; microphone"
          />
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            🔒 This is a secure signing link. Your signature will be encrypted
            and stored with a complete audit trail.
          </p>
          <p className="mt-2">
            By signing, you consent to electronic signature with the same legal
            effect as handwritten signature.
          </p>
        </div>
      </div>
    </div>
  );
}
