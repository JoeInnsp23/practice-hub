"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { trpc } from "@/lib/trpc/client";

const capacityFormSchema = z.object({
  userId: z.string().min(1, "Please select a staff member"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
  weeklyHours: z
    .number()
    .min(1, "Weekly hours must be at least 1")
    .max(168, "Weekly hours cannot exceed 168"),
  notes: z.string().optional(),
});

type CapacityFormData = z.infer<typeof capacityFormSchema>;

interface CapacityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capacity?: any;
  onSuccess: () => void;
}

export function CapacityFormDialog({
  open,
  onOpenChange,
  capacity,
  onSuccess,
}: CapacityFormDialogProps) {
  const isEditing = !!capacity;

  // Fetch users for dropdown
  const { data: usersData } = trpc.users.list.useQuery({});

  // Create mutation
  const createMutation = trpc.staffCapacity.create.useMutation({
    onSuccess: () => {
      toast.success("Capacity record created successfully");
      onSuccess();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "create_capacity" },
        extra: { errorMessage: error.message },
      });
      toast.error(error.message || "Failed to create capacity record");
    },
  });

  // Update mutation
  const updateMutation = trpc.staffCapacity.update.useMutation({
    onSuccess: () => {
      toast.success("Capacity record updated successfully");
      onSuccess();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "update_capacity" },
        extra: { errorMessage: error.message, capacityId: capacity?.id },
      });
      toast.error(error.message || "Failed to update capacity record");
    },
  });

  const form = useForm<CapacityFormData>({
    resolver: zodResolver(capacityFormSchema),
    defaultValues: {
      userId: "",
      effectiveFrom: format(new Date(), "yyyy-MM-dd"),
      weeklyHours: 37.5,
      notes: "",
    },
  });

  // Reset form when capacity changes
  useEffect(() => {
    if (capacity) {
      form.reset({
        userId: capacity.userId,
        effectiveFrom: capacity.effectiveFrom,
        weeklyHours: capacity.weeklyHours,
        notes: capacity.notes ?? "",
      });
    } else {
      form.reset({
        userId: "",
        effectiveFrom: format(new Date(), "yyyy-MM-dd"),
        weeklyHours: 37.5,
        notes: "",
      });
    }
  }, [capacity, form]);

  const onSubmit = (data: CapacityFormData) => {
    if (isEditing) {
      updateMutation.mutate({
        id: capacity.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Update Capacity" : "Add Staff Capacity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the capacity record for this staff member."
              : "Set the weekly capacity for a staff member. This will be used to calculate utilization."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Member</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersData?.users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEditing
                      ? "Cannot change the staff member for an existing record"
                      : "Select the staff member to set capacity for"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    The date from which this capacity is effective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      max="168"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected working hours per week (e.g., 37.5 for full-time)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this capacity record..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Capacity"
                    : "Add Capacity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
