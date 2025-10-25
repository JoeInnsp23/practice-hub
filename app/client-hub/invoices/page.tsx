"use client";

import {
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { InvoiceForm } from "@/components/client-hub/invoices/invoice-form";
import { InvoiceList } from "@/components/client-hub/invoices/invoice-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils/format";

type Invoice = {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string | Date;
  dueDate: string | Date;
  paidDate: string | Date | null;
  subtotal: string;
  taxRate: string | null;
  taxAmount: string | null;
  discount: string | null;
  total: string;
  amountPaid: string | null;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  currency: string | null;
  notes: string | null;
  terms: string | null;
  purchaseOrderNumber: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export default function InvoicesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled"
  >("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch invoices using tRPC
  const { data: invoicesData } = trpc.invoices.list.useQuery({
    search: debouncedSearchTerm || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as "draft" | "sent" | "paid" | "overdue" | "cancelled")
        : undefined,
  });

  const invoices = invoicesData?.invoices || [];

  // tRPC mutations
  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully");
      utils.invoices.list.invalidate();
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated successfully");
      utils.invoices.list.invalidate();
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted");
      utils.invoices.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated");
      utils.invoices.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Invoices already filtered by tRPC query
  const filteredInvoices = useMemo(() => {
    return invoices;
  }, [invoices]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const paid = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const pending = invoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const overdue = invoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    return {
      total,
      paid,
      pending,
      overdue,
      count: {
        total: invoices.length,
        draft: invoices.filter((inv) => inv.status === "draft").length,
        sent: invoices.filter((inv) => inv.status === "sent").length,
        paid: invoices.filter((inv) => inv.status === "paid").length,
        overdue: invoices.filter((inv) => inv.status === "overdue").length,
      },
    };
  }, [invoices]);

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setIsFormOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = (data: Partial<Invoice>) => {
    // Transform null values to undefined and Dates to strings for API compatibility
    const transformedData = {
      ...data,
      issueDate:
        data.issueDate instanceof Date
          ? data.issueDate.toISOString()
          : data.issueDate,
      dueDate:
        data.dueDate instanceof Date
          ? data.dueDate.toISOString()
          : data.dueDate,
      paidDate:
        data.paidDate instanceof Date
          ? data.paidDate.toISOString()
          : (data.paidDate ?? undefined),
      taxRate: data.taxRate ?? undefined,
      taxAmount: data.taxAmount ?? undefined,
      discount: data.discount ?? undefined,
      currency: data.currency ?? undefined,
      notes: data.notes ?? undefined,
      terms: data.terms ?? undefined,
      purchaseOrderNumber: data.purchaseOrderNumber ?? undefined,
      amountPaid: data.amountPaid ?? undefined,
      metadata: data.metadata ?? undefined,
    };

    if (editingInvoice) {
      updateMutation.mutate({
        id: editingInvoice.id,
        data: transformedData as any,
      });
    } else {
      createMutation.mutate(transformedData as any);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/client-hub/invoices/${invoice.id}`);
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const duplicateData = {
      invoiceNumber: `${invoice.invoiceNumber}-COPY`,
      clientId: invoice.clientId,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      total: invoice.total,
      amountPaid: "0",
      status: "draft" as const,
      currency: invoice.currency,
      notes: invoice.notes,
      terms: invoice.terms,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
    };
    createMutation.mutate(duplicateData);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    updateStatusMutation.mutate({
      id: invoice.id,
      status: "sent",
    });
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.success(`Downloading ${invoice.invoiceNumber}.pdf`);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    if (window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      deleteMutation.mutate(invoice.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your invoices
          </p>
        </div>
        <Button
          onClick={handleCreateInvoice}
          data-testid="invoice-create-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoiced
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count.total} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.paid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count.paid} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count.sent} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count.overdue} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Invoice List</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <InvoiceList
            invoices={filteredInvoices}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDuplicate={handleDuplicateInvoice}
            onSend={handleSendInvoice}
            onDownload={handleDownloadInvoice}
            onDelete={handleDeleteInvoice}
          />
        </div>
      </Card>

      {/* Invoice Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={(editingInvoice || undefined) as any}
            onSave={handleSaveInvoice as any}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
