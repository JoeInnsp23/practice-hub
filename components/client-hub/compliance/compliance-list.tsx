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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface ComplianceItem {
  id: string;
  title: string;
  client: string;
  type: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  notes?: string;
  completedDate?: Date;
}

interface ComplianceListProps {
  items: ComplianceItem[];
  onEdit: (item: ComplianceItem) => void;
  onDelete: (item: ComplianceItem) => void;
  onStatusChange: (item: ComplianceItem, status: string) => void;
  onComplete: (item: ComplianceItem) => void;
}

export function ComplianceList({
  items,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
}: ComplianceListProps) {
  const getStatusBadge = (status: ComplianceItem["status"]) => {
    const config = {
      pending: {
        label: "Pending",
        icon: Clock,
        className: "bg-gray-100 text-gray-800",
      },
      in_progress: {
        label: "In Progress",
        icon: Clock,
        className: "bg-blue-100 text-blue-800",
      },
      completed: {
        label: "Completed",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800",
      },
      overdue: {
        label: "Overdue",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800",
      },
    };

    const { label, icon: Icon, className } = config[status];
    return (
      <Badge variant="secondary" className={cn(className)}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ComplianceItem["priority"]) => {
    const config = {
      low: {
        label: "Low",
        className: "bg-gray-100 text-gray-800",
      },
      medium: {
        label: "Medium",
        className: "bg-yellow-100 text-yellow-800",
      },
      high: {
        label: "High",
        className: "bg-orange-100 text-orange-800",
      },
      urgent: {
        label: "Urgent",
        icon: AlertTriangle,
        className: "bg-red-100 text-red-800",
      },
    };

    const { label, icon: Icon, className } = config[priority];
    return (
      <Badge variant="secondary" className={cn(className)}>
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {label}
      </Badge>
    );
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-slate-600">
                No compliance items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const daysUntilDue = getDaysUntilDue(item.dueDate);
              const isOverdue = daysUntilDue < 0 && item.status !== "completed";

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={item.status === "completed"}
                      onCheckedChange={() => onComplete(item)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(item.dueDate)}</span>
                      {item.status !== "completed" && (
                        <span
                          className={cn(
                            "text-xs",
                            isOverdue ? "text-red-600 font-semibold" : "text-slate-600"
                          )}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0
                            ? "Due today"
                            : `${daysUntilDue} days left`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.assignee || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(item, "in_progress")}>
                          <Clock className="mr-2 h-4 w-4" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onComplete(item)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item)}
                          className="text-red-600"
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