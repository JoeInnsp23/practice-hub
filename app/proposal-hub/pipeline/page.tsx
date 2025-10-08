"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  DollarSign,
  Plus,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KanbanBoard } from "@/components/proposal-hub/kanban/kanban-board";
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

export default function PipelinePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState<
    string | undefined
  >();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");

  // Fetch deals (leads + proposals)
  const { data: dealsData, isLoading } = trpc.pipeline.getDeals.useQuery({
    search,
    assignedToId: assignedToFilter,
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
    minValue: minValue ? Number.parseFloat(minValue) : undefined,
    maxValue: maxValue ? Number.parseFloat(maxValue) : undefined,
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
        <div className="space-y-4">
          {/* Row 1: Search and Assigned To */}
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
                    {dateFrom ? format(dateFrom, "PPP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
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
                    {dateTo ? format(dateTo, "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
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
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                className="w-28"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max £"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="w-28"
              />
            </div>

            {/* Clear Filters Button */}
            {(search ||
              assignedToFilter ||
              dateFrom ||
              dateTo ||
              minValue ||
              maxValue) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setAssignedToFilter(undefined);
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setMinValue("");
                  setMaxValue("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
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
