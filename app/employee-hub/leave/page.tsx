"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Gift,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { LeaveBalanceWidget } from "@/components/employee-hub/leave/leave-balance-widget";
import { LeaveList } from "@/components/employee-hub/leave/leave-list";
import { LeaveRequestModal } from "@/components/employee-hub/leave/leave-request-modal";
import { ToilBalanceWidget } from "@/components/employee-hub/toil/toil-balance-widget";
import { ToilHistoryTable } from "@/components/employee-hub/toil/toil-history-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { LeaveRequest } from "@/lib/trpc/types";

export default function LeavePage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  // Fetch TOIL data
  const { data: toilBalance } = trpc.toil.getBalance.useQuery({});
  const { data: toilHistoryResponse } = trpc.toil.getHistory.useQuery({});
  const { data: expiringToil } = trpc.toil.getExpiringToil.useQuery({});

  // Extract TOIL history
  const toilHistory = toilHistoryResponse?.history ?? [];

  // Calculate stats
  const stats = useMemo(() => {
    if (!leaveHistory || !balance) {
      return {
        pending: 0,
        approved: 0,
        remaining: 0,
      };
    }

    const pendingCount = leaveHistory.filter(
      (r) => r.status === "pending",
    ).length;
    const approvedThisYear = leaveHistory.filter(
      (r) =>
        r.status === "approved" &&
        new Date(r.startDate).getFullYear() === new Date().getFullYear(),
    ).length;

    return {
      pending: pendingCount,
      approved: approvedThisYear,
      remaining: balance?.remaining ?? 0,
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

      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
          request.notes?.toLowerCase().includes(searchLower) ||
          request.reviewerComments?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [leaveHistory, statusFilter, typeFilter, debouncedSearchTerm]);

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setIsRequestModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRequestModalOpen(false);
    setEditingRequest(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Leave Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Request and manage your leave
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRequest(null);
            setIsRequestModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Annual Leave Remaining"
          value={balance ? `${balance.remaining} days` : "Loading..."}
          icon={Calendar}
          loading={balanceLoading}
          iconColor="text-emerald-600"
        />
        <KPIWidget
          title="Total Entitlement"
          value={balance ? `${balance.entitlement} days` : "Loading..."}
          icon={Gift}
          loading={balanceLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Used This Year"
          value={balance ? `${balance.used} days` : "Loading..."}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave List - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultValue="my-leave" className="w-full">
              <div className="px-6 pt-6 pb-4 border-b">
                <TabsList className="mb-4">
                  <TabsTrigger value="my-leave">My Leave</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search leave requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="annual_leave">Annual Leave</SelectItem>
                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                      <SelectItem value="toil">TOIL</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="my-leave" className="mt-0">
                <div className="overflow-x-auto">
                  <LeaveList
                    requests={
                      filteredLeave.filter((r) => r.status === "pending") || []
                    }
                    onEdit={handleEditRequest}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="overflow-x-auto">
                  <LeaveList requests={filteredLeave || []} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar - Balance Widgets */}
        <div className="lg:col-span-1 space-y-6">
          {balance ? (
            <LeaveBalanceWidget balance={balance} />
          ) : (
            <Card className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </Card>
          )}

          {/* TOIL Balance Widget */}
          {toilBalance && expiringToil && (
            <ToilBalanceWidget
              balance={{
                totalHours: toilBalance.balance,
                totalDays: Number.parseFloat(toilBalance.balanceInDays),
                expiringHours: expiringToil.totalExpiringHours,
                expiringDays: Number.parseFloat(expiringToil.totalExpiringDays),
                expiryDate:
                  expiringToil.expiringToil.length > 0
                    ? expiringToil.expiringToil[0].expiryDate
                    : null,
              }}
            />
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

      {/* TOIL History Section */}
      {toilHistory && toilHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              TOIL Accrual History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToilHistoryTable history={toilHistory} />
          </CardContent>
        </Card>
      )}

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isRequestModalOpen}
        onClose={handleCloseModal}
        request={editingRequest}
        balance={balance}
      />
    </div>
  );
}
