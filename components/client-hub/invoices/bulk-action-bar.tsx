"use client";

import { Check, Mail, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
type EmailType = "reminder" | "overdue" | "thank_you";

interface BulkActionBarProps {
  selectedInvoiceIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedInvoiceIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "">("");
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>("reminder");

  const utils = trpc.useUtils();

  // Bulk update status mutation
  const bulkUpdateStatusMutation = trpc.invoices.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated status for ${data.count} invoice(s)`);
      utils.invoices.list.invalidate();
      setIsStatusDialogOpen(false);
      setSelectedStatus("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });

  // Bulk send emails mutation
  const bulkSendEmailsMutation = trpc.invoices.bulkSendEmails.useMutation({
    onSuccess: (data) => {
      if (data.failed && data.failed > 0) {
        toast.success(
          `Sent ${data.sent} email(s), ${data.failed} failed. Check activity log for details.`
        );
      } else {
        toast.success(`Sent ${data.sent} email(s) successfully`);
      }
      utils.invoices.list.invalidate();
      setIsEmailDialogOpen(false);
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send emails");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.invoices.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.count} invoice(s)`);
      utils.invoices.list.invalidate();
      setIsDeleteDialogOpen(false);
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoices");
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    bulkUpdateStatusMutation.mutate({
      invoiceIds: selectedInvoiceIds,
      status: selectedStatus,
    });
  };

  const handleBulkSendEmails = () => {
    bulkSendEmailsMutation.mutate({
      invoiceIds: selectedInvoiceIds,
      emailType: selectedEmailType,
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({
      invoiceIds: selectedInvoiceIds,
    });
  };

  return (
    <>
      <div className="mx-6 my-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedInvoiceIds.length} invoice{selectedInvoiceIds.length > 1 ? "s" : ""}{" "}
          selected
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsStatusDialogOpen(true)}
          >
            <Check className="h-4 w-4 mr-2" />
            Update Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEmailDialogOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Emails
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedInvoiceIds.length} selected invoice
              {selectedInvoiceIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as InvoiceStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!selectedStatus || bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending
                ? "Updating..."
                : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Emails Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email Reminders</DialogTitle>
            <DialogDescription>
              Send emails for {selectedInvoiceIds.length} selected invoice
              {selectedInvoiceIds.length > 1 ? "s" : ""}. Emails will be sent to the associated clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emailType">Email Type *</Label>
              <Select
                value={selectedEmailType}
                onValueChange={(value) =>
                  setSelectedEmailType(value as EmailType)
                }
              >
                <SelectTrigger id="emailType">
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Payment Reminder</SelectItem>
                  <SelectItem value="overdue">Overdue Notice</SelectItem>
                  <SelectItem value="thank_you">Thank You (Payment Received)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkSendEmailsMutation.isPending && (
              <div className="text-sm text-muted-foreground">
                Sending emails... Please wait.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={bulkSendEmailsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSendEmails}
              disabled={bulkSendEmailsMutation.isPending}
            >
              {bulkSendEmailsMutation.isPending
                ? "Sending..."
                : "Send Emails"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoices</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedInvoiceIds.length} selected
              invoice{selectedInvoiceIds.length > 1 ? "s" : ""}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Invoices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
