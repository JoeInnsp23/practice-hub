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

interface PublishNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  versionNumber: number;
}

export function PublishNotesDialog({
  isOpen,
  onClose,
  onConfirm,
  versionNumber,
}: PublishNotesDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const handleCancel = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">
          Publish Version {versionNumber}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add optional notes to describe what's included in this release
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Publish Version {versionNumber}</CardTitle>
            <CardDescription>
              Add optional notes to describe what's included in this release
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 md:px-10">
            <div className="space-y-2">
              <Label htmlFor="publish-notes">Release Notes (Optional)</Label>
              <Textarea
                id="publish-notes"
                placeholder="e.g., Fixed stage ordering issue, added new compliance checklist items..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes will be visible in the version history
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Publish Version</Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
