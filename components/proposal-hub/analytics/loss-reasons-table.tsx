"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LossReason {
  reason: string;
  count: number;
  percentage: number;
}

interface LossReasonsTableProps {
  data: { reasons: LossReason[]; totalLost: number } | undefined;
  isLoading?: boolean;
}

export function LossReasonsTable({
  data,
  isLoading = false,
}: LossReasonsTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Loss Reasons
          </h3>
          <p className="text-sm text-muted-foreground">Why deals were lost</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading data...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.reasons.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Loss Reasons
          </h3>
          <p className="text-sm text-muted-foreground">Why deals were lost</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No lost deals</p>
            <p className="text-xs text-muted-foreground mt-1">
              Loss reasons will appear here when deals are marked as lost
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Loss Reasons</h3>
        <p className="text-sm text-muted-foreground">
          {data.totalLost} lost deals analyzed
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reasons.map((reason) => (
                <TableRow key={reason.reason}>
                  <TableCell className="font-medium">{reason.reason}</TableCell>
                  <TableCell className="text-right">{reason.count}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {reason.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
