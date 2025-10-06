"use client";

import { format } from "date-fns";
import {
  Clock,
  Eye,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function LeadsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch leads
  const { data: leadsData, isLoading } = trpc.leads.list.useQuery({
    search: debouncedSearchTerm || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as
            | "new"
            | "contacted"
            | "qualified"
            | "proposal_sent"
            | "negotiating"
            | "converted"
            | "lost")
        : undefined,
  });

  const leads = leadsData?.leads || [];

  // Calculate KPIs
  const kpis = [
    {
      title: "Total Leads",
      value: leads.length.toString(),
      icon: Users,
      iconColor: "text-violet-600",
    },
    {
      title: "New",
      value: leads.filter((l) => l.status === "new").length.toString(),
      icon: Star,
      iconColor: "text-blue-600",
    },
    {
      title: "Qualified",
      value: leads.filter((l) => l.status === "qualified").length.toString(),
      icon: UserCheck,
      iconColor: "text-green-600",
    },
    {
      title: "Converted",
      value: leads.filter((l) => l.status === "converted").length.toString(),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
    },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage potential clients
          </p>
        </div>
        <Button onClick={() => router.push("/proposal-hub/leads/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Lead
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

      {/* Leads List */}
      <Card className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search leads..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {(searchTerm || statusFilter !== "all") && (
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
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Est. Turnover</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/proposal-hub/leads/new")}
                      >
                        Create your first lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() =>
                      router.push(`/proposal-hub/leads/${lead.id}`)
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.companyName || "—"}</p>
                        {lead.industry && (
                          <p className="text-xs text-muted-foreground">
                            {lead.industry}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{lead.source || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {lead.estimatedTurnover ? (
                        <span className="text-sm font-medium">
                          £{Number(lead.estimatedTurnover).toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.qualificationScore ? (
                        <div className="flex items-center gap-1">
                          <Star
                            className={`h-4 w-4 ${
                              lead.qualificationScore >= 7
                                ? "text-green-600 fill-green-600"
                                : lead.qualificationScore >= 4
                                  ? "text-yellow-600 fill-yellow-600"
                                  : "text-gray-400 fill-gray-400"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {lead.qualificationScore}/10
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.nextFollowUpAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {format(new Date(lead.nextFollowUpAt), "MMM d")}
                        </div>
                      ) : (
                        "—"
                      )}
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
                              router.push(`/proposal-hub/leads/${lead.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Send className="h-4 w-4 mr-2" />
                            Create Proposal
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
