"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } =
    trpc.clientPortal.getInvoiceById.useQuery({
      id: invoiceId,
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Draft
          </Badge>
        );
      case "sent":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Sent
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Paid
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Overdue
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
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-destructive opacity-50" />
          <p className="text-destructive font-medium mb-2">Invoice not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/portal/invoices")}
          >
            Back to Invoices
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
            onClick={() => router.push("/portal/invoices")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">
              Invoice {invoice.invoiceNumber}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status)}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{invoice.total}</div>
            {invoice.taxAmount && Number(invoice.taxAmount) > 0 && (
              <p className="text-xs text-muted-foreground">
                Inc. VAT: £{invoice.taxAmount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoice.dueDate
                ? format(new Date(invoice.dueDate), "MMM d")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoice.dueDate
                ? format(new Date(invoice.dueDate), "yyyy")
                : "Not set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoice.issueDate
                ? format(new Date(invoice.issueDate), "MMM d")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoice.issueDate
                ? format(new Date(invoice.issueDate), "yyyy")
                : "Not issued"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>Charges breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">£{invoice.subtotal}</span>
            </div>
            {invoice.taxAmount && Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  VAT ({invoice.taxRate || "20"}%)
                </span>
                <span className="font-medium">£{invoice.taxAmount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between py-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">£{invoice.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      {invoice.status === "paid" && invoice.paidDate && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Date:</span>
                <span className="font-medium">
                  {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
