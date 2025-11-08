"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  sortBy:
    | "invoiceNumber"
    | "clientId"
    | "issueDate"
    | "dueDate"
    | "total"
    | "status"
    | null;
  sortOrder: "asc" | "desc";
  onSort: (
    column:
      | "invoiceNumber"
      | "clientId"
      | "issueDate"
      | "dueDate"
      | "total"
      | "status",
  ) => void;
}

export function InvoiceList({
  invoices,
  onView,
  onEdit,
  onDuplicate,
  onSend,
  onDownload,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: InvoiceListProps) {
  const getSortIcon = (
    column:
      | "invoiceNumber"
      | "clientId"
      | "issueDate"
      | "dueDate"
      | "total"
      | "status",
  ) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };
  const getStatusBadge = (status: Invoice["status"]) => {
    const config = {
      draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
      sent: { label: "Sent", className: "bg-primary/10 text-primary" },
      paid: {
        label: "Paid",
        className:
          "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
      },
      overdue: {
        label: "Overdue",
        className: "bg-destructive/10 text-destructive",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-muted text-muted-foreground",
      },
    };

    const { label, className } = config[status];
    return (
      <Badge variant="secondary" className={cn(className)}>
        {label}
      </Badge>
    );
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("invoiceNumber")}
              >
                Invoice #{getSortIcon("invoiceNumber")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("clientId")}
              >
                Client
                {getSortIcon("clientId")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("issueDate")}
              >
                Issue Date
                {getSortIcon("issueDate")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("dueDate")}
              >
                Due Date
                {getSortIcon("dueDate")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("total")}
              >
                Amount
                {getSortIcon("total")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("status")}
              >
                Status
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const daysUntilDue = getDaysUntilDue(new Date(invoice.dueDate));
              const isOverdue = daysUntilDue < 0 && invoice.status !== "paid";

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.clientId}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(invoice.dueDate)}</span>
                      {invoice.status !== "paid" && (
                        <span
                          className={cn(
                            "text-xs",
                            isOverdue
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : `${daysUntilDue} days left`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(parseFloat(invoice.total))}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => onEdit(invoice)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDuplicate(invoice)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => onSend(invoice)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDownload(invoice)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(invoice)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
