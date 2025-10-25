"use client";

import { format } from "date-fns";
import { CheckCircle, Download, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientPortalContext } from "@/contexts/client-portal-context";

export default function ProposalsPage() {
  const { currentClientId } = useClientPortalContext();
  const utils = trpc.useUtils();
  const [selectedStatus, setSelectedStatus] = useState<
    "sent" | "viewed" | "signed" | "expired" | undefined
  >();

  const { data: proposals, isLoading } =
    trpc.clientPortal.getProposals.useQuery(
      { clientId: currentClientId || "", status: selectedStatus },
      { enabled: !!currentClientId },
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Sent
          </Badge>
        );
      case "viewed":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Viewed
          </Badge>
        );
      case "signed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Signed
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!currentClientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Please select a client to view proposals
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Proposals</h1>
        <p className="text-muted-foreground mt-1">
          View and sign proposals for your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Proposals</CardTitle>
          <CardDescription>All proposals sent to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as any)}
          >
            <TabsList>
              <TabsTrigger
                value={undefined as any}
                onClick={() => setSelectedStatus(undefined)}
              >
                All
              </TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="viewed">Viewed</TabsTrigger>
              <TabsTrigger value="signed">Signed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus || "all"} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading proposals...
                </div>
              ) : !proposals || proposals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No proposals found</p>
                </div>
              ) : (
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proposal #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Annual</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">
                            {proposal.proposalNumber}
                          </TableCell>
                          <TableCell>{proposal.title}</TableCell>
                          <TableCell>
                            {getStatusBadge(proposal.status)}
                          </TableCell>
                          <TableCell>£{proposal.monthlyTotal}</TableCell>
                          <TableCell>£{proposal.annualTotal}</TableCell>
                          <TableCell>
                            {proposal.sentAt &&
                              format(new Date(proposal.sentAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/portal/proposals/${proposal.id}`}>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                              {proposal.status === "sent" && (
                                <Link
                                  href={`/portal/proposals/${proposal.id}/sign`}
                                >
                                  <Button size="sm">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Sign
                                  </Button>
                                </Link>
                              )}
                              {proposal.status === "signed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const result =
                                        await utils.clientPortal.getSignedProposalPdf.fetch(
                                          {
                                            proposalId: proposal.id,
                                          },
                                        );
                                      if (result.url) {
                                        window.open(result.url, "_blank");
                                      } else {
                                        toast.error("Signed PDF not available");
                                      }
                                    } catch (_error) {
                                      toast.error("Failed to load signed PDF");
                                    }
                                  }}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  PDF
                                </Button>
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
