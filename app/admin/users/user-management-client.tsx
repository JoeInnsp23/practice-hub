"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Activity,
  Mail,
  Search,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { InviteUserDialog } from "./invite-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
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
  stats: initialStats,
  currentUserId,
  tenantId,
}: UserManagementClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users using tRPC
  const { data: usersData } = trpc.users.list.useQuery({
    search: searchQuery || undefined,
  });

  const users = usersData?.users || initialUsers;

  // Calculate stats from users
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin" || u.role === "org:admin").length,
      accountants: users.filter((u) => u.role === "accountant" || u.role === "org:accountant").length,
      members: users.filter((u) => u.role === "member" || u.role === "org:member").length,
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

  const handleUserUpdated = (updatedUser: User) => {
    // Invalidate users list to refetch updated data
    utils.users.list.invalidate();
      if (oldUser.role === "admin" || oldUser.role === "org:admin")
        newStats.admins--;
      else if (
        oldUser.role === "accountant" ||
        oldUser.role === "org:accountant"
      )
        newStats.accountants--;
      else if (oldUser.role === "member" || oldUser.role === "org:member")
        newStats.members--;

      // Increment new role count
      if (updatedUser.role === "admin" || updatedUser.role === "org:admin")
        newStats.admins++;
      else if (
        updatedUser.role === "accountant" ||
        updatedUser.role === "org:accountant"
      )
        newStats.accountants++;
      else if (
        updatedUser.role === "member" ||
        updatedUser.role === "org:member"
      )
        newStats.members++;

      setStats(newStats);
    }

    // Update active count if status changed
    if (oldUser && oldUser.isActive !== updatedUser.isActive) {
      setStats({
        ...stats,
        active: updatedUser.isActive ? stats.active + 1 : stats.active - 1,
      });
    }
  };

  const handleInviteSent = () => {
    toast.success("Invitation sent successfully");
    router.refresh();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
      case "org:admin":
        return "destructive";
      case "accountant":
      case "org:accountant":
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
        <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Users</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="glass-table">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                      {(user.role === "admin" || user.role === "org:admin") && (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {getDisplayRole(user.role)}
                    </Badge>
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
                          onClick={() => setEditingUser(user)}
                          disabled={user.clerkId === currentUserId}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.clerkId === currentUserId}
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteUserDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={handleInviteSent}
      />

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
