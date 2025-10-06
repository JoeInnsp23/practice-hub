"use client";

import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PipelinePage() {
  const router = useRouter();

  // Fetch all proposals
  const { data: proposalsData, isLoading } = trpc.proposals.list.useQuery({});
  const proposals = proposalsData?.proposals || [];

  // Group proposals by status
  const proposalsByStatus = {
    draft: proposals.filter((p) => p.status === "draft"),
    sent: proposals.filter((p) => p.status === "sent"),
    viewed: proposals.filter((p) => p.status === "viewed"),
    signed: proposals.filter((p) => p.status === "signed"),
    rejected: proposals.filter((p) => p.status === "rejected"),
  };

  const columns = [
    {
      id: "draft",
      title: "Draft",
      proposals: proposalsByStatus.draft,
      color: "bg-slate-100 dark:bg-slate-800",
      badgeColor: "text-slate-600",
    },
    {
      id: "sent",
      title: "Sent",
      proposals: proposalsByStatus.sent,
      color: "bg-blue-100 dark:bg-blue-900/30",
      badgeColor: "text-blue-600",
    },
    {
      id: "viewed",
      title: "Viewed",
      proposals: proposalsByStatus.viewed,
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      badgeColor: "text-indigo-600",
    },
    {
      id: "signed",
      title: "Signed",
      proposals: proposalsByStatus.signed,
      color: "bg-green-100 dark:bg-green-900/30",
      badgeColor: "text-green-600",
    },
    {
      id: "rejected",
      title: "Rejected",
      proposals: proposalsByStatus.rejected,
      color: "bg-red-100 dark:bg-red-900/30",
      badgeColor: "text-red-600",
    },
  ];

  // Calculate total value in pipeline
  const pipelineValue = proposals
    .filter((p) => ["sent", "viewed"].includes(p.status))
    .reduce((sum, p) => sum + Number(p.monthlyTotal), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Proposal Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Visual workflow of all proposals
          </p>
        </div>
        <Button onClick={() => router.push("/proposal-hub/calculator")}>
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Proposals</p>
          <p className="text-2xl font-bold">{proposals.length}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">In Pipeline</p>
          <p className="text-2xl font-bold">
            {proposalsByStatus.sent.length + proposalsByStatus.viewed.length}
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold">£{pipelineValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">/month</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Signed</p>
          <p className="text-2xl font-bold text-green-600">
            {proposalsByStatus.signed.length}
          </p>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            {/* Column Header */}
            <Card className={`glass-card p-3 ${column.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">{column.proposals.length}</Badge>
              </div>
            </Card>

            {/* Proposal Cards */}
            <div className="space-y-3 min-h-[200px]">
              {column.proposals.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">No proposals</p>
                </div>
              ) : (
                column.proposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className="glass-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      router.push(`/proposal-hub/proposals/${proposal.id}`)
                    }
                  >
                    <div className="space-y-2">
                      {/* Title and Number */}
                      <div>
                        <p className="font-medium text-sm line-clamp-2">
                          {proposal.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {proposal.proposalNumber}
                        </p>
                      </div>

                      {/* Client */}
                      {proposal.clientName && (
                        <p className="text-xs text-muted-foreground">
                          {proposal.clientName}
                        </p>
                      )}

                      {/* Value */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Monthly
                        </span>
                        <span className="text-sm font-bold text-primary">
                          £{Number(proposal.monthlyTotal).toFixed(2)}
                        </span>
                      </div>

                      {/* Date */}
                      {proposal.sentAt && (
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(proposal.sentAt), "MMM d")}
                        </p>
                      )}
                      {proposal.validUntil && (
                        <p className="text-xs text-muted-foreground">
                          Valid until{" "}
                          {format(new Date(proposal.validUntil), "MMM d")}
                        </p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {proposals.length === 0 && (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first proposal to get started
              </p>
              <Button onClick={() => router.push("/proposal-hub/calculator")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
