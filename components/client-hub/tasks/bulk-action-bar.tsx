"use client";

import { Check, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import type { TaskStatus } from "./types";
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

interface BulkActionBarProps {
  selectedTaskIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedTaskIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "">("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  const utils = trpc.useUtils();

  // Fetch users for assignment
  const { data: usersData } = trpc.users.list.useQuery();
  const users = usersData?.users || [];

  // Bulk update status mutation
  const bulkUpdateStatusMutation = trpc.tasks.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated status for ${data.count} task(s)`);
      utils.tasks.list.invalidate();
      setIsStatusDialogOpen(false);
      setSelectedStatus("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task status");
    },
  });

  // Bulk assign mutation
  const bulkAssignMutation = trpc.tasks.bulkAssign.useMutation({
    onSuccess: (data) => {
      toast.success(`Assigned ${data.count} task(s)`);
      utils.tasks.list.invalidate();
      setIsAssignDialogOpen(false);
      setSelectedAssigneeId("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign tasks");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.tasks.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.count} task(s)`);
      utils.tasks.list.invalidate();
      setIsDeleteDialogOpen(false);
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete tasks");
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    bulkUpdateStatusMutation.mutate({
      taskIds: selectedTaskIds,
      status: selectedStatus,
    });
  };

  const handleBulkAssign = () => {
    if (!selectedAssigneeId) {
      toast.error("Please select an assignee");
      return;
    }

    bulkAssignMutation.mutate({
      taskIds: selectedTaskIds,
      assigneeId: selectedAssigneeId,
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({
      taskIds: selectedTaskIds,
    });
  };

  return (
    <>
      <div className="mx-6 my-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""}{" "}
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
            onClick={() => setIsAssignDialogOpen(true)}
          >
            <User className="h-4 w-4 mr-2" />
            Assign
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
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedTaskIds.length} selected task
              {selectedTaskIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as TaskStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="records_received">
                    Records Received
                  </SelectItem>
                  <SelectItem value="queries_sent">Queries Sent</SelectItem>
                  <SelectItem value="queries_received">
                    Queries Received
                  </SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
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
              disabled={
                !selectedStatus || bulkUpdateStatusMutation.isPending
              }
            >
              {bulkUpdateStatusMutation.isPending
                ? "Updating..."
                : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tasks</DialogTitle>
            <DialogDescription>
              Assign {selectedTaskIds.length} selected task
              {selectedTaskIds.length > 1 ? "s" : ""} to a team member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee *</Label>
              <Select
                value={selectedAssigneeId}
                onValueChange={setSelectedAssigneeId}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
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
              onClick={handleBulkAssign}
              disabled={!selectedAssigneeId || bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending ? "Assigning..." : "Assign Tasks"}
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
            <AlertDialogTitle>Delete Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTaskIds.length} selected
              task{selectedTaskIds.length > 1 ? "s" : ""}? This action cannot be
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
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Tasks"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
