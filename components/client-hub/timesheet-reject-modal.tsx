"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Reject Timesheet{submissionCount > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            {submissionCount > 1
              ? `Please provide a reason for rejecting ${submissionCount} timesheets. All selected staff members will receive this feedback.`
              : "Please provide a reason for rejecting this timesheet. The staff member will receive this feedback."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
