"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Users as UsersIcon, Shield, Clock } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAccessDrawer } from "@/components/client-admin/user-access-drawer";

type PortalUser = {
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
};

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: users, isLoading, refetch } = trpc.clientPortalAdmin.listPortalUsers.useQuery();

  const handleManageAccess = (user: PortalUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case "suspended":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspended</Badge>;
      case "invited":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Invited</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Portal Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage external client portal user accounts and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portal Users</CardTitle>
          <CardDescription>
            All users with access to the client portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No portal users yet</p>
              <p className="text-sm mt-2">Send invitations to get started</p>
            </div>
          ) : (
            <div className="glass-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.clientAccess.map((access) => (
                            <Badge
                              key={access.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {access.clientName}
                              <span className="ml-1 opacity-60">({access.role})</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          format(new Date(user.lastLoginAt), "MMM d, yyyy")
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.acceptedAt ? (
                          format(new Date(user.acceptedAt), "MMM d, yyyy")
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageAccess(user)}
                        >
                          Manage Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserAccessDrawer
        user={selectedUser}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
