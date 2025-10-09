"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, ExternalLink, Download } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { useClientPortalContext } from "@/contexts/client-portal-context";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvoicesPage() {
  const { currentClientId } = useClientPortalContext();
  const [selectedStatus, setSelectedStatus] = useState<"sent" | "paid" | "overdue" | "cancelled" | undefined>();

  const { data: invoices, isLoading } = trpc.clientPortal.getInvoices.useQuery(
    { clientId: currentClientId!, status: selectedStatus },
    { enabled: !!currentClientId },
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sent</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case "overdue":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!currentClientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Please select a client to view invoices</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Invoices</CardTitle>
          <CardDescription>
            All invoices for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
            <TabsList>
              <TabsTrigger value={undefined as any} onClick={() => setSelectedStatus(undefined)}>
                All
              </TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus || "all"} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading invoices...
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.status === "paid" ? "Paid invoice" : "Invoice"}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="font-medium">
                            £{invoice.total}
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate && format(new Date(invoice.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {invoice.issueDate && format(new Date(invoice.issueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/portal/invoices/${invoice.id}`}>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
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
