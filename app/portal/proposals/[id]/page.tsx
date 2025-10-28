"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const utils = trpc.useUtils();

  const { data: proposal, isLoading } =
    trpc.clientPortal.getProposalById.useQuery({
      id: proposalId,
    });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-destructive opacity-50" />
          <p className="text-destructive font-medium mb-2">
            Proposal not found
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/portal/proposals")}
          >
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/portal/proposals")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">
              Proposal {proposal.proposalNumber}
            </h1>
            <p className="text-muted-foreground mt-1">{proposal.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(proposal.status)}
          {proposal.status === "sent" && (
            <Link href={`/portal/proposals/${proposal.id}/sign`}>
              <Button>
                <Pencil className="w-4 h-4 mr-2" />
                Sign Proposal
              </Button>
            </Link>
          )}
          {proposal.status === "signed" && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const result =
                    await utils.clientPortal.getSignedProposalPdf.fetch({
                      proposalId: proposal.id,
                    });
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
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{proposal.monthlyTotal}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{proposal.annualTotal}</div>
            <p className="text-xs text-muted-foreground">per year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proposal.sentAt
                ? format(new Date(proposal.sentAt), "MMM d")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {proposal.sentAt
                ? format(new Date(proposal.sentAt), "yyyy")
                : "Not sent"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services and Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Services & Pricing</CardTitle>
          <CardDescription>
            Detailed breakdown of proposed services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proposal.services && proposal.services.length > 0 ? (
            <div className="glass-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposal.services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {service.code}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {service.calculation || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        £{service.price}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">
                      <div>Monthly: £{proposal.monthlyTotal}</div>
                      <div>Annual: £{proposal.annualTotal}</div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No services listed in this proposal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {proposal.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {proposal.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {(proposal.sentAt || proposal.signedAt) && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposal.sentAt && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Proposal Sent</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(proposal.sentAt),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              )}
              {proposal.signedAt && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Proposal Signed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(proposal.signedAt),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
