"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { SignaturePad } from "@/components/proposal-hub/signature-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch proposal data (public endpoint)
  const { data: proposalData, isLoading } =
    trpc.proposals.getProposalForSignature.useQuery(id);

  // Sign proposal mutation (public endpoint)
  const { mutate: signProposal, isPending: isSigning } =
    trpc.proposals.submitSignature.useMutation({
      onSuccess: () => {
        toast.success("Proposal signed successfully!");
        router.push(`/proposals/signed/${id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to sign proposal");
      },
    });

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
    toast.success("Signature captured");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!signerEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!signatureData) {
      toast.error("Please provide your signature");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    // Submit signature
    signProposal({
      proposalId: id,
      signerName,
      signerEmail,
      signatureData,
    });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Sign Proposal</h1>
          <p className="text-muted-foreground">
            Proposal #{proposalData.proposalNumber}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proposal Summary */}
          <Card className="glass-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Proposal Summary</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {proposalData.clientName || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <div className="mt-2 space-y-2">
                  {proposalData.services?.map((service, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start text-sm"
                    >
                      <span>{service.componentName}</span>
                      <span className="font-medium">
                        £{Number(service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">Monthly Total:</p>
                  <p className="text-2xl font-bold text-primary">
                    £{Number(proposalData.monthlyTotal).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <p>Annual Total:</p>
                  <p>£{Number(proposalData.annualTotal).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Signer Information */}
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="signerName">Full Name *</Label>
                <Input
                  id="signerName"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="John Smith"
                  required
                  disabled={isSigning}
                />
              </div>

              <div>
                <Label htmlFor="signerEmail">Email Address *</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={isSigning}
                />
              </div>
            </div>
          </Card>

          {/* Signature Pad */}
          <SignaturePad onSave={handleSignatureSave} disabled={isSigning} />

          {/* Terms Agreement */}
          <Card className="glass-card p-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked === true)
                }
                disabled={isSigning}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the terms and conditions
                </label>
                <p className="text-sm text-muted-foreground">
                  By signing this proposal, you agree to the terms outlined in
                  the document and authorize the commencement of services.
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSigning || !signatureData || !agreedToTerms}
              className="min-w-[200px]"
            >
              {isSigning ? "Signing..." : "Sign Proposal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
