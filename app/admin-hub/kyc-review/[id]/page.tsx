"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminKYCDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Get verification details
  const {
    data: verification,
    isLoading,
    refetch,
  } = trpc.adminKyc.getVerificationDetail.useQuery({
    verificationId: id,
  });

  // Mutations
  const approveMutation = trpc.adminKyc.approveVerification.useMutation();
  const rejectMutation = trpc.adminKyc.rejectVerification.useMutation();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        verificationId: id,
      });

      toast.success("Verification approved successfully");
      setShowApproveDialog(false);
      refetch();
      router.push("/admin-hub/kyc-review");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to approve verification";
      toast.error(message);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 10) {
      toast.error(
        "Please provide a detailed rejection reason (at least 10 characters)",
      );
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        verificationId: id,
        reason: rejectionReason,
      });

      toast.success("Verification rejected");
      setShowRejectDialog(false);
      refetch();
      router.push("/admin-hub/kyc-review");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reject verification";
      toast.error(message);
    }
  };

  const getScoreBadge = (score?: string | null) => {
    if (!score) return null;
    const numScore = parseFloat(score);

    if (numScore >= 90) {
      return (
        <Badge className="bg-green-100 text-green-800">High: {numScore}%</Badge>
      );
    } else if (numScore >= 70) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Medium: {numScore}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">Low: {numScore}%</Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-yellow-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Verification Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The requested verification could not be found.
        </p>
        <Link href="/admin-hub/kyc-review">
          <Button>Back to Review Queue</Button>
        </Link>
      </div>
    );
  }

  const isApproved =
    verification.approvedAt !== null && !verification.rejectionReason;
  const isRejected = verification.rejectionReason !== null;
  const isPending = !isApproved && !isRejected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin-hub/kyc-review">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">KYC Verification Detail</h1>
            <p className="text-muted-foreground mt-1">
              Review verification for {verification.clientName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}

        {isApproved && (
          <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Approved
          </Badge>
        )}

        {isRejected && (
          <Badge className="bg-red-100 text-red-800 text-base px-4 py-2">
            <XCircle className="h-5 w-5 mr-2" />
            Rejected
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client & Status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{verification.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{verification.clientEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">
                  {verification.clientPhone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client Code</p>
                <p className="font-medium">{verification.clientCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    verification.clientStatus === "active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {verification.clientStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">LEM Verify ID</p>
                <p className="font-mono text-sm">{verification.lemverifyId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outcome</p>
                <Badge
                  variant={
                    verification.outcome === "pass"
                      ? "default"
                      : verification.outcome === "fail"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {verification.outcome || "Pending"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(verification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!!verification.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(verification.completedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Info */}
          {(isApproved || isRejected) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isApproved ? "Approval" : "Rejection"} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed By</p>
                  <p className="font-medium">
                    {verification.approverFirstName}{" "}
                    {verification.approverLastName}
                  </p>
                </div>
                {!!verification.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(verification.approvedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
                {!!verification.rejectionReason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900">
                      {verification.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Verification Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Document Type</span>
                <span className="capitalize">
                  {verification.documentType?.replace("_", " ") || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verified</span>
                {verification.documentVerified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>

              {!!verification.documentData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Extracted Data:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(verification.documentData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biometric Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Biometric Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Face Match</span>
                  {getScoreBadge(verification.facematchScore)}
                </div>
                <Badge
                  variant={
                    verification.facematchResult === "pass"
                      ? "default"
                      : "destructive"
                  }
                >
                  {verification.facematchResult || "N/A"}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Liveness Check</span>
                  {getScoreBadge(verification.livenessScore)}
                </div>
                <Badge
                  variant={
                    verification.livenessResult === "pass"
                      ? "default"
                      : "destructive"
                  }
                >
                  {verification.livenessResult || "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AML Screening */}
          <Card
            className={
              verification.pepMatch || verification.sanctionsMatch
                ? "border-red-600 border-2"
                : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                AML Screening Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Status</span>
                <Badge
                  variant={
                    verification.amlStatus === "clear"
                      ? "default"
                      : verification.amlStatus === "match" ||
                          verification.amlStatus === "pep"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {verification.amlStatus || "Pending"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    PEP Match
                  </p>
                  {verification.pepMatch ? (
                    <Badge variant="destructive">YES</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Sanctions Match
                  </p>
                  {verification.sanctionsMatch ? (
                    <Badge variant="destructive">YES</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Watchlist Match
                  </p>
                  {verification.watchlistMatch ? (
                    <Badge variant="destructive">YES</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Adverse Media
                  </p>
                  {verification.adverseMediaMatch ? (
                    <Badge variant="destructive">YES</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
              </div>

              {!!verification.amlResult && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Full AML Report:</p>
                  <pre className="text-xs overflow-auto max-h-64">
                    {JSON.stringify(verification.amlResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents & Reports */}
          {!!(verification.reportUrl || verification.documentsUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents & Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!!verification.reportUrl && (
                  <a
                    href={verification.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Full Compliance Report
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {!!verification.documentsUrl &&
                  Array.isArray(verification.documentsUrl) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Uploaded Documents:</p>
                      {(verification.documentsUrl as string[]).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <FileText className="h-3 w-3" />
                          Document
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this verification? This will
              activate the client's portal access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a detailed reason for rejecting this verification.
              This will be logged for compliance purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="E.g., Document appears tampered, AML sanctions match requires investigation..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 characters required
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectionReason.length < 10}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
