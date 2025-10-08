"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MoreVertical,
  Phone,
  Star,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AssignLeadDialog } from "@/app/proposal-hub/leads/components/assign-lead-dialog";
import { ScheduleFollowUpDialog } from "@/app/proposal-hub/leads/components/schedule-follow-up-dialog";
import { trpc } from "@/app/providers/trpc-provider";
import { ActivityTimeline } from "@/components/proposal-hub/activity-timeline";
import { TaskDialog } from "@/components/proposal-hub/task-dialog";
import { TaskList } from "@/components/proposal-hub/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusBadgeConfig = {
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string;
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Fetch lead data
  const { data: leadData, isLoading } = trpc.leads.getById.useQuery(leadId);

  if (isLoading) {
    return <LeadDetailSkeleton />;
  }

  if (!leadData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Lead not found</p>
        <Button onClick={() => router.push("/proposal-hub/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const lead = leadData;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, StatusBadgeConfig> = {
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

  const getQualificationLevel = (score: number | null) => {
    if (!score) return { label: "Not Scored", color: "text-muted-foreground" };
    if (score >= 9) return { label: "Hot Lead", color: "text-red-600" };
    if (score >= 7) return { label: "High Priority", color: "text-orange-600" };
    if (score >= 5)
      return { label: "Medium Priority", color: "text-yellow-600" };
    return { label: "Low Priority", color: "text-slate-600" };
  };

  const qualificationLevel = getQualificationLevel(lead.qualificationScore);

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
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lead.companyName || "No company"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Lead
          </Button>
          <Button variant="outline" onClick={() => setFollowUpDialogOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule Follow-up
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserCheck className="h-4 w-4 mr-2" />
                Convert to Client
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-destructive">
                Mark as Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status and Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-2">{getStatusBadge(lead.status)}</div>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Qualification Score
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Star
                  className={`h-5 w-5 ${
                    lead.qualificationScore && lead.qualificationScore >= 7
                      ? "text-green-600 fill-green-600"
                      : lead.qualificationScore && lead.qualificationScore >= 4
                        ? "text-yellow-600 fill-yellow-600"
                        : "text-gray-400 fill-gray-400"
                  }`}
                />
                <span className="text-2xl font-bold">
                  {lead.qualificationScore || "—"}/10
                </span>
              </div>
              <p className={`text-sm mt-1 ${qualificationLevel.color}`}>
                {qualificationLevel.label}
              </p>
            </div>
            <Star className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="text-2xl font-bold mt-2">
                {lead.source || "Unknown"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals ({lead.proposals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
                {lead.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.mobile && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="font-medium">{lead.mobile}</p>
                    </div>
                  </div>
                )}
                {lead.position && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-medium">{lead.position}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6" key="company-info">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>
              <div className="space-y-3">
                {lead.companyName && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Company Name
                    </p>
                    <p className="font-medium">{lead.companyName}</p>
                  </div>
                )}
                {lead.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{lead.industry}</p>
                  </div>
                )}
                {lead.estimatedTurnover && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimated Turnover
                      </p>
                      <p className="font-medium">
                        £{Number(lead.estimatedTurnover).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {lead.estimatedEmployees !== null &&
                  lead.estimatedEmployees !== undefined && (
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Estimated Employees
                        </p>
                        <p className="font-medium">{lead.estimatedEmployees}</p>
                      </div>
                    </div>
                  )}
              </div>
            </Card>

            {/* Interested Services */}
            {lead.interestedServices &&
              Array.isArray(lead.interestedServices) &&
              lead.interestedServices.length > 0 && (
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Interested Services
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.interestedServices.map((service: string) => (
                      <Badge key={service} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

            {/* Follow-up Information */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-up Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last Contacted
                  </p>
                  <p className="font-medium mt-1">
                    {lead.lastContactedAt
                      ? format(
                          new Date(lead.lastContactedAt),
                          "MMM d, yyyy h:mm a",
                        )
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Next Follow-up
                  </p>
                  <p className="font-medium mt-1">
                    {lead.nextFollowUpAt
                      ? format(
                          new Date(lead.nextFollowUpAt),
                          "MMM d, yyyy h:mm a",
                        )
                      : "Not scheduled"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium mt-1">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </Card>

            {/* Notes */}
            {lead.notes && (
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </Card>
            )}

            {/* Tasks */}
            <Card className="p-6 lg:col-span-2">
              <TaskList
                assignedToId={lead.assignedToId || undefined}
                showAddButton={true}
                onAddTask={() => setTaskDialogOpen(true)}
              />
            </Card>

            {/* Converted Client */}
            {lead.convertedClient && (
              <Card className="p-6 lg:col-span-2 border-green-200 dark:border-green-900">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Converted to Client
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.convertedClient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.convertedClient.email}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {lead.convertedClient.status}
                    </Badge>
                  </div>
                  <Button
                    onClick={() =>
                      router.push(
                        `/client-hub/clients/${lead.convertedClient?.id}`,
                      )
                    }
                  >
                    View Client
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          {lead.proposals && lead.proposals.length > 0 ? (
            <div className="space-y-4">
              {lead.proposals.map((proposal) => (
                <Card key={proposal.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">
                          {proposal.proposalNumber}
                        </h4>
                        <Badge variant="secondary">{proposal.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proposal.title}
                      </p>
                      <p className="text-sm font-medium mt-2">
                        Monthly: £{proposal.monthlyTotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/proposal-hub/proposals/${proposal.id}`)
                      }
                    >
                      View Proposal
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No proposals yet</p>
                <Button variant="outline" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Create First Proposal
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <ActivityTimeline
              entityType="lead"
              entityId={leadId}
              showAddActivity={true}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Lead Dialog */}
      <AssignLeadDialog
        leadId={leadId}
        leadName={`${lead.firstName} ${lead.lastName}`}
        currentAssigneeId={lead.assignedToId}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      {/* Schedule Follow-up Dialog */}
      <ScheduleFollowUpDialog
        leadId={leadId}
        leadName={`${lead.firstName} ${lead.lastName}`}
        currentFollowUpDate={
          lead.nextFollowUpAt
            ? typeof lead.nextFollowUpAt === "string"
              ? lead.nextFollowUpAt
              : lead.nextFollowUpAt.toISOString()
            : null
        }
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        assignedToId={lead.assignedToId || undefined}
      />
    </div>
  );
}

function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      <Skeleton className="h-96" />
    </div>
  );
}
