"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
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

const assignLeadSchema = z.object({
  assignedToId: z.string().min(1, "Please select a team member"),
});

type AssignLeadFormValues = z.infer<typeof assignLeadSchema>;

interface AssignLeadDialogProps {
  leadId: string;
  leadName: string;
  currentAssigneeId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignLeadDialog({
  leadId,
  leadName,
  currentAssigneeId,
  open,
  onOpenChange,
}: AssignLeadDialogProps) {
  const utils = trpc.useUtils();

  // Fetch users list
  const { data: usersData } = trpc.users.list.useQuery({});
  const users = usersData?.users || [];

  const form = useForm<AssignLeadFormValues>({
    resolver: zodResolver(assignLeadSchema),
    defaultValues: {
      assignedToId: currentAssigneeId || "",
    },
  });

  // Update form when currentAssigneeId changes
  useEffect(() => {
    if (currentAssigneeId) {
      form.reset({ assignedToId: currentAssigneeId });
    }
  }, [currentAssigneeId, form]);

  const assignLead = trpc.leads.assignLead.useMutation({
    onSuccess: () => {
      toast.success("Lead assigned successfully");
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate(leadId);
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign lead");
    },
  });

  const onSubmit = (data: AssignLeadFormValues) => {
    assignLead.mutate({
      leadId,
      assignedToId: data.assignedToId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <DialogDescription>
            Assign "{leadName}" to a team member for follow-up
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({user.role})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignLead.isPending}>
                <UserCheck className="h-4 w-4 mr-2" />
                {assignLead.isPending ? "Assigning..." : "Assign Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
