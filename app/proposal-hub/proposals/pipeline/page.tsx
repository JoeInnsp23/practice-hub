"use client";

import {
  CheckCircle,
  CircleDot,
  Clock,
  FileText,
  Plus,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { SalesKanbanBoard } from "@/components/proposal-hub/kanban/sales-kanban-board";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SalesStage } from "@/lib/constants/sales-stages";

export default function ProposalsPipelinePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Fetch all proposals
  const { data: proposalsData, isLoading } = trpc.proposals.list.useQuery({
    search: search || undefined,
    status: statusFilter as any,
  });

  const proposals = proposalsData?.proposals || [];

  // Group proposals by sales stage
  const proposalsByStage: Record<SalesStage, typeof proposals> = {
    enquiry: proposals.filter((p) => p.salesStage === "enquiry"),
    qualified: proposals.filter((p) => p.salesStage === "qualified"),
    proposal_sent: proposals.filter((p) => p.salesStage === "proposal_sent"),
    follow_up: proposals.filter((p) => p.salesStage === "follow_up"),
    won: proposals.filter((p) => p.salesStage === "won"),
    lost: proposals.filter((p) => p.salesStage === "lost"),
    dormant: proposals.filter((p) => p.salesStage === "dormant"),
  };

  const totalProposals = proposals.length;
  const totalValue = proposals.reduce(
    (sum, p) => sum + Number.parseFloat(p.monthlyTotal || "0"),
    0,
  );

  // Calculate active pipeline (non-terminal stages)
  const activeProposals =
    (proposalsByStage.enquiry?.length || 0) +
    (proposalsByStage.qualified?.length || 0) +
    (proposalsByStage.proposal_sent?.length || 0) +
    (proposalsByStage.follow_up?.length || 0);

  const wonProposals = proposalsByStage.won?.length || 0;
  const lostProposals = proposalsByStage.lost?.length || 0;

  // Calculate conversion rate
  const closedProposals = wonProposals + lostProposals;
  const conversionRate =
    closedProposals > 0 ? (wonProposals / closedProposals) * 100 : 0;

  // Calculate average deal size
  const averageDealSize = totalProposals > 0 ? totalValue / totalProposals : 0;

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Proposals Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Visual workflow of all proposals by sales stage
          </p>
        </div>
        <Button onClick={() => router.push("/proposal-hub/calculator")}>
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Proposals
              </p>
              <p className="text-2xl font-bold">{totalProposals}</p>
            </div>
            <FileText className="h-8 w-8 text-violet-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Active Pipeline
              </p>
              <p className="text-2xl font-bold">{activeProposals}</p>
              <p className="text-xs text-muted-foreground">in progress</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-bold">
                £{Math.round(totalValue).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
            <CircleDot className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Avg Deal Size
              </p>
              <p className="text-2xl font-bold">
                £{Math.round(averageDealSize).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {conversionRate.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {wonProposals} won, {lostProposals} lost
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(search || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter(undefined);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Kanban Board */}
      {totalProposals === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first proposal to get started
              </p>
              <Button onClick={() => router.push("/proposal-hub/calculator")}>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <SalesKanbanBoard proposalsByStage={proposalsByStage} />
      )}
    </div>
  );
}
