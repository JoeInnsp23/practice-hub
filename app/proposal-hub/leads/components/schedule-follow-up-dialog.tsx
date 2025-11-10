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
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Schedule Follow-up</DialogTitle>
        <DialogDescription className="sr-only">
          Schedule a follow-up for "{leadName}"
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Schedule Follow-up</CardTitle>
            <CardDescription>
              Schedule a follow-up for "{leadName}"
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-6 px-8 md:px-10">
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
                <Button type="submit" disabled={scheduleFollowUp.isPending}>
                  <Clock className="h-4 w-4 mr-2" />
                  {scheduleFollowUp.isPending
                    ? "Scheduling..."
                    : "Schedule Follow-up"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
