"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { Calendar, CheckCircle, User, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils/format";

const approvalSchema = z.object({
  comments: z.string().optional(),
});

const rejectionSchema = z.object({
  comments: z.string().min(1, "Please provide a reason for rejection"),
});

interface ApprovalActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    notes: string | null;
  } | null;
  action: "approve" | "reject";
}

const leaveTypeLabels: Record<string, string> = {
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
  toil: "TOIL",
  unpaid: "Unpaid Leave",
  other: "Other",
};

export function ApprovalActionsModal({
  isOpen,
  onClose,
  request,
  action,
}: ApprovalActionsModalProps) {
  const utils = trpc.useUtils();

  const form = useForm<{ comments?: string }>({
    resolver: zodResolver(
      action === "approve" ? approvalSchema : rejectionSchema,
    ),
    defaultValues: {
      comments: "",
    },
  });

  const approveMutation = trpc.leave.approve.useMutation();

  const rejectMutation = trpc.leave.reject.useMutation();

  const onSubmit = async (data: { comments?: string }) => {
    if (!request) return;

    try {
      if (action === "approve") {
        await approveMutation.mutateAsync({
          requestId: request.id,
          reviewerComments: data.comments,
        });
        toast.success("Leave request approved successfully");
      } else {
        await rejectMutation.mutateAsync({
          requestId: request.id,
          reviewerComments: data.comments || "",
        });
        toast.success("Leave request rejected");
      }
      utils.leave.getTeamLeave.invalidate();
      onClose();
      form.reset();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: action === "approve" ? "approve_leave" : "reject_leave",
        },
        extra: { requestId: request?.id },
      });
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${action === "approve" ? "approve" : "reject"} leave request`,
      );
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!request) return null;

  const isApprove = action === "approve";
  const Icon = isApprove ? CheckCircle : XCircle;
  const iconColor = isApprove ? "text-green-600" : "text-red-600";
  const buttonColor = isApprove
    ? "border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
    : "border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {isApprove ? "Approve" : "Reject"} Leave Request
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "Confirm approval of this leave request"
              : "Provide a reason for rejecting this leave request"}
          </DialogDescription>
        </DialogHeader>

        {/* Request Details */}
        <div className="space-y-4 py-4">
          <div className="glass-card p-4 space-y-3">
            {/* Employee Info */}
            <div className="flex items-center gap-3 pb-3 border-b">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{request.userName}</div>
                <div className="text-sm text-muted-foreground">
                  {request.userEmail}
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Type</div>
                <Badge variant="secondary">
                  {leaveTypeLabels[request.leaveType] || request.leaveType}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Duration
                </div>
                <div className="font-medium">
                  {request.daysCount} {request.daysCount === 1 ? "day" : "days"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Dates</div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(request.startDate)} -{" "}
                  {formatDate(request.endDate)}
                </div>
              </div>
            </div>

            {/* Employee Notes */}
            {request.notes && (
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-1">
                  Employee Notes
                </div>
                <p className="text-sm">{request.notes}</p>
              </div>
            )}
          </div>

          {/* Comments Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isApprove
                        ? "Comments (Optional)"
                        : "Rejection Reason (Required)"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          isApprove
                            ? "Add any comments for the employee..."
                            : "Explain why this request is being rejected..."
                        }
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isApprove
                        ? "Optional notes that will be visible to the employee"
                        : "This reason will be sent to the employee"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className={buttonColor}
                  disabled={
                    approveMutation.isPending || rejectMutation.isPending
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {approveMutation.isPending || rejectMutation.isPending
                    ? "Processing..."
                    : isApprove
                      ? "Approve Request"
                      : "Reject Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
