"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, FileText, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  clientCode: string;
  name: string;
  type: "individual" | "company" | "trust" | "partnership";
  status: "active" | "inactive" | "prospect" | "archived";
  email?: string;
  phone?: string;
  accountManager?: string;
  createdAt: Date;
}

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({ clients, onView, onEdit, onDelete }: ClientsTableProps) {
  const getStatusBadge = (status: Client["status"]) => {
    const statusConfig = {
      active: { label: "Active", className: "bg-green-100 text-green-800" },
      inactive: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
      prospect: { label: "Prospect", className: "bg-blue-100 text-blue-800" },
      archived: { label: "Archived", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="secondary" className={cn(config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: Client["type"]) => {
    const typeConfig = {
      individual: { label: "Individual", className: "bg-purple-100 text-purple-800" },
      company: { label: "Company", className: "bg-blue-100 text-blue-800" },
      trust: { label: "Trust", className: "bg-orange-100 text-orange-800" },
      partnership: { label: "Partnership", className: "bg-indigo-100 text-indigo-800" },
    };

    const config = typeConfig[type];
    return (
      <Badge variant="secondary" className={cn(config.className)}>
        {config.label}
      </Badge>
    );
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No clients found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Account Manager</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.clientCode}</TableCell>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{getTypeBadge(client.type)}</TableCell>
              <TableCell>{getStatusBadge(client.status)}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {client.email || "-"}
              </TableCell>
              <TableCell>{client.accountManager || "-"}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(client.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(client)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Clock className="mr-2 h-4 w-4" />
                      View Tasks
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(client)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}