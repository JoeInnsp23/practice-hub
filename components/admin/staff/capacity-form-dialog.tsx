"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface StaffCapacity {
  id: string;
  userId: string;
  effectiveFrom: string;
  weeklyHours: number;
  notes?: string | null;
}

interface CapacityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capacity?: StaffCapacity;
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
  const createMutation = trpc.staffCapacity.create.useMutation();

  // Update mutation
  const updateMutation = trpc.staffCapacity.update.useMutation();

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

  const onSubmit = async (data: CapacityFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: capacity.id,
          data,
        });
        toast.success("Capacity record updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Capacity record created successfully");
      }
      onSuccess();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: isEditing ? "update_capacity" : "create_capacity" },
        extra: {
          errorMessage: error instanceof Error ? error.message : String(error),
          capacityId: capacity?.id,
        },
      });
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditing ? "update" : "create"} capacity record`,
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">
          {isEditing ? "Update Capacity" : "Add Staff Capacity"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing
            ? "Update the capacity record for this staff member."
            : "Set the weekly capacity for a staff member. This will be used to calculate utilization."}
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>
              {isEditing ? "Update Capacity" : "Add Staff Capacity"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the capacity record for this staff member."
                : "Set the weekly capacity for a staff member. This will be used to calculate utilization."}
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <CardContent className="space-y-4 px-8 md:px-10">
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Expected working hours per week (e.g., 37.5 for
                        full-time)
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
              </CardContent>

              <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
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
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
