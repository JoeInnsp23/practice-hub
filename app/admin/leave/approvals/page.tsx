"use client";

import * as Sentry from "@sentry/nextjs";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ApprovalActionsModal } from "@/components/admin/leave/approval-actions-modal";
import { ApprovalList } from "@/components/admin/leave/approval-list";
import { Card } from "@/components/ui/card";
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

interface SelectedRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  notes: string | null;
  balanceAfter: number;
}

export default function LeaveApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<SelectedRequest | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<"approve" | "reject">("approve");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch team leave requests
  const { data: teamLeave, isLoading } = trpc.leave.getTeamLeave.useQuery();
  const utils = trpc.useUtils();

  // Mutations for single approve/reject
  const approveMutation = trpc.leave.approve.useMutation({
    onSuccess: () => {
      toast.success("Leave request approved");
      utils.leave.getTeamLeave.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "approve_leave" },
      });
      toast.error(error.message || "Failed to approve leave request");
    },
  });

  const rejectMutation = trpc.leave.reject.useMutation({
    onSuccess: () => {
      toast.success("Leave request rejected");
      utils.leave.getTeamLeave.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "reject_leave" },
      });
      toast.error(error.message || "Failed to reject leave request");
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!teamLeave) {
      return {
        pending: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0,
        conflicts: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const pending = teamLeave.filter((r) => r.status === "pending").length;

    const approvedThisMonth = teamLeave.filter(
      (r) =>
        r.status === "approved" &&
        r.reviewedAt &&
        new Date(r.reviewedAt).getMonth() === currentMonth &&
        new Date(r.reviewedAt).getFullYear() === currentYear,
    ).length;

    const rejectedThisMonth = teamLeave.filter(
      (r) =>
        r.status === "rejected" &&
        r.reviewedAt &&
        new Date(r.reviewedAt).getMonth() === currentMonth &&
        new Date(r.reviewedAt).getFullYear() === currentYear,
    ).length;

    const conflicts = teamLeave.filter(
      (r) => r.status === "pending" && r.conflicts && r.conflicts.length > 0,
    ).length;

    return {
      pending,
      approvedThisMonth,
      rejectedThisMonth,
      conflicts,
    };
  }, [teamLeave]);

  // Filter leave requests
  const filteredRequests = useMemo(() => {
    if (!teamLeave) return [];

    return teamLeave.filter((request) => {
      // Type filter
      if (typeFilter !== "all" && request.leaveType !== typeFilter) {
        return false;
      }

      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
          request.userName.toLowerCase().includes(searchLower) ||
          request.userEmail.toLowerCase().includes(searchLower) ||
          request.notes?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [teamLeave, typeFilter, debouncedSearchTerm]);

  // Separate pending and processed requests
  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const processedRequests = filteredRequests.filter(
    (r) => r.status !== "pending",
  );

  const handleApprove = (requestId: string) => {
    const request = teamLeave?.find((r) => r.id === requestId);
    if (!request) return;

    setSelectedRequest({
      id: request.id,
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      daysCount: request.daysCount,
      notes: request.notes,
      balanceAfter: request.balanceAfter,
    });
    setModalAction("approve");
    setIsModalOpen(true);
  };

  const handleReject = (requestId: string) => {
    const request = teamLeave?.find((r) => r.id === requestId);
    if (!request) return;

    setSelectedRequest({
      id: request.id,
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      daysCount: request.daysCount,
      notes: request.notes,
      balanceAfter: request.balanceAfter,
    });
    setModalAction("reject");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leave Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve team leave requests
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Pending Approvals"
          value={stats.pending.toString()}
          icon={Clock}
          loading={isLoading}
          iconColor="text-yellow-600"
        />
        <KPIWidget
          title="Approved This Month"
          value={stats.approvedThisMonth.toString()}
          icon={CheckCircle}
          loading={isLoading}
          iconColor="text-green-600"
        />
        <KPIWidget
          title="Rejected This Month"
          value={stats.rejectedThisMonth.toString()}
          icon={XCircle}
          loading={isLoading}
          iconColor="text-red-600"
        />
        <KPIWidget
          title="Requests with Conflicts"
          value={stats.conflicts.toString()}
          icon={AlertTriangle}
          loading={isLoading}
          iconColor="text-orange-600"
        />
      </div>

      {/* Main Content */}
      <Card>
        <Tabs defaultValue="pending" className="w-full">
          <div className="px-6 pt-6 pb-4 border-b">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({processedRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by employee name, email, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
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

          <TabsContent value="pending" className="mt-0">
            <div className="overflow-x-auto">
              <ApprovalList
                requests={pendingRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                showBulkActions={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="processed" className="mt-0">
            <div className="overflow-x-auto">
              <ApprovalList
                requests={processedRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                showBulkActions={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Approval Actions Modal */}
      <ApprovalActionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        action={modalAction}
      />
    </div>
  );
}
