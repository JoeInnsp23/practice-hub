"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import toast from "react-hot-toast";

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
  status?: "draft" | "submitted" | "approved";
  userId?: string;
  user?: string;
}

interface TimeEntryInput {
  date: Date;
  clientId?: string;
  taskId?: string;
  description?: string;
  hours: number;
  billable: boolean;
}

// Hook to fetch time entries
export function useTimeEntries(startDate?: string, endDate?: string) {
  const [data, setData] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    async function fetchEntries() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // API call would go here
        // const response = await fetch(`/api/time-entries?start=${startDate}&end=${endDate}`);
        // const entries = await response.json();

        // For now, return mock data
        const mockData: TimeEntry[] = [
          {
            id: "1",
            date: new Date(startDate || new Date()),
            client: "ABC Company",
            clientId: "client1",
            task: "Monthly Bookkeeping",
            taskId: "task1",
            description: "Reviewed and categorized transactions",
            hours: 3.5,
            billable: true,
            billed: false,
            status: "approved",
            user: "Current User",
          },
          {
            id: "2",
            date: new Date(startDate || new Date()),
            client: "XYZ Ltd",
            clientId: "client2",
            task: "VAT Return",
            taskId: "task2",
            description: "Prepared quarterly VAT return",
            hours: 2,
            billable: true,
            billed: false,
            status: "submitted",
            user: "Current User",
          },
        ];

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch entries"));
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
  const { userId } = useAuth();

  const mutateAsync = async (entry: TimeEntryInput) => {
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);
      // API call would go here
      // const response = await fetch("/api/time-entries", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(entry),
      // });

      // For now, return mock data
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        ...entry,
        billed: false,
        status: "draft",
        user: "Current User",
      };

      toast.success("Time entry created");
      return newEntry;
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

  const mutateAsync = async (id: string) => {
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