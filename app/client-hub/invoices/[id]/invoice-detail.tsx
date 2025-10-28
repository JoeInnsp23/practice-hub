"use client";

import { format } from "date-fns";
import { ArrowLeft, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

interface InvoiceDetailProps {
  invoiceId: string;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const router = useRouter();

  const { data: invoice, isLoading } =
    trpc.invoices.getById.useQuery(invoiceId);

  const updateStatusMutation = trpc.invoices.updateStatus.useMutation();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/client-hub/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: invoiceId,
        status: newStatus as
          | "draft"
          | "sent"
          | "paid"
          | "overdue"
          | "cancelled",
      });
      toast.success("Invoice status updated");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update invoice status";
      toast.error(message);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const value =
      typeof amount === "string" ? Number.parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: invoice.currency || "GBP",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client-hub/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("sent")}
              disabled={updateStatusMutation.isPending}
            >
              <Mail className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("paid")}
              disabled={updateStatusMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">
                  Invoice {invoice.invoiceNumber}
                </CardTitle>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() +
                    invoice.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Created {format(new Date(invoice.createdAt), "PPP")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-3xl font-bold">
                {formatCurrency(invoice.total)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Bill To</h3>
            <div className="space-y-1">
              <p className="font-medium">{invoice.clientName}</p>
              {invoice.clientEmail && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientEmail}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                Issue Date
              </h4>
              <p>{format(new Date(invoice.issueDate), "PPP")}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                Due Date
              </h4>
              <p>{format(new Date(invoice.dueDate), "PPP")}</p>
            </div>
            {invoice.paidDate && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                  Paid Date
                </h4>
                <p>{format(new Date(invoice.paidDate), "PPP")}</p>
              </div>
            )}
          </div>

          {invoice.purchaseOrderNumber && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                Purchase Order
              </h4>
              <p>{invoice.purchaseOrderNumber}</p>
            </div>
          )}

          {invoice.notes && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                Notes
              </h4>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="glass-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount && Number.parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">
                    -{formatCurrency(invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  VAT ({invoice.taxRate}%)
                </span>
                <span>{formatCurrency(invoice.taxAmount || "0")}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amountPaid &&
                Number.parseFloat(invoice.amountPaid) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-green-600">
                        {formatCurrency(invoice.amountPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span>
                        {formatCurrency(
                          Number.parseFloat(invoice.total) -
                            Number.parseFloat(invoice.amountPaid),
                        )}
                      </span>
                    </div>
                  </>
                )}
            </div>
          </div>

          {invoice.terms && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-2">Terms & Conditions</h4>
              <p className="text-sm text-muted-foreground">{invoice.terms}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
