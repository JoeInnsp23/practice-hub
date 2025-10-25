"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Gift,
  Heart,
  Info,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateWorkingDays } from "@/lib/leave/working-days";

const leaveRequestSchema = z
  .object({
    leaveType: z.enum([
      "annual_leave",
      "sick_leave",
      "toil",
      "unpaid",
      "other",
    ]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    {
      message: "Cannot request leave for past dates",
      path: ["startDate"],
    },
  );

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    status: string;
    notes: string | null;
    requestedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewerComments: string | null;
    reviewerName?: string | null;
  } | null;
  balance?: {
    entitlement: number;
    used: number;
    remaining: number;
    carriedOver: number;
    toilBalance: number;
    sickUsed: number;
  };
}

const leaveTypeOptions = [
  {
    value: "annual_leave",
    label: "Annual Leave",
    icon: Calendar,
    color: "text-green-600",
  },
  {
    value: "sick_leave",
    label: "Sick Leave",
    icon: Heart,
    color: "text-red-600",
  },
  {
    value: "toil",
    label: "TOIL",
    icon: Clock,
    color: "text-blue-600",
  },
  {
    value: "unpaid",
    label: "Unpaid Leave",
    icon: X,
    color: "text-muted-foreground",
  },
  {
    value: "other",
    label: "Other",
    icon: Gift,
    color: "text-purple-600",
  },
];

export function LeaveRequestModal({
  isOpen,
  onClose,
  request,
  balance,
}: LeaveRequestModalProps) {
  const utils = trpc.useUtils();
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const form = useForm<LeaveRequestFormValues, any, LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType:
        (request?.leaveType as LeaveRequestFormValues["leaveType"]) ||
        "annual_leave",
      startDate: request?.startDate || "",
      endDate: request?.endDate || "",
      notes: request?.notes || "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const leaveType = form.watch("leaveType");

  // Calculate working days whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end >= start) {
          const days = calculateWorkingDays(start, end);
          setCalculatedDays(days);
        } else {
          setCalculatedDays(0);
        }
      } catch (_error) {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  // Check for conflicts
  const { data: conflictsResponse } = trpc.leave.getConflicts.useQuery(
    {
      startDate: startDate || "",
      endDate: endDate || "",
    },
    {
      enabled: !!(startDate && endDate),
    },
  );
  const conflicts = conflictsResponse?.conflicts ?? [];

  // Balance validation
  const hasInsufficientBalance = useMemo(() => {
    if (leaveType === "annual_leave" && balance) {
      return calculatedDays > balance.remaining;
    }
    if (leaveType === "toil" && balance) {
      return calculatedDays > balance.toilBalance;
    }
    return false;
  }, [leaveType, calculatedDays, balance]);

  const requestMutation = trpc.leave.request.useMutation();

  const onSubmit = async (data: LeaveRequestFormValues) => {
    if (hasInsufficientBalance) {
      toast.error("Insufficient leave balance");
      return;
    }

    try {
      await requestMutation.mutateAsync({
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      });
      toast.success("Leave request submitted successfully");
      utils.leave.getHistory.invalidate();
      utils.leave.getBalance.invalidate();
      utils.leave.getCalendar.invalidate();
      onClose();
      form.reset();
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { operation: "leave_request" },
        extra: {
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });
      toast.error(error.message || "Failed to submit leave request");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setCalculatedDays(0);
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {request ? "Edit Leave Request" : "Request Leave"}
          </DialogTitle>
          <DialogDescription>
            {request
              ? "Modify your leave request details"
              : "Submit a new leave request for approval"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Leave Type */}
            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={
                          startDate || new Date().toISOString().split("T")[0]
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Working Days Calculation */}
            {calculatedDays > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Working days:
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-base font-semibold"
                  >
                    {calculatedDays} {calculatedDays === 1 ? "day" : "days"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Excluding weekends and bank holidays
                </p>
              </div>
            )}

            {/* Balance Warning */}
            {hasInsufficientBalance && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Insufficient Leave Balance</AlertTitle>
                <AlertDescription>
                  {leaveType === "annual_leave" && balance && (
                    <>
                      You have {balance.remaining} days remaining but are
                      requesting {calculatedDays} days.
                    </>
                  )}
                  {leaveType === "toil" && balance && (
                    <>
                      You have {balance.toilBalance} TOIL days available but are
                      requesting {calculatedDays} days.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Conflict Warning */}
            {conflicts && conflicts.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Overlapping Leave Detected</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    The following team members have leave during this period:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((conflict) => (
                      <li key={conflict.id} className="text-sm">
                        <strong>{conflict.userName}</strong> -{" "}
                        {new Date(conflict.startDate).toLocaleDateString()} to{" "}
                        {new Date(conflict.endDate).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about your leave request..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any relevant details or context for your request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={requestMutation.isPending || hasInsufficientBalance}
              >
                {requestMutation.isPending
                  ? "Submitting..."
                  : request
                    ? "Update Request"
                    : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
