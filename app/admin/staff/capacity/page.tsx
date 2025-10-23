"use client";

import { format } from "date-fns";
import { History, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CapacityFormDialog } from "@/components/admin/staff/capacity-form-dialog";
import { CapacityHistoryDialog } from "@/components/admin/staff/capacity-history-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

export default function StaffCapacityPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<any | null>(null);

  // Fetch all capacity records
  const { data, isLoading, refetch } = trpc.staffCapacity.list.useQuery({});

  // Fetch current utilization
  const { data: utilizationData } = trpc.staffCapacity.getUtilization.useQuery(
    {},
  );

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    setEditingCapacity(null);
    refetch();
  };

  const handleEdit = (capacity: any) => {
    setEditingCapacity(capacity);
    setShowCreateDialog(true);
  };

  const handleViewHistory = (userId: string) => {
    setSelectedUserId(userId);
    setShowHistoryDialog(true);
  };

  // Group capacity records by user (show only most recent per user)
  const latestCapacityPerUser = data?.capacityRecords.reduce(
    (acc, record) => {
      if (
        !acc[record.userId] ||
        record.effectiveFrom > acc[record.userId].effectiveFrom
      ) {
        acc[record.userId] = record;
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  const latestCapacities = latestCapacityPerUser
    ? Object.values(latestCapacityPerUser)
    : [];

  // Get utilization for display
  const utilizationMap = utilizationData?.utilization.reduce(
    (acc, util) => {
      acc[util.userId] = util;
      return acc;
    },
    {} as Record<string, any>,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Staff Capacity Planning
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage staff capacity and track utilization
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Capacity
          </Button>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Team Capacity Overview</CardTitle>
            <CardDescription>Current week utilization summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {utilizationData?.utilization.reduce(
                    (sum, u) => sum + u.weeklyHours,
                    0,
                  ) ?? 0}{" "}
                  hrs/week
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Actual Hours</p>
                <p className="text-2xl font-bold">
                  {utilizationData?.utilization
                    .reduce((sum, u) => sum + u.actualHours, 0)
                    .toFixed(1) ?? 0}{" "}
                  hrs
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Team Utilization
                </p>
                <p className="text-2xl font-bold">
                  {utilizationData?.utilization.length
                    ? (
                        (utilizationData.utilization.reduce(
                          (sum, u) => sum + u.actualHours,
                          0,
                        ) /
                          utilizationData.utilization.reduce(
                            (sum, u) => sum + u.weeklyHours,
                            0,
                          )) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Staff Count</p>
                <p className="text-2xl font-bold">
                  {utilizationData?.utilization.length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Staff Capacity</CardTitle>
            <CardDescription>
              Active capacity records for all staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Weekly Hours</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-16 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : latestCapacities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No capacity records found. Add capacity records for
                          your staff.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestCapacities.map((capacity) => {
                      const utilization = utilizationMap?.[capacity.userId];
                      return (
                        <TableRow key={capacity.id}>
                          <TableCell className="font-medium">
                            {capacity.userName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {capacity.userEmail}
                          </TableCell>
                          <TableCell>{capacity.weeklyHours} hrs/week</TableCell>
                          <TableCell>
                            {format(
                              new Date(capacity.effectiveFrom),
                              "MMM d, yyyy",
                            )}
                          </TableCell>
                          <TableCell>
                            {utilization ? (
                              <span className="font-semibold">
                                {utilization.utilizationPercent.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {utilization ? (
                              <Badge
                                variant={
                                  utilization.status === "overallocated"
                                    ? "destructive"
                                    : utilization.status === "underutilized"
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {utilization.status === "overallocated"
                                  ? "Over 100%"
                                  : utilization.status === "underutilized"
                                    ? "< 75%"
                                    : "Optimal"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Data</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewHistory(capacity.userId)
                                }
                              >
                                <History className="h-4 w-4 mr-1" />
                                History
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(capacity)}
                              >
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CapacityFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingCapacity(null);
        }}
        capacity={editingCapacity}
        onSuccess={handleCreateSuccess}
      />

      {selectedUserId && (
        <CapacityHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          userId={selectedUserId}
        />
      )}
    </div>
  );
}
