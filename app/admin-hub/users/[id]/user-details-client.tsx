"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit,
  Filter,
  KeyRound,
  Mail,
  Search,
  Shield,
  Trash2,
  UserCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  departmentId: string | null;
  hourlyRate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDetailsClientProps {
  user: User;
  currentUserId: string;
}

export function UserDetailsClient({
  user: initialUser,
  currentUserId,
}: UserDetailsClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialUser.role);

  // Activity history state
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: userData } = trpc.users.getById.useQuery(initialUser.id);
  const user = userData || initialUser;

  // Fetch activity history with search and filters
  const { data: activityData, isLoading: isLoadingActivity } =
    trpc.activities.getUserActivityHistory.useQuery({
      userId: user.id,
      search: searchQuery || undefined,
      module: moduleFilter as
        | "admin-hub"
        | "client-hub"
        | "practice-hub"
        | "proposal-hub"
        | "employee-hub"
        | "social-hub"
        | "client-portal"
        | "system"
        | undefined,
      limit,
      offset: page * limit,
    });

  const activityLogs = activityData?.activities || [];
  const hasMore = activityData?.hasMore || false;
  const totalActivities = activityData?.total || 0;

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setIsEditRoleOpen(false);
      utils.users.getById.invalidate(initialUser.id);
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      router.push("/admin-hub/users");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const sendPasswordResetMutation = trpc.users.sendPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send password reset email");
    },
  });

  const handleUpdateRole = () => {
    updateRoleMutation.mutate({
      id: user.id,
      role: selectedRole as "admin" | "accountant" | "member",
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(user.id);
  };

  const handleSendPasswordReset = () => {
    sendPasswordResetMutation.mutate({ userId: user.id });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "accountant":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDisplayRole = (role: string) => {
    return role.replace("org:", "");
  };

  const getModuleBadgeColor = (module: string) => {
    // Colors match centralized HUB_COLORS from lib/utils/hub-colors.ts
    switch (module) {
      case "admin-hub":
        return "bg-primary/10 text-primary border-primary/20"; // #f97316 Orange
      case "client-hub":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"; // #3b82f6 Blue
      case "practice-hub":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20"; // oklch(0.56 0.15 196.6) Teal
      case "proposal-hub":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20"; // #ec4899 Pink
      case "employee-hub":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"; // #10b981 Emerald
      case "social-hub":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"; // #8b5cf6 Purple
      case "client-portal":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20"; // #4f46e5 Indigo (portal-hub)
      case "system":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"; // Neutral
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getModuleDisplayName = (module: string) => {
    return module
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage((p) => p - 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page on search
  };

  const handleModuleFilterChange = (value: string) => {
    setModuleFilter(value === "all" ? undefined : value);
    setPage(0); // Reset to first page on filter
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin-hub/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">
              Manage user information and permissions
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-medium mb-4">
                {user.firstName?.[0]?.toUpperCase() ||
                  user.email[0].toUpperCase()}
                {user.lastName?.[0]?.toUpperCase() || ""}
              </div>
              <h3 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role</span>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getDisplayRole(user.role)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status</span>
                </div>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined</span>
                </div>
                <span className="text-sm">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                </div>
                <span
                  className="text-sm truncate max-w-[150px]"
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setIsEditRoleOpen(true)}
                disabled={isCurrentUser}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleSendPasswordReset}
                disabled={isCurrentUser || sendPasswordResetMutation.isPending}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Send Password Reset
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
                disabled={isCurrentUser}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Module Filter */}
              <div className="w-full sm:w-[200px]">
                <Select
                  value={moduleFilter || "all"}
                  onValueChange={handleModuleFilterChange}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="admin-hub">Admin Hub</SelectItem>
                    <SelectItem value="client-hub">Client Hub</SelectItem>
                    <SelectItem value="practice-hub">Practice Hub</SelectItem>
                    <SelectItem value="proposal-hub">Proposal Hub</SelectItem>
                    <SelectItem value="employee-hub">Employee Hub</SelectItem>
                    <SelectItem value="social-hub">Social Hub</SelectItem>
                    <SelectItem value="client-portal">Client Portal</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading activities...</p>
              </div>
            ) : activityLogs.length > 0 ? (
              <>
                <div className="space-y-3">
                  {activityLogs.map((log) => {
                    const getIcon = (action: string) => {
                      switch (action) {
                        case "created":
                          return (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          );
                        case "updated":
                          return <Edit className="h-4 w-4 text-blue-600" />;
                        case "deleted":
                          return <XCircle className="h-4 w-4 text-red-600" />;
                        default:
                          return (
                            <UserCircle className="h-4 w-4 text-gray-600" />
                          );
                      }
                    };

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                      >
                        <div className="mt-0.5">{getIcon(log.action)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {log.description || "No description"}
                            </p>
                            <Badge
                              variant="outline"
                              className={getModuleBadgeColor(log.module)}
                            >
                              {getModuleDisplayName(log.module)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.userName || "System"} •{" "}
                            {format(
                              new Date(log.createdAt),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * limit + 1}-
                    {Math.min((page + 1) * limit, totalActivities)} of{" "}
                    {totalActivities} activities
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No activity found
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || moduleFilter
                    ? "Try adjusting your search or filters"
                    : "Activity history for this user will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {user.firstName} {user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={
                updateRoleMutation.isPending || selectedRole === user.role
              }
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {user.firstName} {user.lastName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
