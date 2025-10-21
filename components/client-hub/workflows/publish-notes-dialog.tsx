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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Version {versionNumber}</DialogTitle>
          <DialogDescription>
            Add optional notes to describe what's included in this release
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Publish Version</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
