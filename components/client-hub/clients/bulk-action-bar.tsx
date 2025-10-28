"use client";

import { Check, Trash2, User, X } from "lucide-react";
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

type ClientStatus =
  | "prospect"
  | "onboarding"
  | "active"
  | "inactive"
  | "archived";

interface BulkActionBarProps {
  selectedClientIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedClientIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | "">("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const utils = trpc.useUtils();

  // Fetch users for manager assignment
  const { data: usersData } = trpc.users.list.useQuery({});
  const users = usersData?.users || [];

  // Bulk update status mutation
  const bulkUpdateStatusMutation = trpc.clients.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated status for ${data.count} client(s)`);
      utils.clients.list.invalidate();
      setIsStatusDialogOpen(false);
      setSelectedStatus("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client status");
    },
  });

  // Bulk assign manager mutation
  const bulkAssignManagerMutation = trpc.clients.bulkAssignManager.useMutation({
    onSuccess: (data) => {
      toast.success(`Assigned manager for ${data.count} client(s)`);
      utils.clients.list.invalidate();
      setIsAssignDialogOpen(false);
      setSelectedManagerId("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign manager");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.clients.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.count} client(s)`);
      utils.clients.list.invalidate();
      setIsDeleteDialogOpen(false);
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete clients");
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    bulkUpdateStatusMutation.mutate({
      clientIds: selectedClientIds,
      status: selectedStatus,
    });
  };

  const handleBulkAssignManager = () => {
    if (!selectedManagerId) {
      toast.error("Please select a manager");
      return;
    }

    bulkAssignManagerMutation.mutate({
      clientIds: selectedClientIds,
      managerId: selectedManagerId,
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({
      clientIds: selectedClientIds,
    });
  };

  return (
    <>
      <div className="mx-6 my-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedClientIds.length} client
          {selectedClientIds.length > 1 ? "s" : ""} selected
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
            onClick={() => setIsAssignDialogOpen(true)}
          >
            <User className="h-4 w-4 mr-2" />
            Assign Manager
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
            <DialogTitle>Update Client Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedClientIds.length} selected client
              {selectedClientIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as ClientStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
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

      {/* Assign Manager Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Account Manager</DialogTitle>
            <DialogDescription>
              Assign {selectedClientIds.length} selected client
              {selectedClientIds.length > 1 ? "s" : ""} to an account manager
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Account Manager *</Label>
              <Select
                value={selectedManagerId}
                onValueChange={setSelectedManagerId}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignManager}
              disabled={
                !selectedManagerId || bulkAssignManagerMutation.isPending
              }
            >
              {bulkAssignManagerMutation.isPending
                ? "Assigning..."
                : "Assign Manager"}
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
            <AlertDialogTitle>Delete Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClientIds.length}{" "}
              selected client{selectedClientIds.length > 1 ? "s" : ""}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Clients"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
