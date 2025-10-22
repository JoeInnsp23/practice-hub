"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

const reassignmentSchema = z.object({
  toUserId: z.string().min(1, "Please select a user"),
  assignmentType: z.enum(["preparer", "reviewer", "assigned_to"], {
    required_error: "Please select an assignment type",
  }),
  changeReason: z.string().max(500).optional(),
});

type ReassignmentFormValues = z.infer<typeof reassignmentSchema>;

interface TaskReassignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  currentAssignee?: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
  isBulk?: boolean;
  taskCount?: number;
}

export function TaskReassignmentModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  currentAssignee,
  onSuccess,
  isBulk = false,
  taskCount = 1,
}: TaskReassignmentModalProps) {
  const form = useForm<ReassignmentFormValues>({
    resolver: zodResolver(reassignmentSchema),
    defaultValues: {
      toUserId: "",
      assignmentType: "assigned_to",
      changeReason: "",
    },
  });

  // Fetch tenant users for selection
  const { data: usersData } = trpc.users.list.useQuery(
    { includeInactive: false },
    { enabled: open },
  );

  const users = usersData?.users || [];

  // Reassignment mutation
  const reassignMutation = trpc.tasks.reassign.useMutation({
    onSuccess: () => {
      toast.success(`Task "${taskTitle}" reassigned successfully`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reassign task");
    },
  });

  const onSubmit = async (data: ReassignmentFormValues) => {
    try {
      await reassignMutation.mutateAsync({
        taskId,
        toUserId: data.toUserId,
        assignmentType: data.assignmentType,
        changeReason: data.changeReason,
      });
    } catch (_error) {
      // Error handled by mutation onError
    }
  };

  const isSubmitting = reassignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Reassign Task{isBulk && taskCount > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            {isBulk && taskCount > 1
              ? `Reassign ${taskCount} selected tasks to a different user.`
              : `Reassign "${taskTitle}" to a different user.`}
            {currentAssignee && (
              <span className="block mt-2 text-sm">
                Current assignee: <strong>{currentAssignee.name}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="assigned_to">Assigned To</SelectItem>
                      <SelectItem value="preparer">Preparer</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which assignment field to update
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          disabled={user.id === currentAssignee?.id}
                        >
                          {user.firstName} {user.lastName}
                          {user.id === currentAssignee?.id && " (Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the user to assign this task to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="changeReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for reassignment..."
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
                  ? "Reassigning..."
                  : `Reassign Task${isBulk && taskCount > 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
