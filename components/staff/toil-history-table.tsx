"use client";

import { Calendar, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ToilHistoryRecord {
  id: string;
  weekEnding: string;
  hoursAccrued: number;
  loggedHours: number;
  contractedHours: number;
  expiryDate: string;
  expired: boolean;
  timesheetId: string | null;
}

interface ToilHistoryTableProps {
  history: ToilHistoryRecord[];
  onViewTimesheet?: (timesheetId: string) => void;
}

export function ToilHistoryTable({
  history,
  onViewTimesheet,
}: ToilHistoryTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (expired: boolean) => {
    if (expired) {
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400 border-green-200 dark:border-green-900">
        Active
      </Badge>
    );
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">
          No TOIL accrual history
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          TOIL will appear here when timesheets with overtime hours are approved
        </p>
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week Ending</TableHead>
            <TableHead className="text-right">Hours Worked</TableHead>
            <TableHead className="text-right">Contracted</TableHead>
            <TableHead className="text-right">TOIL Earned</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {formatDate(record.weekEnding)}
              </TableCell>
              <TableCell className="text-right">
                {record.loggedHours.toFixed(1)} hrs
              </TableCell>
              <TableCell className="text-right">
                {record.contractedHours.toFixed(1)} hrs
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {record.hoursAccrued.toFixed(1)} hrs
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(record.expiryDate)}
              </TableCell>
              <TableCell>{getStatusBadge(record.expired)}</TableCell>
              <TableCell className="text-right">
                {record.timesheetId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onViewTimesheet) {
                        onViewTimesheet(record.timesheetId!);
                      } else {
                        router.push(
                          `/practice-hub/timesheets/${record.timesheetId}`,
                        );
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Timesheet
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
