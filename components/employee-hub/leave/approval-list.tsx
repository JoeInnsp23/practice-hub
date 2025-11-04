"use client";

import * as Sentry from "@sentry/nextjs";
import {
  Calendar,
  CheckCircle,
  Clock,
  Gift,
  Heart,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string;
  leaveType: "annual_leave" | "sick_leave" | "toil" | "unpaid" | "other";
  startDate: string;
  endDate: string;
  daysCount: number;
  status: string;
  notes: string | null;
  requestedAt?: Date | string;
  reviewedBy: string | null;
  reviewedAt: Date | string | null;
  reviewerComments: string | null;
}

interface ApprovalListProps {
  requests: LeaveRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  showBulkActions?: boolean;
}

const leaveTypeConfig = {
  annual_leave: {
    label: "Annual Leave",
    icon: Calendar,
    className:
      "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  },
  sick_leave: {
    label: "Sick Leave",
    icon: Heart,
    className:
      "bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400",
  },
  toil: {
    label: "TOIL",
    icon: Clock,
    className:
      "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  },
  unpaid: {
    label: "Unpaid",
    icon: X,
    className: "bg-muted text-muted-foreground",
  },
  other: {
    label: "Other",
    icon: Gift,
    className:
      "bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400",
  },
};

// Helper to compute user initials from first and last name
function getUserInitials(
  firstName?: string,
  lastName?: string,
  email?: string,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "??";
}

export function ApprovalList({
  requests,
  onApprove,
  onReject,
  showBulkActions = false,
}: ApprovalListProps) {
  const utils = trpc.useUtils();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const approveMutation = trpc.leave.approve.useMutation();

  const rejectMutation = trpc.leave.reject.useMutation();

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to approve ${selectedIds.length} leave request(s)?`,
      )
    ) {
      try {
        await Promise.all(
          selectedIds.map((id) =>
            approveMutation.mutateAsync({ requestId: id }),
          ),
        );
        toast.success("Leave requests approved");
        utils.leave.getTeamLeave.invalidate();
        setSelectedIds([]);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "approve_leave" },
        });
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to approve leave requests",
        );
      }
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to reject ${selectedIds.length} leave request(s)?`,
      )
    ) {
      const reason = window.prompt(
        "Please provide a reason for rejection (required):",
      );
      if (reason) {
        try {
          await Promise.all(
            selectedIds.map((id) =>
              rejectMutation.mutateAsync({
                requestId: id,
                reviewerComments: reason,
              }),
            ),
          );
          toast.success("Leave requests rejected");
          utils.leave.getTeamLeave.invalidate();
          setSelectedIds([]);
        } catch (error) {
          Sentry.captureException(error, {
            tags: { operation: "reject_leave" },
          });
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to reject leave requests",
          );
        }
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const config =
      leaveTypeConfig[type as keyof typeof leaveTypeConfig] ||
      leaveTypeConfig.other;
    const Icon = config.icon;

    return (
      <Badge variant="secondary" className={cn(config.className)}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Pending Approvals
        </h3>
        <p className="text-muted-foreground">
          All leave requests have been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {showBulkActions && selectedIds.length > 0 && (
        <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={handleBulkApprove}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleBulkReject}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === requests.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <>
                <TableRow key={request.id} className="table-row">
                  {showBulkActions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(request.id)}
                        onCheckedChange={() => toggleSelection(request.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(
                            request.userFirstName ?? undefined,
                            request.userLastName ?? undefined,
                            request.userEmail,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {request.userName ||
                            `${request.userFirstName || ""} ${request.userLastName || ""}`.trim() ||
                            request.userEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.userEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(request.leaveType)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(request.startDate)} -{" "}
                      {formatDate(request.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{request.daysCount}</span>{" "}
                    {request.daysCount === 1 ? "day" : "days"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {request.requestedAt
                        ? formatRelativeTime(request.requestedAt)
                        : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => onApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => onReject(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
