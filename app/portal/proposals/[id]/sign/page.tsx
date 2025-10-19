"use client";

import { AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignProposalPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [embedLoaded, setEmbedLoaded] = useState(false);

  const { data: proposal, isLoading } =
    trpc.clientPortal.getProposalById.useQuery({
      id: proposalId,
    });

  useEffect(() => {
    if (!proposal?.docusealSubmissionId) return;

    // Load DocuSeal embed script
    const script = document.createElement("script");
    script.src = "https://cdn.docuseal.com/js/form.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      setEmbedLoaded(true);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [proposal?.docusealSubmissionId]);

  useEffect(() => {
    if (!embedLoaded || !proposal?.docusealSubmissionId) return;

    // Initialize DocuSeal form
    const container = document.getElementById("docuseal-form");
    if (!container) return;

    // @ts-expect-error - DocuSeal global
    if (typeof window.DocusealForm !== "undefined") {
      // @ts-expect-error
      new window.DocusealForm({
        src: `https://docuseal.com/s/${proposal.docusealSubmissionId}`,
        onComplete: () => {
          // Redirect to proposal detail page after signing
          router.push(`/portal/proposals/${proposalId}`);
        },
      }).mount(container);
    }
  }, [embedLoaded, proposal, proposalId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-destructive opacity-50" />
          <p className="text-destructive font-medium mb-2">
            Proposal not found
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/portal/proposals")}
          >
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  if (proposal.status === "signed") {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/portal/proposals/${proposalId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposal
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Already Signed</AlertTitle>
          <AlertDescription>
            This proposal has already been signed. You can view the signed
            document from the proposal details page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (proposal.status === "expired") {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/portal/proposals/${proposalId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposal
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Proposal Expired</AlertTitle>
          <AlertDescription>
            This proposal has expired. Please contact us to request a new
            proposal.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!proposal.docusealSubmissionId) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/portal/proposals/${proposalId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposal
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Signing Not Available</AlertTitle>
          <AlertDescription>
            This proposal is not yet ready for signing. Please contact us for
            assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/portal/proposals/${proposalId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign Proposal {proposal.proposalNumber}</CardTitle>
          <CardDescription>
            Review and sign the proposal below. Your signature will be legally
            binding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* DocuSeal Embed Container */}
          <div
            id="docuseal-form"
            className="min-h-[600px] w-full"
            style={{ minHeight: "600px" }}
          />
          {!embedLoaded && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50 animate-pulse" />
                <p className="text-muted-foreground">Loading signing form...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
