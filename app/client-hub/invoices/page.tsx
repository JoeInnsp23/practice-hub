"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceList } from "@/components/client-hub/invoices/invoice-list";
import { InvoiceForm } from "@/components/client-hub/invoices/invoice-form";
import {
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import toast from "react-hot-toast";

// Mock invoice data
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    client: "ABC Company Ltd",
    issueDate: new Date("2024-09-01"),
    dueDate: new Date("2024-09-30"),
    total: 2500.0,
    subtotal: 2000.0,
    taxTotal: 500.0,
    status: "sent" as const,
    paymentTerms: "Net 30",
    lineItems: [
      {
        id: "1",
        description: "Accounting Services - September",
        quantity: 1,
        rate: 2000,
        tax: 25,
        total: 2500,
      },
    ],
  },
  {
    id: "2",
    invoiceNumber: "INV-002",
    client: "XYZ Ltd",
    issueDate: new Date("2024-09-15"),
    dueDate: new Date("2024-10-15"),
    total: 3750.0,
    subtotal: 3000.0,
    taxTotal: 750.0,
    status: "paid" as const,
    paymentTerms: "Net 30",
    lineItems: [
      {
        id: "1",
        description: "Tax Consultation",
        quantity: 5,
        rate: 500,
        tax: 25,
        total: 3125,
      },
      {
        id: "2",
        description: "Document Preparation",
        quantity: 1,
        rate: 500,
        tax: 25,
        total: 625,
      },
    ],
  },
  {
    id: "3",
    invoiceNumber: "INV-003",
    client: "John Doe",
    issueDate: new Date("2024-09-20"),
    dueDate: new Date("2024-09-27"),
    total: 1500.0,
    subtotal: 1200.0,
    taxTotal: 300.0,
    status: "overdue" as const,
    paymentTerms: "Net 7",
    lineItems: [
      {
        id: "1",
        description: "Personal Tax Return 2023-24",
        quantity: 1,
        rate: 1200,
        tax: 25,
        total: 1500,
      },
    ],
  },
  {
    id: "4",
    invoiceNumber: "INV-004",
    client: "Tech Innovations Ltd",
    issueDate: new Date("2024-09-25"),
    dueDate: new Date("2024-10-25"),
    total: 5000.0,
    subtotal: 4000.0,
    taxTotal: 1000.0,
    status: "draft" as const,
    paymentTerms: "Net 30",
    lineItems: [
      {
        id: "1",
        description: "Annual Accounts Preparation",
        quantity: 1,
        rate: 3000,
        tax: 25,
        total: 3750,
      },
      {
        id: "2",
        description: "Corporation Tax Return",
        quantity: 1,
        rate: 1000,
        tax: 25,
        total: 1250,
      },
    ],
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.client.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    return filtered.sort(
      (a, b) => b.issueDate.getTime() - a.issueDate.getTime(),
    );
  }, [invoices, searchTerm, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paid = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
    const pending = invoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdue = invoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

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

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = (data: any) => {
    if (editingInvoice) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingInvoice.id
            ? {
                ...inv,
                ...data,
                issueDate: new Date(data.issueDate),
                dueDate: new Date(data.dueDate),
              }
            : inv,
        ),
      );
      toast.success("Invoice updated successfully");
    } else {
      const newInvoice = {
        ...data,
        id: Date.now().toString(),
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
      };
      setInvoices((prev) => [...prev, newInvoice]);
      toast.success("Invoice created successfully");
    }
    setIsFormOpen(false);
  };

  const handleViewInvoice = (invoice: any) => {
    toast.success(`Viewing invoice ${invoice.invoiceNumber}`);
  };

  const handleDuplicateInvoice = (invoice: any) => {
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: `${invoice.invoiceNumber}-COPY`,
      status: "draft" as const,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    setInvoices((prev) => [...prev, newInvoice]);
    toast.success("Invoice duplicated");
  };

  const handleSendInvoice = (invoice: any) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id ? { ...inv, status: "sent" as const } : inv,
      ),
    );
    toast.success(`Invoice ${invoice.invoiceNumber} sent to client`);
  };

  const handleDownloadInvoice = (invoice: any) => {
    toast.success(`Downloading ${invoice.invoiceNumber}.pdf`);
  };

  const handleDeleteInvoice = (invoice: any) => {
    if (window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));
      toast.success("Invoice deleted");
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
        <Button onClick={handleCreateInvoice}>
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice List</CardTitle>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        </CardHeader>
        <CardContent>
          <InvoiceList
            invoices={filteredInvoices}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDuplicate={handleDuplicateInvoice}
            onSend={handleSendInvoice}
            onDownload={handleDownloadInvoice}
            onDelete={handleDeleteInvoice}
          />
        </CardContent>
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
            invoice={editingInvoice}
            onSave={handleSaveInvoice}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
