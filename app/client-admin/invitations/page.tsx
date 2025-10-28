"use client";

import { format } from "date-fns";
import { Mail, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { SendInvitationDialog } from "@/components/client-admin/send-invitation-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvitationsPage() {
  const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined);

  // Fetch invitations
  const {
    data: invitations,
    isLoading,
    refetch,
  } = trpc.clientPortalAdmin.listInvitations.useQuery({
    status: selectedTab as
      | "pending"
      | "accepted"
      | "expired"
      | "revoked"
      | undefined,
  });

  // Resend invitation mutation
  const resendMutation = trpc.clientPortalAdmin.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });

  // Revoke invitation mutation
  const revokeMutation = trpc.clientPortalAdmin.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invitation");
    },
  });

  const handleResend = (invitationId: string) => {
    if (confirm("Are you sure you want to resend this invitation?")) {
      resendMutation.mutate({ invitationId });
    }
  };

  const handleRevoke = (invitationId: string) => {
    if (
      confirm(
        "Are you sure you want to revoke this invitation? This cannot be undone.",
      )
    ) {
      revokeMutation.mutate({ invitationId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Accepted
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Expired
          </Badge>
        );
      case "revoked":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">
            Client Portal Invitations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage invitations to the external client portal
          </p>
        </div>
        <SendInvitationDialog onSuccess={() => refetch()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Track and manage all client portal invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger
                value="all"
                onClick={() => setSelectedTab(undefined)}
              >
                All
              </TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="revoked">Revoked</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab || "all"} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading invitations...
                </div>
              ) : !invitations || invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No invitations found</p>
                  {!selectedTab && (
                    <p className="text-sm mt-2">
                      Send your first invitation to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            {invitation.firstName} {invitation.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{invitation.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invitation.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invitation.sentAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(invitation.expiresAt),
                              "MMM d, yyyy",
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {invitation.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResend(invitation.id)}
                                    disabled={resendMutation.isPending}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Resend
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevoke(invitation.id)}
                                    disabled={revokeMutation.isPending}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Revoke
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
