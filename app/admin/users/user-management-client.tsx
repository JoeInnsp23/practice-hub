"use client";

import {
  Activity,
  Edit,
  Eye,
  KeyRound,
  Mail,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditUserDialog } from "./edit-user-dialog";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserManagementClientProps {
  initialUsers: User[];
  stats: {
    total: number;
    active: number;
    admins: number;
    accountants: number;
    members: number;
  };
  currentUserId: string;
  tenantId: string;
}

export function UserManagementClient({
  initialUsers,
  stats: _initialStats,
  currentUserId: _currentUserId,
  tenantId: _tenantId,
}: UserManagementClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users using tRPC
  const { data: usersData } = trpc.users.list.useQuery({
    search: searchQuery || undefined,
  });

  // Fetch departments to display names
  const { data: departmentsData } = trpc.departments.list.useQuery({
    includeInactive: false,
  });

  const users: User[] = (usersData?.users || initialUsers) as User[];
  const departments = departmentsData?.departments || [];

  // Calculate stats from users
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
      accountants: users.filter(
        (u) => u.role === "accountant" || u.role === "org:accountant",
      ).length,
      members: users.filter(
        (u) => u.role === "member" || u.role === "org:member",
      ).length,
    };
  }, [users]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query),
    );
  }, [users, searchQuery]);

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User removed successfully");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      console.error("Failed to delete user:", error);
      toast.error("Failed to remove user");
    },
  });

  const sendPasswordResetMutation = trpc.users.sendPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error) => {
      console.error("Failed to send password reset:", error);
      toast.error("Failed to send password reset email");
    },
  });

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (
      !confirm(
        `Are you sure you want to remove ${user.firstName} ${user.lastName} (${user.email})?`,
      )
    ) {
      return;
    }

    deleteMutation.mutate(userId);
  };

  const handleSendPasswordReset = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (
      !confirm(
        `Send password reset email to ${user.firstName} ${user.lastName} (${user.email})?`,
      )
    ) {
      return;
    }

    sendPasswordResetMutation.mutate({ userId });
  };

  const handleUserUpdated = (_updatedUser: User) => {
    // Invalidate users list to refetch updated data
    utils.users.list.invalidate();
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

  // Helper to display clean role names (removes org: prefix)
  const getDisplayRole = (role: string) => {
    return role.replace("org:", "");
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "outline";
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return null;
    const department = departments.find((d) => d.id === departmentId);
    return department?.name || null;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-card-foreground">
            User Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage team members and their permissions
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/invitations")}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Total Users
            </CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Active
            </CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <Activity className="h-4 w-4 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Admins
            </CardDescription>
            <CardTitle className="text-2xl">{stats.admins}</CardTitle>
          </CardHeader>
          <CardContent>
            <Shield className="h-4 w-4 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Accountants
            </CardDescription>
            <CardTitle className="text-2xl">{stats.accountants}</CardTitle>
          </CardHeader>
          <CardContent>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Members
            </CardDescription>
            <CardTitle className="text-2xl">{stats.members}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">All Users</h3>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-8"
            />
          </div>
        </div>

        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="table-row">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.firstName?.[0]?.toUpperCase() ||
                          user.email[0].toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase() || ""}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === "admin" && (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {getDisplayRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getDepartmentName(user.departmentId) ? (
                      <span className="text-sm">
                        {getDepartmentName(user.departmentId)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.isActive)}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingUser(user)}
                          disabled={user.id === _currentUserId}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendPasswordReset(user.id)}
                          disabled={user.id === _currentUserId}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Send Password Reset
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === _currentUserId}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? `No users found matching "${searchQuery}"`
              : "No users found"}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
        />
      )}
    </div>
  );
}
