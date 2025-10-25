"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

interface StaffMember {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  departmentName?: string | null;
  totalLoggedHours: number;
  capacityHours: number;
  utilization: number;
  billablePercentage: number;
  status: "overallocated" | "underutilized" | "optimal";
}

interface StaffComparisonTableProps {
  startDate: string;
  endDate: string;
  onExport?: (data: StaffMember[]) => void;
}

export function StaffComparisonTable({
  startDate,
  endDate,
  onExport,
}: StaffComparisonTableProps) {
  const [sortBy, setSortBy] = useState<
    "name" | "role" | "department" | "hours" | "utilization"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "overallocated" | "underutilized" | "optimal"
  >("all");

  // Fetch comparison data with sorting
  const { data, isLoading } = trpc.staffStatistics.getStaffComparison.useQuery({
    startDate,
    endDate,
    sortBy,
    sortOrder,
    status: statusFilter,
  });

  const handleSort = (
    column: "name" | "role" | "department" | "hours" | "utilization",
  ) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (
    column: "name" | "role" | "department" | "hours" | "utilization",
  ) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const getStatusBadge = (
    status: "overallocated" | "underutilized" | "optimal",
  ) => {
    const config = {
      overallocated: {
        label: "Overallocated",
        className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      },
      underutilized: {
        label: "Underutilized",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      },
      optimal: {
        label: "Optimal",
        className:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      },
    };

    const { label, className } = config[status];
    return <Badge className={className}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No staff data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <div className="flex justify-between items-center">
        <Select
          value={statusFilter}
          onValueChange={(
            value: "all" | "overallocated" | "underutilized" | "optimal",
          ) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="overallocated">Overallocated</SelectItem>
            <SelectItem value="underutilized">Underutilized</SelectItem>
            <SelectItem value="optimal">Optimal</SelectItem>
          </SelectContent>
        </Select>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(data.staff)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSort("name")}
                >
                  Name
                  {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSort("role")}
                >
                  Role
                  {getSortIcon("role")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSort("department")}
                >
                  Department
                  {getSortIcon("department")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSort("hours")}
                >
                  Logged Hours
                  {getSortIcon("hours")}
                </Button>
              </TableHead>
              <TableHead className="text-right">Capacity Hours</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSort("utilization")}
                >
                  Utilization
                  {getSortIcon("utilization")}
                </Button>
              </TableHead>
              <TableHead className="text-right">Billable %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.staff.map((staff) => (
              <TableRow key={staff.userId}>
                <TableCell className="font-medium">
                  {staff.firstName} {staff.lastName}
                </TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>{staff.departmentName || "N/A"}</TableCell>
                <TableCell className="text-right">
                  {staff.totalLoggedHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {staff.capacityHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-semibold ${
                      staff.utilization > 100
                        ? "text-red-600"
                        : staff.utilization < 60
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {staff.utilization}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-blue-600 dark:text-blue-400">
                  {staff.billablePercentage}%
                </TableCell>
                <TableCell>{getStatusBadge(staff.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {data.total} staff member{data.total !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
