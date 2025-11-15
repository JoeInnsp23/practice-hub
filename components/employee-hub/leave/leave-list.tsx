"use client";

import * as Sentry from "@sentry/nextjs";
import {
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Gift,
  Heart,
  MoreHorizontal,
  Pencil,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaveRequest } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";

interface LeaveListProps {
  requests: LeaveRequest[];
  onEdit?: (request: LeaveRequest) => void;
  onView?: (request: LeaveRequest) => void;
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

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className:
      "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * LeaveList - Table component displaying leave requests
 *
 * Renders a Table as the root element (no glass-table wrapper).
 * The parent component (LeaveTab) applies the glass-table class
 * to the overflow wrapper for consistent styling across the app.
 *
 * @param requests - Array of leave requests to display
 * @param onEdit - Optional callback to edit a request (only for pending requests)
 * @param onView - Optional callback to view request details
 */
export function LeaveList({ requests, onEdit, onView }: LeaveListProps) {
  const utils = trpc.useUtils();

  const cancelMutation = trpc.leave.cancel.useMutation();

  const handleCancel = async (request: LeaveRequest) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this leave request? This action cannot be undone.",
      )
    ) {
      try {
        await cancelMutation.mutateAsync({ requestId: request.id });
        toast.success("Leave request cancelled");
        utils.leave.getHistory.invalidate();
        utils.leave.getBalance.invalidate();
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "cancel_leave" },
        });
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to cancel leave request",
        );
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

  const getStatusBadge = (status: string) => {
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Leave Requests
        </h3>
        <p className="text-muted-foreground">
          You haven't made any leave requests yet.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead>Reviewed By</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id} className="table-row">
            <TableCell>{getTypeBadge(request.leaveType)}</TableCell>
            <TableCell>
              <div className="text-sm">
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </div>
            </TableCell>
            <TableCell>
              <span className="font-medium">{request.daysCount}</span>{" "}
              {request.daysCount === 1 ? "day" : "days"}
            </TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {formatDate(request.requestedAt)}
              </div>
            </TableCell>
            <TableCell>
              {request.reviewerName ? (
                <div className="text-sm">{request.reviewerName}</div>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {request.status === "pending" && onEdit && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(request)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {(request.status === "pending" ||
                    request.status === "approved") && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleCancel(request)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Request
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
