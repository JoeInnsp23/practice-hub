"use client";

import {
  Clock,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";

interface Client {
  id: string;
  clientCode: string;
  name: string;
  type: string | null;
  status: string | null;
  email?: string | null;
  phone?: string | null;
  accountManager?: string | null;
  createdAt: Date;
}

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({
  clients,
  onView,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: Client["status"]) => {
    if (!status) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      active: { label: "Active", variant: "default" as const },
      inactive: { label: "Inactive", variant: "secondary" as const },
      prospect: { label: "Prospect", variant: "outline" as const },
      onboarding: { label: "Onboarding", variant: "outline" as const },
      archived: { label: "Archived", variant: "destructive" as const },
    };

    const config = statusConfig[status];
    if (!config) {
      return <Badge variant="secondary">{status}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: Client["type"]) => {
    if (!type) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    const typeConfig: Record<string, { label: string }> = {
      individual: { label: "Individual" },
      company: { label: "Company" },
      trust: { label: "Trust" },
      partnership: { label: "Partnership" },
    };

    const config = typeConfig[type];
    if (!config) {
      return <Badge variant="secondary">{type}</Badge>;
    }
    return <Badge variant="secondary">{config.label}</Badge>;
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No clients found</p>
      </div>
    );
  }

  return (
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
          <TableRow
            key={client.id}
            className="table-row cursor-pointer"
            onClick={() => router.push(`/client-hub/clients/${client.id}`)}
          >
            <TableCell className="font-medium">{client.clientCode}</TableCell>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{getTypeBadge(client.type)}</TableCell>
            <TableCell>{getStatusBadge(client.status)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {client.email || "-"}
            </TableCell>
            <TableCell>{client.accountManager || "-"}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(client.createdAt)}
            </TableCell>
            <TableCell
              className="text-right"
              onClick={(e) => e.stopPropagation()}
            >
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
                    className="text-destructive"
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
  );
}
