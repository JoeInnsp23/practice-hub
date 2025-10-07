"use client";

import { CheckCircle2, Mail, Phone } from "lucide-react";
import { use } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProposalSignedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Fetch proposal data
  const { data: proposalData, isLoading } = trpc.proposals.getById.useQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <Card className="glass-card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Proposal Signed Successfully!
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Thank you for signing proposal #{proposalData?.proposalNumber}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              Confirmation email sent to:
            </p>
            <p className="font-medium">{proposalData?.clientEmail}</p>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Welcome Call</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will contact you within 24-48 hours to schedule your
                  onboarding call and discuss the next steps.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Document Collection</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send you a secure link to upload any necessary documents
                  and provide access to your accounting systems.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Onboarding & Setup</h3>
                <p className="text-sm text-muted-foreground">
                  We'll set up your accounting systems and establish our
                  workflow together.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">4</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Service Commencement</h3>
                <p className="text-sm text-muted-foreground">
                  Your services will officially begin, and you'll gain access to
                  our client portal for real-time financial insights.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Need Help?</h2>

          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about the onboarding process or your
            proposal, please don't hesitate to contact us.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Us
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Us
            </Button>
          </div>
        </Card>

        {/* Footer Message */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            A copy of your signed proposal has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
