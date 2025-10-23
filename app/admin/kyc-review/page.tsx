"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminKYCReviewPage() {
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "completed" | undefined
  >(undefined);

  // Get verification list
  const { data, isLoading, refetch } =
    trpc.adminKyc.listPendingReviews.useQuery({
      status: statusFilter,
      limit: 50,
      offset: 0,
    });

  // Get statistics
  const { data: stats } = trpc.adminKyc.getReviewStats.useQuery();

  const getStatusBadge = (
    outcome?: string | null,
    amlStatus?: string | null,
  ) => {
    if (outcome === "pass" && amlStatus === "clear") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Pass
        </Badge>
      );
    } else if (outcome === "fail") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Fail
        </Badge>
      );
    } else if (amlStatus === "match" || amlStatus === "pep") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Review Required
        </Badge>
      );
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getRiskIndicators = (verification: any) => {
    const indicators = [];

    if (verification.pepMatch) {
      indicators.push(
        <Badge key="pep" variant="destructive" className="text-xs">
          PEP
        </Badge>,
      );
    }

    if (verification.sanctionsMatch) {
      indicators.push(
        <Badge key="sanctions" variant="destructive" className="text-xs">
          Sanctions
        </Badge>,
      );
    }

    if (verification.watchlistMatch) {
      indicators.push(
        <Badge key="watchlist" variant="destructive" className="text-xs">
          Watchlist
        </Badge>,
      );
    }

    if (verification.adverseMediaMatch) {
      indicators.push(
        <Badge key="media" variant="destructive" className="text-xs">
          Adverse Media
        </Badge>,
      );
    }

    return indicators;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">KYC Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve identity verifications requiring manual review
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <ShieldAlert className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Auto-Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.autoApproved}</div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Manually Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {stats.manuallyApproved}
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {stats.pepMatches + stats.sanctionMatches}
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Verification List */}
      <Card>
        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Indicators</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.verifications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No verifications found
                  </TableCell>
                </TableRow>
              ) : (
                data?.verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {verification.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {verification.clientCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {verification.clientEmail}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {verification.documentVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm capitalize">
                          {verification.documentType?.replace("_", " ") ||
                            "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        verification.outcome,
                        verification.amlStatus,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {getRiskIndicators(verification)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(verification.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/kyc-review/${verification.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination info */}
      {data && data.total > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {data.verifications.length} of {data.total} verifications
        </div>
      )}
    </div>
  );
}
