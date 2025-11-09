"use client";

import * as Sentry from "@sentry/nextjs";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Mail,
  MailX,
  MoreVertical,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditUserDialog } from "./edit-user-dialog";
import { SendInvitationDialog } from "./send-invitation-dialog";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FilterView = "active-users" | "pending-invitations" | "invitation-history";

type SortField =
  | "name"
  | "email"
  | "role"
  | "department"
  | "status"
  | "createdAt";
type SortOrder = "asc" | "desc" | null;

interface UserRow {
  type: "user";
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  departmentId: string | null;
  departmentName?: string;
  isActive: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvitationRow {
  type: "invitation";
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedByName: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

type UnifiedTableRow = UserRow | InvitationRow;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRoleBadge(role: string): React.ReactNode {
  const roleColors = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    accountant:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  };

  const roleLabels = {
    admin: "Admin",
    accountant: "Accountant",
    member: "Member",
  };

  return (
    <Badge className={roleColors[role as keyof typeof roleColors]}>
      {roleLabels[role as keyof typeof roleLabels] || role}
    </Badge>
  );
}

function getStatusBadge(status: string, expiresAt?: Date): React.ReactNode {
  const isExpired = expiresAt && new Date() > new Date(expiresAt);

  if (status === "accepted") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Accepted
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Cancelled
      </Badge>
    );
  }

  if (status === "expired" || isExpired) {
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
        <Mail className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  }

  // User status badges
  if (status === "active") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        Active
      </Badge>
    );
  }

  return <Badge variant="secondary">Inactive</Badge>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedUserManagementClient() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // State
  const [filterView, setFilterView] = useState<FilterView>("active-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch data
  const { data: usersData, isLoading: usersLoading } = trpc.users.list.useQuery(
    {
      role: "all",
    },
  );

  const { data: invitationsData, isLoading: invitationsLoading } =
    trpc.invitations.list.useQuery();

  const { data: departmentsData } = trpc.departments.list.useQuery({
    includeInactive: false,
  });

  // Mutations
  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User removed successfully");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "delete_user" },
      });
      toast.error(error.message);
    },
  });

  const sendPasswordResetMutation = trpc.users.sendPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "send_password_reset" },
      });
      toast.error(error.message);
    },
  });

  const resendInvitationMutation = trpc.invitations.resend.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent successfully");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelInvitationMutation = trpc.invitations.cancel.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Transform data into unified table rows
  const tableData: UnifiedTableRow[] = useMemo(() => {
    if (filterView === "active-users") {
      if (!usersData?.users) return [];

      const userRows: UserRow[] = usersData.users
        .filter((u) => u.status === "active")
        .map((user) => {
          const department = departmentsData?.departments.find(
            (d) => d.id === user.departmentId,
          );

          return {
            type: "user" as const,
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            departmentId: user.departmentId,
            departmentName: department?.name,
            isActive: user.isActive,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        });

      return userRows;
    }

    if (filterView === "pending-invitations") {
      if (!invitationsData) return [];

      const invitationRows: InvitationRow[] = invitationsData
        .filter(
          (inv) =>
            inv.status === "pending" && new Date() <= new Date(inv.expiresAt),
        )
        .map((inv) => ({
          type: "invitation" as const,
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status as
            | "pending"
            | "accepted"
            | "expired"
            | "cancelled",
          invitedByName: inv.invitedBy
            ? inv.invitedBy.name || inv.invitedBy.email
            : "Unknown",
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
          createdAt: inv.createdAt,
        }));

      return invitationRows;
    }

    if (filterView === "invitation-history") {
      if (!invitationsData) return [];

      const invitationRows: InvitationRow[] = invitationsData
        .filter(
          (inv) =>
            inv.status === "accepted" ||
            inv.status === "expired" ||
            inv.status === "cancelled" ||
            new Date() > new Date(inv.expiresAt),
        )
        .map((inv) => ({
          type: "invitation" as const,
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status as
            | "pending"
            | "accepted"
            | "expired"
            | "cancelled",
          invitedByName: inv.invitedBy
            ? inv.invitedBy.name || inv.invitedBy.email
            : "Unknown",
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
          createdAt: inv.createdAt,
        }));

      return invitationRows;
    }

    return [];
  }, [filterView, usersData, invitationsData, departmentsData]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;

    const query = searchQuery.toLowerCase();

    return tableData.filter((row) => {
      if (row.type === "user") {
        return (
          row.email.toLowerCase().includes(query) ||
          row.firstName?.toLowerCase().includes(query) ||
          row.lastName?.toLowerCase().includes(query) ||
          row.departmentName?.toLowerCase().includes(query)
        );
      }

      // Invitation row
      return (
        row.email.toLowerCase().includes(query) ||
        row.invitedByName.toLowerCase().includes(query)
      );
    });
  }, [tableData, searchQuery]);

  // Apply sorting (only for active users)
  const sortedData = useMemo(() => {
    if (filterView !== "active-users" || !sortOrder) return filteredData;

    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      if (a.type !== "user" || b.type !== "user") return 0;

      let aValue: unknown;
      let bValue: unknown;

      if (sortField === "name") {
        aValue = `${a.firstName || ""} ${a.lastName || ""}`.trim();
        bValue = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      } else if (sortField === "department") {
        aValue = a.departmentName || "";
        bValue = b.departmentName || "";
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });

    return sorted;
  }, [filteredData, sortField, sortOrder, filterView]);

  // Calculate stats
  const stats = useMemo(() => {
    const allUsers = usersData?.users || [];
    const allInvitations = invitationsData || [];

    const activeUsers = allUsers.filter((u) => u.status === "active").length;
    const pendingInvitations = allInvitations.filter(
      (inv) =>
        inv.status === "pending" && new Date() <= new Date(inv.expiresAt),
    ).length;
    const adminUsers = allUsers.filter(
      (u) => u.role === "admin" && u.status === "active",
    ).length;

    // Calculate this month's growth
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usersCreatedThisMonth = allUsers.filter(
      (u) => new Date(u.createdAt) >= startOfMonth,
    ).length;

    const invitationsAcceptedThisMonth = allInvitations.filter(
      (inv) =>
        inv.status === "accepted" &&
        inv.acceptedAt &&
        new Date(inv.acceptedAt) >= startOfMonth,
    ).length;

    const monthlyGrowth = usersCreatedThisMonth + invitationsAcceptedThisMonth;

    return {
      activeUsers,
      pendingInvitations,
      adminUsers,
      monthlyGrowth,
    };
  }, [usersData, invitationsData]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (filterView !== "active-users") return; // Only allow sorting on active users

    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder(null);
        setSortField("createdAt");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle actions
  const handleEditUser = (row: UserRow) => {
    setSelectedUser(row);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleSendPasswordReset = (userId: string) => {
    sendPasswordResetMutation.mutate({ userId });
  };

  const handleResendInvitation = (invitationId: string) => {
    resendInvitationMutation.mutate({ invitationId });
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (window.confirm("Are you sure you want to cancel this invitation?")) {
      cancelInvitationMutation.mutate({ invitationId });
    }
  };

  const isLoading = usersLoading || invitationsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage active users and pending invitations for your organization
          </p>
        </div>
        <SendInvitationDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invitations
            </CardTitle>
            <Mail className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvitations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month's Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyGrowth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterView}
          onValueChange={(v) => setFilterView(v as FilterView)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active-users">Active Users</SelectItem>
            <SelectItem value="pending-invitations">
              Pending Invitations
            </SelectItem>
            <SelectItem value="invitation-history">
              Invitation History
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              {filterView === "active-users" && (
                <>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "name" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "name" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === "email" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "email" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      {sortField === "role" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "role" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center gap-1">
                      Department
                      {sortField === "department" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "department" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "status" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {sortField === "createdAt" && sortOrder === "asc" && (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {sortField === "createdAt" && sortOrder === "desc" && (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
              {filterView === "pending-invitations" && (
                <>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
              {filterView === "invitation-history" && (
                <>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={filterView === "active-users" ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && sortedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={filterView === "active-users" ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  {searchQuery
                    ? "No results found"
                    : `No ${filterView === "active-users" ? "active users" : "invitations"} found`}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              sortedData.map((row) => {
                if (row.type === "user") {
                  const fullName =
                    `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                    "No name";

                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin-hub/users/${row.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {row.firstName?.[0]?.toUpperCase() ||
                              row.email[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(row.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.departmentName || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(row.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin-hub/users/${row.id}`);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(row);
                              }}
                            >
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendPasswordReset(row.id);
                              }}
                            >
                              Send Password Reset
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(row.id);
                              }}
                              className="text-destructive"
                            >
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Invitation row
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>{getRoleBadge(row.role)}</TableCell>
                    {filterView === "invitation-history" && (
                      <TableCell>
                        {getStatusBadge(row.status, row.expiresAt)}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {row.invitedByName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {filterView === "pending-invitations"
                        ? formatDistanceToNow(new Date(row.expiresAt), {
                            addSuffix: true,
                          })
                        : row.acceptedAt
                          ? format(new Date(row.acceptedAt), "MMM d, yyyy")
                          : format(new Date(row.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(row.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {filterView === "pending-invitations" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleResendInvitation(row.id)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleCancelInvitation(row.id)}
                              className="text-destructive"
                            >
                              <MailX className="mr-2 h-4 w-4" />
                              Cancel Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {filterView === "invitation-history" && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            utils.users.list.invalidate();
          }}
        />
      )}
    </div>
  );
}
