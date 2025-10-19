"use client";

import { format } from "date-fns";
import { Plus, Trash2, UserCheck, UserX } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddClientAccessDialog } from "./add-client-access-dialog";

interface UserAccessDrawerProps {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    lastLoginAt: Date | null;
    acceptedAt: Date | null;
    clientAccess: Array<{
      id: string;
      clientId: string;
      clientName: string;
      role: string;
      grantedAt: Date;
      grantedBy: string | null;
      isActive: boolean;
      expiresAt: Date | null;
    }>;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserAccessDrawer({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserAccessDrawerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [accessToRevoke, setAccessToRevoke] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const revokeAccessMutation = trpc.clientPortalAdmin.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success("Client access revoked");
      utils.clientPortalAdmin.listPortalUsers.invalidate();
      setAccessToRevoke(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke access");
    },
  });

  const updateRoleMutation = trpc.clientPortalAdmin.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.clientPortalAdmin.listPortalUsers.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const suspendUserMutation = trpc.clientPortalAdmin.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("User suspended");
      utils.clientPortalAdmin.listPortalUsers.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to suspend user");
    },
  });

  const reactivateUserMutation =
    trpc.clientPortalAdmin.reactivateUser.useMutation({
      onSuccess: () => {
        toast.success("User reactivated");
        utils.clientPortalAdmin.listPortalUsers.invalidate();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reactivate user");
      },
    });

  if (!user) return null;

  const handleRevokeAccess = () => {
    if (!accessToRevoke) return;
    revokeAccessMutation.mutate({ accessId: accessToRevoke });
  };

  const handleRoleChange = (accessId: string, newRole: string) => {
    updateRoleMutation.mutate({
      accessId,
      role: newRole as "viewer" | "editor" | "admin",
    });
  };

  const handleSuspendUser = () => {
    suspendUserMutation.mutate({ portalUserId: user.id });
  };

  const handleReactivateUser = () => {
    reactivateUserMutation.mutate({ portalUserId: user.id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Suspended
          </Badge>
        );
      case "invited":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Invited
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div>
                {user.firstName} {user.lastName}
              </div>
              {getStatusBadge(user.status)}
            </SheetTitle>
            <SheetDescription>{user.email}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                User Information
              </h3>
              <div className="glass-card p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span>
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), "MMM d, yyyy HH:mm")
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted At:</span>
                  <span>
                    {user.acceptedAt
                      ? format(new Date(user.acceptedAt), "MMM d, yyyy")
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Access */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Client Access
                </h3>
                <Button
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  disabled={user.status === "suspended"}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Client
                </Button>
              </div>

              {user.clientAccess.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  <p>No client access granted</p>
                </div>
              ) : (
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Granted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.clientAccess.map((access) => (
                        <TableRow key={access.id}>
                          <TableCell className="font-medium">
                            {access.clientName}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={access.role}
                              onValueChange={(newRole) =>
                                handleRoleChange(access.id, newRole)
                              }
                              disabled={user.status === "suspended"}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(access.grantedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAccessToRevoke(access.id)}
                              disabled={user.status === "suspended"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* User Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                User Actions
              </h3>
              <div className="flex gap-2">
                {user.status === "active" ? (
                  <Button
                    variant="destructive"
                    onClick={handleSuspendUser}
                    disabled={suspendUserMutation.isPending}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Suspend User
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleReactivateUser}
                    disabled={reactivateUserMutation.isPending}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Reactivate User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Client Access Dialog */}
      <AddClientAccessDialog
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        existingClientIds={user.clientAccess.map((a) => a.clientId)}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          onSuccess?.();
        }}
      />

      {/* Revoke Access Confirmation */}
      <AlertDialog
        open={!!accessToRevoke}
        onOpenChange={() => setAccessToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Client Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's access to this client. They will no
              longer be able to view any data for this client in the portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
