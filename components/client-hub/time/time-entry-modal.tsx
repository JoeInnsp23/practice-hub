"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QuickTimeEntry } from "./quick-time-entry";

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function TimeEntryModal({
  isOpen,
  onClose,
  onSave,
}: TimeEntryModalProps) {
  const handleSave = (data: any) => {
    if (onSave) {
      onSave(data);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Time Entry</DialogTitle>
          <DialogDescription>
            Track your time for billing and productivity reporting
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <QuickTimeEntry onSave={handleSave} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
