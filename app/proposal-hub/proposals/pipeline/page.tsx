"use client";

/**
 * Proposals Pipeline - Kanban Board View
 *
 * Features:
 * - Drag-and-drop proposals between sales stages
 * - Filter by assignee, date range, and value
 * - Real-time KPIs: total proposals, active pipeline, win rate
 * - Optimistic UI updates with automatic rollback on error
 * - Keyboard accessible with ARIA roles
 *
 * Sales Stages:
 * 1. Enquiry - Initial enquiries and interest
 * 2. Qualified - Qualified and ready for proposal
 * 3. Proposal Sent - Proposal sent to client
 * 4. Follow Up - Following up with client
 * 5. Won - Successfully won
 * 6. Lost - Lost to competition or declined
 * 7. Dormant - Inactive or expired
 *
 * Keyboard Navigation:
 * - Tab: Navigate between cards
 * - Enter/Space: Activate drag (use arrow keys to move)
 * - Escape: Cancel drag
 */

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
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
import { PipelineVelocityChart } from "@/components/proposal-hub/charts/pipeline-velocity-chart";
import { SalesKanbanBoard } from "@/components/proposal-hub/kanban/sales-kanban-board";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProposalsPipelinePage() {
  const router = useRouter();

  // Enhanced filter state
  const [filters, setFilters] = useState({
    search: "",
    assignedToId: undefined as string | undefined,
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    minValue: "",
    maxValue: "",
  });

  // Fetch proposals grouped by stage with new listByStage procedure
  const { data, isLoading } = trpc.proposals.listByStage.useQuery({
    search: filters.search || undefined,
    assignedToId: filters.assignedToId,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
    minValue: filters.minValue
      ? Number.parseFloat(filters.minValue)
      : undefined,
    maxValue: filters.maxValue
      ? Number.parseFloat(filters.maxValue)
      : undefined,
  });

  // Fetch team members for assignee filter
  const { data: usersData } = trpc.users.list.useQuery({});
  const users = usersData?.users || [];

  // Fetch pipeline velocity metrics
  const { data: velocityData } =
    trpc.analytics.getPipelineVelocityMetrics.useQuery({});

  const proposalsByStage = data?.proposalsByStage || {
    enquiry: [],
    qualified: [],
    proposal_sent: [],
    follow_up: [],
    won: [],
    lost: [],
    dormant: [],
  };

  const totalProposals = data?.totalProposals || 0;
  const totalValue = data?.totalPipelineValue || 0;

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

      {/* Enhanced Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Row 1: Search and Assigned To */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title, number, or client..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <Select
              value={filters.assignedToId}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  assignedToId: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Date Range and Value Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Created:
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom
                      ? format(filters.dateFrom, "PPP")
                      : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) =>
                      setFilters({ ...filters, dateFrom: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) =>
                      setFilters({ ...filters, dateTo: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Value Range */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Value:
              </span>
              <Input
                type="number"
                placeholder="Min £"
                value={filters.minValue}
                onChange={(e) =>
                  setFilters({ ...filters, minValue: e.target.value })
                }
                className="w-28"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max £"
                value={filters.maxValue}
                onChange={(e) =>
                  setFilters({ ...filters, maxValue: e.target.value })
                }
                className="w-28"
              />
            </div>

            {/* Clear Filters */}
            {(filters.search ||
              filters.assignedToId ||
              filters.dateFrom ||
              filters.dateTo ||
              filters.minValue ||
              filters.maxValue) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: "",
                    assignedToId: undefined,
                    dateFrom: undefined,
                    dateTo: undefined,
                    minValue: "",
                    maxValue: "",
                  })
                }
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
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
        <>
          <SalesKanbanBoard proposalsByStage={proposalsByStage} />
          <PipelineVelocityChart
            data={velocityData}
            isLoading={!velocityData}
          />
        </>
      )}
    </div>
  );
}
