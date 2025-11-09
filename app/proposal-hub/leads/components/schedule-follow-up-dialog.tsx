"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const scheduleFollowUpSchema = z.object({
  nextFollowUpAt: z.string().min(1, "Follow-up date is required"),
  notes: z.string().optional(),
});

type ScheduleFollowUpFormValues = z.infer<typeof scheduleFollowUpSchema>;

interface ScheduleFollowUpDialogProps {
  leadId: string;
  leadName: string;
  currentFollowUpDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleFollowUpDialog({
  leadId,
  leadName,
  currentFollowUpDate,
  open,
  onOpenChange,
}: ScheduleFollowUpDialogProps) {
  const utils = trpc.useUtils();

  const form = useForm<ScheduleFollowUpFormValues>({
    resolver: zodResolver(scheduleFollowUpSchema),
    defaultValues: {
      nextFollowUpAt: currentFollowUpDate
        ? new Date(currentFollowUpDate).toISOString().slice(0, 16)
        : "",
      notes: "",
    },
  });

  // Update form when currentFollowUpDate changes
  useEffect(() => {
    if (currentFollowUpDate) {
      form.reset({
        nextFollowUpAt: new Date(currentFollowUpDate)
          .toISOString()
          .slice(0, 16),
        notes: "",
      });
    }
  }, [currentFollowUpDate, form]);

  const scheduleFollowUp = trpc.leads.scheduleFollowUp.useMutation({
    onSuccess: () => {
      toast.success("Follow-up scheduled successfully");
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate(leadId);
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to schedule follow-up");
    },
  });

  const onSubmit = (data: ScheduleFollowUpFormValues) => {
    scheduleFollowUp.mutate({
      leadId,
      nextFollowUpAt: data.nextFollowUpAt,
      notes: data.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>
            Schedule a follow-up for "{leadName}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nextFollowUpAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </FormControl>
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
                      placeholder="Add any notes for this follow-up..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleFollowUp.isPending}>
                <Clock className="h-4 w-4 mr-2" />
                {scheduleFollowUp.isPending
                  ? "Scheduling..."
                  : "Schedule Follow-up"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
