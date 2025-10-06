"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

interface TimeEntryAPIResponse {
  id: string;
  date: string;
  clientName?: string;
  clientId?: string;
  taskTitle?: string;
  taskId?: string;
  description?: string;
  hours: number;
  billable: boolean;
  billed: boolean;
  status?: "draft" | "submitted" | "approved" | "rejected";
  userId?: string;
  userName?: string;
  workType?: string;
  startTime?: string;
  endTime?: string;
}

interface TimeEntryInput {
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
) {
  const [data, setData] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    async function fetchEntries() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        params.append("userId", userId);

        const response = await fetch(`/api/time-entries?${params}`);
        if (response.ok) {
          const data = await response.json();
          // Transform API response to match our interface
          const entries: TimeEntry[] = data.entries.map(
            (e: TimeEntryAPIResponse) => ({
              id: e.id,
              date: new Date(e.date),
              client: e.clientName,
              clientId: e.clientId,
              task: e.taskTitle,
              taskId: e.taskId,
              description: e.description,
              hours: e.hours,
              billable: e.billable,
              billed: e.billed,
              status: e.status,
              userId: e.userId,
              user: e.userName,
              workType: e.workType,
              startTime: e.startTime,
              endTime: e.endTime,
            }),
          );
          setData(entries);
        } else {
          throw new Error("Failed to fetch time entries");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch entries"),
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [userId, startDate, endDate]);

  return { data, isLoading, error };
}

// Hook to create a time entry
export function useCreateTimeEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const mutateAsync = async (entry: TimeEntryInput) => {
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...entry,
          date: format(entry.date, "yyyy-MM-dd"),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create time entry");
      }

      const data = await response.json();
      toast.success("Time entry created");
      return data.entry;
    } catch (error) {
      toast.error("Failed to create time entry");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
}

// Hook to update a time entry
export function useUpdateTimeEntry() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      setIsLoading(true);
      // API call would go here
      // const response = await fetch(`/api/time-entries/${id}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(updates),
      // });

      toast.success("Time entry updated");
      return { id, ...updates };
    } catch (error) {
      toast.error("Failed to update time entry");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
}

// Hook to delete a time entry
export function useDeleteTimeEntry() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (_id: string) => {
    try {
      setIsLoading(true);
      // API call would go here
      // await fetch(`/api/time-entries/${id}`, {
      //   method: "DELETE",
      // });

      toast.success("Time entry deleted");
    } catch (error) {
      toast.error("Failed to delete time entry");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
}

// Hook to submit week for approval
export function useSubmitWeekForApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const mutateAsync = async (_weekStart: string) => {
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);
      // API call would go here
      // const response = await fetch("/api/time-entries/submit-week", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ weekStart }),
      // });

      toast.success("Week submitted for approval");
      return { success: true };
    } catch (error) {
      toast.error("Failed to submit week");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
}

// Hook to copy previous week entries
export function useCopyPreviousWeek() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const mutateAsync = async ({
    sourceWeekStart: _sourceWeekStart,
    targetWeekStart: _targetWeekStart,
  }: {
    sourceWeekStart: string;
    targetWeekStart: string;
  }) => {
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);
      // API call would go here
      // const response = await fetch("/api/time-entries/copy-week", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ sourceWeekStart, targetWeekStart }),
      // });

      toast.success("Previous week copied successfully");
      return { success: true };
    } catch (error) {
      toast.error("Failed to copy week");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
}
