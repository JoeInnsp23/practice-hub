"use client";

import { Building2, Check, Shield, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "@/lib/auth-client";
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

type UserStatus = "active" | "inactive" | "pending";
type UserRole = "admin" | "accountant" | "member";

interface BulkActionBarProps {
  selectedUserIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedUserIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "">("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const utils = trpc.useUtils();

  // Fetch departments for assignment
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const departments = departmentsData?.departments || [];

  // Check if current user is in selection (for admin protection warning)
  const includesCurrentUser = Boolean(currentUserId && selectedUserIds.includes(currentUserId));

  // Bulk update status mutation
  const bulkUpdateStatusMutation = trpc.users.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated status for ${data.count} user(s)`);
      utils.users.list.invalidate();
      setIsStatusDialogOpen(false);
      setSelectedStatus("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  // Bulk change role mutation
  const bulkChangeRoleMutation = trpc.users.bulkChangeRole.useMutation({
    onSuccess: (data) => {
      toast.success(`Changed role for ${data.count} user(s)`);
      utils.users.list.invalidate();
      setIsRoleDialogOpen(false);
      setSelectedRole("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change user role");
    },
  });

  // Bulk assign department mutation
  const bulkAssignDepartmentMutation =
    trpc.users.bulkAssignDepartment.useMutation({
      onSuccess: (data) => {
        toast.success(`Assigned department for ${data.count} user(s)`);
        utils.users.list.invalidate();
        setIsDepartmentDialogOpen(false);
        setSelectedDepartmentId("");
        onClearSelection();
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to assign department");
      },
    });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    // Admin protection: warn if trying to deactivate self (AC18)
    if (selectedStatus === "inactive" && includesCurrentUser) {
      toast.error("Cannot deactivate your own account");
      return;
    }

    bulkUpdateStatusMutation.mutate({
      userIds: selectedUserIds,
      status: selectedStatus,
    });
  };

  const handleBulkChangeRole = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    bulkChangeRoleMutation.mutate({
      userIds: selectedUserIds,
      role: selectedRole,
    });
  };

  const handleBulkAssignDepartment = () => {
    bulkAssignDepartmentMutation.mutate({
      userIds: selectedUserIds,
      departmentId: selectedDepartmentId || null,
    });
  };

  return (
    <>
      <div className="mx-6 my-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""}{" "}
          selected
          {includesCurrentUser && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              (includes you)
            </span>
          )}
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
            onClick={() => setIsRoleDialogOpen(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Change Role
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDepartmentDialogOpen(true)}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Assign Department
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
            <DialogTitle>Update User Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedUserIds.length} selected user
              {selectedUserIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as UserStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedStatus === "inactive" && includesCurrentUser && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ Admin Protection
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You cannot deactivate your own account via bulk operation. Please
                  deselect yourself or choose a different status.
                </p>
              </div>
            )}
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
                selectedStatus === "" ||
                bulkUpdateStatusMutation.isPending ||
                (selectedStatus === "inactive" && includesCurrentUser)
              }
            >
              {bulkUpdateStatusMutation.isPending
                ? "Updating..."
                : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUserIds.length} selected user
              {selectedUserIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role *</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkChangeRole}
              disabled={!selectedRole || bulkChangeRoleMutation.isPending}
            >
              {bulkChangeRoleMutation.isPending ? "Changing..." : "Change Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Department Dialog */}
      <Dialog
        open={isDepartmentDialogOpen}
        onOpenChange={setIsDepartmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Department</DialogTitle>
            <DialogDescription>
              Assign {selectedUserIds.length} selected user
              {selectedUserIds.length > 1 ? "s" : ""} to a department
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department (or none)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepartmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignDepartment}
              disabled={bulkAssignDepartmentMutation.isPending}
            >
              {bulkAssignDepartmentMutation.isPending
                ? "Assigning..."
                : "Assign Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
