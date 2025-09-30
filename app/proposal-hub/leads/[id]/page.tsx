"use client";

import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { ConvertToClientDialog } from "@/components/proposal-hub/convert-to-client-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Fetch lead details
  const { data: leadData, isLoading } = trpc.leads.getById.useQuery(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading lead details...</div>
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Lead not found</p>
        <Button onClick={() => router.push("/proposal-hub/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      new: { variant: "default", color: "text-blue-600" },
      contacted: { variant: "secondary", color: "text-slate-600" },
      qualified: { variant: "default", color: "text-green-600" },
      proposal_sent: { variant: "default", color: "text-purple-600" },
      negotiating: { variant: "default", color: "text-orange-600" },
      converted: { variant: "default", color: "text-emerald-600" },
      lost: { variant: "destructive", color: "text-red-600" },
    };

    const config = variants[status] || variants.new;
    const label = status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <Badge variant={config.variant} className={config.color}>
        {label}
      </Badge>
    );
  };

  const getProposalStatusBadge = (status: string) => {
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
            onClick={() => router.push("/proposal-hub/leads")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {leadData.firstName} {leadData.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {leadData.companyName || "No company"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {!leadData.convertedToClientId && (
            <ConvertToClientDialog
              leadId={leadData.id}
              leadName={`${leadData.firstName} ${leadData.lastName}`}
              companyName={leadData.companyName || undefined}
              onSuccess={(clientId) => {
                router.push(`/client-hub/clients/${clientId}`);
              }}
            />
          )}
        </div>
      </div>

      {/* Status and Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          {getStatusBadge(leadData.status)}
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Qualification Score
            </span>
          </div>
          <p className="text-2xl font-bold">
            {leadData.qualificationScore || "—"}/10
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Industry</span>
          </div>
          <p className="text-lg font-medium">
            {leadData.industry || "Not specified"}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Est. Turnover
            </span>
          </div>
          <p className="text-lg font-medium">
            {leadData.estimatedTurnover
              ? `£${Number(leadData.estimatedTurnover).toLocaleString()}`
              : "—"}
          </p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{leadData.email}</p>
                </div>
              </div>

              {leadData.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{leadData.phone}</p>
                  </div>
                </div>
              )}

              {leadData.mobile && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{leadData.mobile}</p>
                  </div>
                </div>
              )}

              {leadData.position && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{leadData.position}</p>
                  </div>
                </div>
              )}

              {leadData.website && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={leadData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {leadData.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Related Proposals */}
          <Card className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Proposals</h2>
              <Button size="sm" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </div>
            {leadData.proposals && leadData.proposals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadData.proposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() =>
                          router.push(`/proposal-hub/proposals/${proposal.id}`)
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{proposal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {proposal.proposalNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getProposalStatusBadge(proposal.status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          £{Number(proposal.monthlyTotal).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No proposals yet</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  Create First Proposal
                </Button>
              </div>
            )}
          </Card>

          {/* Notes */}
          {leadData.notes && (
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {leadData.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Lead Source & Tracking */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Lead Tracking</h2>
            <div className="space-y-4">
              {leadData.source && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Source</p>
                  <Badge variant="outline">{leadData.source}</Badge>
                </div>
              )}

              {leadData.lastContactedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Last Contacted
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(
                        new Date(leadData.lastContactedAt),
                        "MMM d, yyyy",
                      )}
                    </span>
                  </div>
                </div>
              )}

              {leadData.nextFollowUpAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Next Follow-up
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(
                        new Date(leadData.nextFollowUpAt),
                        "MMM d, yyyy",
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(leadData.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Estimated Company Info */}
          {(leadData.estimatedEmployees || leadData.estimatedTurnover) && (
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Company Details</h2>
              <div className="space-y-4">
                {leadData.estimatedEmployees && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Employees
                    </p>
                    <p className="text-lg font-medium">
                      {leadData.estimatedEmployees}
                    </p>
                  </div>
                )}
                {leadData.estimatedTurnover && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Est. Turnover
                    </p>
                    <p className="text-lg font-medium">
                      £{Number(leadData.estimatedTurnover).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Converted Client Info */}
          {leadData.convertedClient && (
            <Card className="glass-card p-6 border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Converted to Client</h2>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/client-hub/clients/${leadData.convertedClient?.id}`,
                    )
                  }
                >
                  View Client Record
                </Button>
                {leadData.convertedAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Converted on{" "}
                    {format(new Date(leadData.convertedAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
