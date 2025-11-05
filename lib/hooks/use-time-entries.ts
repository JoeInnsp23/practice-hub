"use client";

import { format } from "date-fns";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { useSession } from "@/lib/auth-client";

export interface TimeEntry {
  id: string;
  date: Date;
  client?: string;
  clientId?: string;
  task?: string;
  taskId?: string;
  description?: string;
  hours: number;
  billable: boolean;
  billed: boolean;
  status?: "draft" | "submitted" | "approved" | "rejected";
  userId?: string;
  user?: string;
  workType?: string;
  startTime?: string;
  endTime?: string;
}

export interface TimeEntryInput {
  date: Date;
  clientId?: string;
  taskId?: string;
  description?: string;
  hours: number;
  billable: boolean;
  workType?: string;
  startTime?: string;
  endTime?: string;
}

// Hook to fetch time entries
export function useTimeEntries(
  startDate?: string,
  endDate?: string,
  _refreshKey?: number,
  selectedUserId?: string, // Optional: for admin to view specific user's timesheets
) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data, isLoading, error } = trpc.timesheets.list.useQuery(
    {
      startDate,
      endDate,
      userId: selectedUserId ?? currentUserId,
    },
    {
      enabled: !!currentUserId,
    },
  );

  // Transform tRPC response to match our interface
  // Note: The router returns raw database rows without joins, so clientName, taskTitle, userName are not available
  const entries: TimeEntry[] =
    data?.timeEntries.map((e) => ({
      id: e.id,
      date: new Date(e.date),
      client: undefined, // Not available from router - would need to join clients table
      clientId: e.clientId || undefined,
      task: undefined, // Not available from router - would need to join tasks table
      taskId: e.taskId || undefined,
      description: e.description || undefined,
      hours: Number(e.hours),
      billable: e.billable || false,
      billed: e.billed || false,
      status: e.status || undefined,
      userId: e.userId || undefined,
      user: undefined, // Not available from router - would need to join users table
      workType: e.workType || undefined,
      startTime: e.startTime || undefined,
      endTime: e.endTime || undefined,
    })) || [];

  return {
    data: entries,
    isLoading,
    error: error
      ? error instanceof Error
        ? error
        : new Error(String(error))
      : null,
  };
}

// Hook to create a time entry
export function useCreateTimeEntry() {
  const utils = trpc.useUtils();

  const mutation = trpc.timesheets.create.useMutation({
    onSuccess: () => {
      toast.success("Time entry created");
      // Invalidate and refetch time entries
      utils.timesheets.list.invalidate();
      utils.timesheets.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create time entry");
    },
  });

  const mutateAsync = async (entry: TimeEntryInput) => {
    return mutation.mutateAsync({
      date: format(entry.date, "yyyy-MM-dd"),
      clientId: entry.clientId,
      taskId: entry.taskId,
      description: entry.description,
      hours: entry.hours.toString(),
      billable: entry.billable,
      workType: entry.workType,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
  };

  return { mutateAsync, isLoading: mutation.isPending };
}

// Hook to update a time entry
export function useUpdateTimeEntry() {
  const utils = trpc.useUtils();

  const mutation = trpc.timesheets.update.useMutation({
    onSuccess: () => {
      toast.success("Time entry updated");
      // Invalidate and refetch time entries
      utils.timesheets.list.invalidate();
      utils.timesheets.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update time entry");
    },
  });

  const mutateAsync = async (id: string, updates: Partial<TimeEntry>) => {
    const updateData: Record<string, unknown> = {};

    if (updates.date !== undefined) {
      updateData.date = format(updates.date, "yyyy-MM-dd");
    }
    if (updates.clientId !== undefined) {
      updateData.clientId = updates.clientId;
    }
    if (updates.taskId !== undefined) {
      updateData.taskId = updates.taskId;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.hours !== undefined) {
      updateData.hours = updates.hours.toString();
    }
    if (updates.billable !== undefined) {
      updateData.billable = updates.billable;
    }
    if (updates.workType !== undefined) {
      updateData.workType = updates.workType;
    }
    if (updates.startTime !== undefined) {
      updateData.startTime = updates.startTime;
    }
    if (updates.endTime !== undefined) {
      updateData.endTime = updates.endTime;
    }

    return mutation.mutateAsync({
      id,
      data: updateData,
    });
  };

  return { mutateAsync, isLoading: mutation.isPending };
}

// Hook to delete a time entry
export function useDeleteTimeEntry() {
  const utils = trpc.useUtils();

  const mutation = trpc.timesheets.delete.useMutation({
    onSuccess: () => {
      toast.success("Time entry deleted");
      // Invalidate and refetch time entries
      utils.timesheets.list.invalidate();
      utils.timesheets.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete time entry");
    },
  });

  const mutateAsync = async (id: string) => {
    return mutation.mutateAsync(id);
  };

  return { mutateAsync, isLoading: mutation.isPending };
}

// Hook to submit week for approval
export function useSubmitWeekForApproval() {
  const utils = trpc.useUtils();

  const mutation = trpc.timesheets.submit.useMutation({
    onSuccess: () => {
      toast.success("Week submitted for approval");
      // Invalidate and refetch relevant queries
      utils.timesheets.list.invalidate();
      utils.timesheets.summary.invalidate();
      utils.timesheets.getSubmissionStatus.invalidate();
      utils.timesheets.getPendingApprovals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit week");
    },
  });

  const mutateAsync = async (weekStart: string, weekEnd: string) => {
    return mutation.mutateAsync({
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
    });
  };

  return { mutateAsync, isLoading: mutation.isPending };
}

// Hook to copy previous week entries
export function useCopyPreviousWeek() {
  const utils = trpc.useUtils();

  const mutation = trpc.timesheets.copyPreviousWeek.useMutation({
    onSuccess: () => {
      toast.success("Previous week copied successfully");
      // Invalidate and refetch time entries
      utils.timesheets.list.invalidate();
      utils.timesheets.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to copy week");
    },
  });

  const mutateAsync = async ({
    currentWeekStart,
    currentWeekEnd,
  }: {
    currentWeekStart: string;
    currentWeekEnd: string;
  }) => {
    return mutation.mutateAsync({
      currentWeekStartDate: currentWeekStart,
      currentWeekEndDate: currentWeekEnd,
    });
  };

  return { mutateAsync, isLoading: mutation.isPending };
}
