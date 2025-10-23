"use client";

import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MoreVertical,
  Plus,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/lib/hooks/use-debounce";

type StatusBadgeConfig = {
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string;
};

export default function ProposalsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [salesStageFilter, setSalesStageFilter] = useState("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const utils = trpc.useUtils();

  // Fetch proposals
  const { data: proposalsData, isLoading } = trpc.proposals.list.useQuery({
    search: debouncedSearchTerm || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as
            | "draft"
            | "sent"
            | "viewed"
            | "signed"
            | "rejected"
            | "expired")
        : undefined,
    salesStage:
      salesStageFilter !== "all"
        ? (salesStageFilter as
            | "enquiry"
            | "qualified"
            | "proposal_sent"
            | "follow_up"
            | "won"
            | "lost"
            | "dormant")
        : undefined,
  });

  const proposals = proposalsData?.proposals || [];

  // Archive proposal mutation
  const { mutate: archiveProposal } = trpc.proposals.delete.useMutation({
    onSuccess: () => {
      toast.success("Proposal archived successfully");
      utils.proposals.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive proposal");
    },
  });

  // Calculate KPIs
  const kpis = [
    {
      title: "Total Proposals",
      value: proposals.length.toString(),
      icon: FileText,
      iconColor: "text-violet-600",
    },
    {
      title: "Draft",
      value: proposals.filter((p) => p.status === "draft").length.toString(),
      icon: Clock,
      iconColor: "text-slate-600",
    },
    {
      title: "Sent",
      value: proposals.filter((p) => p.status === "sent").length.toString(),
      icon: Send,
      iconColor: "text-blue-600",
    },
    {
      title: "Signed",
      value: proposals.filter((p) => p.status === "signed").length.toString(),
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSalesStageFilter("all");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, StatusBadgeConfig> = {
      draft: { variant: "secondary", color: "text-slate-600" },
      sent: { variant: "default", color: "text-blue-600" },
      viewed: { variant: "default", color: "text-indigo-600" },
      signed: { variant: "default", color: "text-green-600" },
      rejected: { variant: "destructive", color: "text-red-600" },
      expired: { variant: "outline", color: "text-orange-600" },
      archived: { variant: "outline", color: "text-muted-foreground" },
    };

    const config = variants[status] || variants.draft;

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSalesStageBadge = (salesStage: string) => {
    const variants: Record<string, StatusBadgeConfig> = {
      enquiry: { variant: "secondary", color: "text-slate-600" },
      qualified: { variant: "default", color: "text-purple-600" },
      proposal_sent: { variant: "default", color: "text-amber-600" },
      follow_up: { variant: "default", color: "text-blue-600" },
      won: { variant: "default", color: "text-green-600" },
      lost: { variant: "destructive", color: "text-red-600" },
      dormant: { variant: "outline", color: "text-orange-600" },
    };

    const config = variants[salesStage] || variants.enquiry;

    return (
      <Badge variant={config.variant} className={config.color}>
        {salesStage
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
          <p className="text-muted-foreground mt-2">
            Manage client proposals and quotes
          </p>
        </div>
        <Button onClick={() => router.push("/proposal-hub/calculator")}>
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIWidget
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      {/* Proposals List */}
      <Card className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Sales Stage Filter */}
            <Select
              value={salesStageFilter}
              onValueChange={setSalesStageFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sales Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Stages</SelectItem>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="dormant">Dormant</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {(searchTerm ||
              statusFilter !== "all" ||
              salesStageFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                className="h-10 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sales Stage</TableHead>
                <TableHead>Pricing Model</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Annual</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading proposals...
                  </TableCell>
                </TableRow>
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No proposals found
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/proposal-hub/calculator")}
                      >
                        Create your first proposal
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
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
                    <TableCell>{proposal.clientName || "—"}</TableCell>
                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                    <TableCell>
                      {getSalesStageBadge(proposal.salesStage)}
                    </TableCell>
                    <TableCell>
                      {proposal.pricingModelUsed ? (
                        <Badge variant="outline">
                          Model {proposal.pricingModelUsed}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      £{Number(proposal.monthlyTotal).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      £{Number(proposal.annualTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {proposal.validUntil
                        ? format(new Date(proposal.validUntil), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/proposal-hub/proposals/${proposal.id}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Send className="h-4 w-4 mr-2" />
                            Send to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  `Are you sure you want to archive "${proposal.title}"?`,
                                )
                              ) {
                                archiveProposal(proposal.id);
                              }
                            }}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
