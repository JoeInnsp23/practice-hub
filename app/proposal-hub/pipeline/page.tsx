"use client";

import { DollarSign, Plus, Target, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KanbanBoard } from "@/components/proposal-hub/kanban/kanban-board";
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

export default function PipelinePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState<
    string | undefined
  >();

  // Fetch deals (leads + proposals)
  const { data: dealsData, isLoading } = trpc.pipeline.getDeals.useQuery({
    search,
    assignedToId: assignedToFilter,
  });

  // Fetch team members for filter
  const { data: usersData } = trpc.users.list.useQuery({});
  const users = usersData?.users || [];

  const dealsByStage = dealsData?.dealsByStage || {
    new: [],
    contacted: [],
    qualified: [],
    proposal_sent: [],
    negotiating: [],
    converted: [],
    lost: [],
  };

  const totalDeals = dealsData?.totalDeals || 0;
  const totalValue = dealsData?.totalValue || 0;

  // Calculate active pipeline (non-terminal stages)
  const activeDeals =
    (dealsByStage.new?.length || 0) +
    (dealsByStage.contacted?.length || 0) +
    (dealsByStage.qualified?.length || 0) +
    (dealsByStage.proposal_sent?.length || 0) +
    (dealsByStage.negotiating?.length || 0);

  const convertedDeals = dealsByStage.converted?.length || 0;
  const lostDeals = dealsByStage.lost?.length || 0;

  // Calculate conversion rate
  const closedDeals = convertedDeals + lostDeals;
  const conversionRate =
    closedDeals > 0 ? (convertedDeals / closedDeals) * 100 : 0;

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
          <h1 className="text-3xl font-bold text-foreground">Pipeline & CRM</h1>
          <p className="text-muted-foreground mt-2">
            Visual workflow of all leads and proposals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/proposal-hub/leads/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
          <Button onClick={() => router.push("/proposal-hub/calculator")}>
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Deals</p>
              <p className="text-2xl font-bold">{totalDeals}</p>
            </div>
            <Users className="h-8 w-8 text-slate-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Active Pipeline
              </p>
              <p className="text-2xl font-bold">{activeDeals}</p>
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
              <p className="text-xs text-muted-foreground">estimated</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Conversion Rate
              </p>
              <p className="text-2xl font-bold text-green-600">
                {conversionRate.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {convertedDeals} won, {lostDeals} lost
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
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={assignedToFilter}
            onValueChange={(value) =>
              setAssignedToFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All team members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team members</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Kanban Board */}
      {totalDeals === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4">
            <Target className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first lead or proposal to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/proposal-hub/leads/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Lead
                </Button>
                <Button onClick={() => router.push("/proposal-hub/calculator")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <KanbanBoard dealsByStage={dealsByStage} />
      )}
    </div>
  );
}
