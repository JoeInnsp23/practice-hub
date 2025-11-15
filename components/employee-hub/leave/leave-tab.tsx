"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Gift,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { LeaveBalanceWidget } from "@/components/employee-hub/leave/leave-balance-widget";
import { LeaveList } from "@/components/employee-hub/leave/leave-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaveRequest } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

interface LeaveTabProps {
  onRequestLeave: () => void;
  onEditRequest: (request: LeaveRequest) => void;
}

/**
 * LeaveTab - Employee leave request management with tabs
 *
 * Structure: Uses glass-table design pattern (no Card wrapper)
 * - Matches admin-hub/announcements pattern for consistency
 * - glass-table applied to overflow wrapper for proper table scrolling
 * - Filters (status and type) placed INSIDE glass-table as first row before table
 * - Search functionality removed - users filter by status and type only
 *
 * @param onRequestLeave - Callback to open the leave request modal
 * @param onEditRequest - Callback to edit an existing leave request
 */
export function LeaveTab({ onRequestLeave, onEditRequest }: LeaveTabProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch leave data
  const { data: balanceResponse, isLoading: balanceLoading } =
    trpc.leave.getBalance.useQuery({});
  const { data: historyResponse, isLoading: historyLoading } =
    trpc.leave.getHistory.useQuery({});
  const { data: teamLeaveResponse } = trpc.leave.getTeamLeave.useQuery({});

  // Extract and transform data from responses
  const balance = balanceResponse?.balance
    ? {
        entitlement: balanceResponse.balance.annualEntitlement,
        used: balanceResponse.balance.annualUsed,
        remaining: balanceResponse.annualRemaining,
        carriedOver: balanceResponse.balance.carriedOver,
        toilBalance: balanceResponse.balance.toilBalance,
        sickUsed: balanceResponse.balance.sickUsed,
      }
    : undefined;
  const leaveHistory = historyResponse?.requests ?? [];
  const teamLeave = teamLeaveResponse?.requests ?? [];

  // Calculate stats
  const stats = useMemo(() => {
    if (!leaveHistory || !balance) {
      return {
        pending: 0,
        approved: 0,
        remaining: 0,
        entitlement: 0,
        used: 0,
      };
    }

    const pendingCount = leaveHistory.filter(
      (r) => r.status === "pending",
    ).length;

    return {
      pending: pendingCount,
      remaining: balance.remaining,
      entitlement: balance.entitlement,
      used: balance.used,
    };
  }, [leaveHistory, balance]);

  // Filter leave history
  const filteredLeave = useMemo(() => {
    if (!leaveHistory) return [];

    return leaveHistory.filter((request) => {
      // Status filter
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && request.leaveType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [leaveHistory, statusFilter, typeFilter]);

  /**
   * Renders the filter row for status and type filtering.
   * This row appears inside the glass-table wrapper, above the LeaveList table.
   * Duplicated in both pending and history tabs for consistent UX.
   */
  const renderFilters = () => (
    <section
      className="p-4 border-b border-border bg-background/50"
      aria-label="Filter leave requests by status and type"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          name="statusFilter"
        >
          <SelectTrigger
            id="leave-status-filter"
            className="w-full sm:w-[200px]"
            aria-label="Filter leave requests by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
          name="typeFilter"
        >
          <SelectTrigger
            id="leave-type-filter"
            className="w-full sm:w-[200px]"
            aria-label="Filter leave requests by type"
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="annual_leave">Annual Leave</SelectItem>
            <SelectItem value="sick_leave">Sick Leave</SelectItem>
            <SelectItem value="toil">TOIL</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Annual Leave Remaining"
          value={`${stats.remaining} days`}
          icon={Calendar}
          loading={balanceLoading}
          iconColor="text-primary"
        />
        <KPIWidget
          title="Total Entitlement"
          value={`${stats.entitlement} days`}
          icon={Gift}
          loading={balanceLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Used This Year"
          value={`${stats.used} days`}
          icon={CheckCircle}
          loading={balanceLoading}
          iconColor="text-orange-600"
        />
        <KPIWidget
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
          loading={historyLoading}
          iconColor="text-yellow-600"
        />
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={onRequestLeave} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave History (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending (
                {filteredLeave.filter((r) => r.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="history">
                All History ({filteredLeave.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending tab with filters inside glass-table */}
            <TabsContent value="pending" className="mt-4">
              <div className="overflow-x-auto glass-table">
                {renderFilters()}
                <LeaveList
                  requests={
                    filteredLeave.filter((r) => r.status === "pending") || []
                  }
                  onEdit={onEditRequest}
                />
              </div>
            </TabsContent>

            {/* History tab with filters inside glass-table */}
            <TabsContent value="history" className="mt-4">
              <div className="overflow-x-auto glass-table">
                {renderFilters()}
                <LeaveList
                  requests={filteredLeave || []}
                  onEdit={onEditRequest}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Leave Balance Widget */}
          {balance ? (
            <LeaveBalanceWidget balance={balance} />
          ) : (
            <Card className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-20 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
            </Card>
          )}

          {/* Team Leave Summary */}
          {teamLeave && teamLeave.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Team on Leave
              </h3>
              <div className="space-y-3">
                {teamLeave.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="text-sm">
                    <div className="font-medium">{leave.userName}</div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(leave.startDate).toLocaleDateString()} -{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {teamLeave.length > 5 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    +{teamLeave.length - 5} more
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
