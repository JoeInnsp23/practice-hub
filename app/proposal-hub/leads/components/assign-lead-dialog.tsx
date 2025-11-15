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
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

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
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Assign Lead</DialogTitle>
        <DialogDescription className="sr-only">
          Assign "{leadName}" to a team member for follow-up
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Assign Lead</CardTitle>
            <CardDescription>
              Assign "{leadName}" to a team member for follow-up
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-6 px-8 md:px-10">
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
                        <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
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
              </CardContent>

              <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignLead.isPending}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {assignLead.isPending ? "Assigning..." : "Assign Lead"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
