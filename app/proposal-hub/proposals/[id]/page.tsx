"use client";

import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Edit,
  FileText,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Fetch proposal details
  const { data: proposalData, isLoading } = trpc.proposals.getById.useQuery(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading proposal details...</div>
      </div>
    );
  }

  if (!proposalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Proposal not found</p>
        <Button onClick={() => router.push("/proposal-hub/proposals")}>
          Back to Proposals
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      draft: { variant: "secondary", color: "text-slate-600" },
      sent: { variant: "default", color: "text-blue-600" },
      viewed: { variant: "default", color: "text-indigo-600" },
      signed: { variant: "default", color: "text-green-600" },
      rejected: { variant: "destructive", color: "text-red-600" },
      expired: { variant: "outline", color: "text-orange-600" },
    };

    const config = variants[status] || variants.draft;

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/proposal-hub/proposals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {proposalData.title}
              </h1>
              {getStatusBadge(proposalData.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              {proposalData.proposalNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {proposalData.status === "draft" && (
            <Button disabled>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </Button>
          )}
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Pricing Model
            </span>
          </div>
          <p className="text-lg font-bold">
            Model {proposalData.pricingModelUsed || "—"}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Created</span>
          </div>
          <p className="text-lg font-medium">
            {format(new Date(proposalData.createdAt), "MMM d, yyyy")}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Valid Until</span>
          </div>
          <p className="text-lg font-medium">
            {proposalData.validUntil
              ? format(new Date(proposalData.validUntil), "MMM d, yyyy")
              : "Not set"}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          {getStatusBadge(proposalData.status)}
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Services & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                  <p className="font-medium">
                    {proposalData.clientName || "No client assigned"}
                  </p>
                </div>
              </div>

              {proposalData.clientEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{proposalData.clientEmail}</p>
                  </div>
                </div>
              )}

              {proposalData.industry && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{proposalData.industry}</p>
                  </div>
                </div>
              )}

              {proposalData.turnover && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Turnover</p>
                    <p className="font-medium">{proposalData.turnover}</p>
                  </div>
                </div>
              )}

              {proposalData.monthlyTransactions && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Monthly Transactions
                    </p>
                    <p className="font-medium">
                      {proposalData.monthlyTransactions.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Services Breakdown */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Services Included</h2>
            {proposalData.services && proposalData.services.length > 0 ? (
              <div className="space-y-4">
                {proposalData.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-start pb-4 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{service.componentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.componentCode}
                      </p>
                      {service.calculation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {service.calculation}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold whitespace-nowrap ml-4">
                      £{Number(service.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No services added yet</p>
            )}
          </Card>

          {/* Terms & Conditions */}
          {proposalData.termsAndConditions && (
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                Terms & Conditions
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposalData.termsAndConditions}
              </p>
            </Card>
          )}

          {/* Notes */}
          {proposalData.notes && (
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Internal Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposalData.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Right Column - Pricing Summary & Timeline */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">
                  Pricing Model
                </span>
                <Badge variant="outline">
                  Model {proposalData.pricingModelUsed || "—"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Total</span>
                  <span className="text-2xl font-bold text-primary">
                    £{Number(proposalData.monthlyTotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Annual Total</span>
                  <span className="font-medium">
                    £{Number(proposalData.annualTotal).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(proposalData.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {proposalData.sentAt && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sent to Client</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(proposalData.sentAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {proposalData.viewedAt && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Viewed by Client</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(proposalData.viewedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {proposalData.signedAt && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Signed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(proposalData.signedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              {proposalData.status === "draft" && (
                <Button className="w-full" disabled>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              )}
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {proposalData.status !== "signed" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Archive Proposal
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
