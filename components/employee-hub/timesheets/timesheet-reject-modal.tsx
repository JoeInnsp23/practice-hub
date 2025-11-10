"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TimesheetRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (comments: string) => void;
  submissionCount?: number; // For bulk rejection
}

export function TimesheetRejectModal({
  open,
  onOpenChange,
  onReject,
  submissionCount = 1,
}: TimesheetRejectModalProps) {
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!comments.trim()) return;

    setIsSubmitting(true);
    try {
      await onReject(comments);
      setComments("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">
          Reject Timesheet{submissionCount > 1 ? "s" : ""}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {submissionCount > 1
            ? `Please provide a reason for rejecting ${submissionCount} timesheets. All selected staff members will receive this feedback.`
            : "Please provide a reason for rejecting this timesheet. The staff member will receive this feedback."}
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>
              Reject Timesheet{submissionCount > 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              {submissionCount > 1
                ? `Please provide a reason for rejecting ${submissionCount} timesheets. All selected staff members will receive this feedback.`
                : "Please provide a reason for rejecting this timesheet. The staff member will receive this feedback."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 md:px-10">
            <div className="space-y-2">
              <Label htmlFor="comments">Rejection Reason *</Label>
              <Textarea
                id="comments"
                placeholder="Enter detailed feedback about why the timesheet is being rejected..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={6}
                maxLength={1000}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {comments.length}/1000 characters
              </p>
            </div>
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
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !comments.trim()}
            >
              {isSubmitting
                ? "Rejecting..."
                : `Reject Timesheet${submissionCount > 1 ? "s" : ""}`}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
