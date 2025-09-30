"use client";

import {
  Calculator,
  CheckCircle,
  FileText,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ProposalHubPage() {
  const router = useRouter();

  // Fetch proposals
  const { data: proposalsData } = trpc.proposals.list.useQuery({});
  const proposals = proposalsData?.proposals || [];

  // Fetch proposal stats
  const { data: statsData } = trpc.proposals.getStats.useQuery();
  const stats = statsData?.stats || [];

  // Calculate metrics
  const draftCount = stats.find((s) => s.status === "draft")?.count || 0;
  const sentCount = stats.find((s) => s.status === "sent")?.count || 0;
  const signedCount = stats.find((s) => s.status === "signed")?.count || 0;
  const totalValue =
    stats
      .filter((s) => s.status === "sent" || s.status === "viewed")
      .reduce((sum, s) => sum + Number(s.totalValue || 0), 0) || 0;

  const kpis = [
    {
      title: "Draft Proposals",
      value: draftCount.toString(),
      icon: FileText,
      iconColor: "text-slate-600",
    },
    {
      title: "Sent Proposals",
      value: sentCount.toString(),
      icon: TrendingUp,
      iconColor: "text-blue-600",
    },
    {
      title: "Signed This Month",
      value: signedCount.toString(),
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      title: "Pipeline Value",
      value: `£${(totalValue / 12).toFixed(0)}`,
      icon: TrendingUp,
      iconColor: "text-violet-600",
      subtitle: "/month",
    },
  ];

  // Get recent proposals (last 5)
  const recentProposals = proposals
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposal Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage leads, quotes, and client proposals
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
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => router.push("/proposal-hub/calculator")}
          >
            <Calculator className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-medium">Pricing Calculator</p>
              <p className="text-xs text-muted-foreground">
                Calculate pricing for new clients
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => router.push("/proposal-hub/proposals")}
          >
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-medium">View Proposals</p>
              <p className="text-xs text-muted-foreground">
                Manage all proposals
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => router.push("/proposal-hub/leads")}
          >
            <Users className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-medium">Leads</p>
              <p className="text-xs text-muted-foreground">
                Track and manage leads
              </p>
            </div>
          </Button>
        </div>
      </Card>

      {/* Recent Proposals */}
      <Card className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Proposals</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/proposal-hub/proposals")}
          >
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No proposals yet
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
                recentProposals.map((proposal) => (
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
                    <TableCell className="text-right font-medium">
                      £{Number(proposal.monthlyTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(proposal.createdAt), "MMM d, yyyy")}
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
