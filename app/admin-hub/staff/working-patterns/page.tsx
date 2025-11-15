"use client";

import { format } from "date-fns";
import { Calendar, Clock, Plus, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { WorkingPatternFormDialog } from "@/components/admin/staff/working-pattern-form-dialog";
import { WorkingPatternHistoryDialog } from "@/components/admin/staff/working-pattern-history-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkingPattern } from "@/lib/trpc/types";

// Pattern type labels
const PATTERN_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  compressed_hours: "Compressed Hours",
  job_share: "Job Share",
  custom: "Custom",
};

// Pattern type badge colors
const PATTERN_TYPE_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  full_time: "default",
  part_time: "secondary",
  compressed_hours: "outline",
  job_share: "outline",
  custom: "outline",
};

export default function WorkingPatternsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingPattern, setEditingPattern] = useState<WorkingPattern | null>(
    null,
  );

  // Fetch all working patterns
  const { data, isLoading, refetch } = trpc.workingPatterns.list.useQuery({});

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    setEditingPattern(null);
    refetch();
  };

  const handleEdit = (pattern: WorkingPattern) => {
    setEditingPattern(pattern);
    setShowCreateDialog(true);
  };

  const handleViewHistory = (userId: string) => {
    setSelectedUserId(userId);
    setShowHistoryDialog(true);
  };

  // Format working pattern summary (e.g., "Mon-Thu 9h, Fri off (36h/week)")
  const formatPatternSummary = (pattern: WorkingPattern): string => {
    const days = [
      { name: "Mon", hours: pattern.mondayHours },
      { name: "Tue", hours: pattern.tuesdayHours },
      { name: "Wed", hours: pattern.wednesdayHours },
      { name: "Thu", hours: pattern.thursdayHours },
      { name: "Fri", hours: pattern.fridayHours },
      { name: "Sat", hours: pattern.saturdayHours },
      { name: "Sun", hours: pattern.sundayHours },
    ];

    const workingDays = days.filter((d) => d.hours > 0);
    const offDays = days.filter((d) => d.hours === 0);

    let summary = "";

    if (workingDays.length > 0) {
      // Group consecutive days with same hours
      const groups: Array<{
        days: string[];
        hours: number;
      }> = [];
      let currentGroup: { days: string[]; hours: number } | null = null;

      for (const day of workingDays) {
        if (!currentGroup || currentGroup.hours !== day.hours) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { days: [day.name], hours: day.hours };
        } else {
          currentGroup.days.push(day.name);
        }
      }
      if (currentGroup) groups.push(currentGroup);

      summary = groups
        .map((g) => {
          const dayStr =
            g.days.length === 1
              ? g.days[0]
              : `${g.days[0]}-${g.days[g.days.length - 1]}`;
          return `${dayStr} ${g.hours}h`;
        })
        .join(", ");
    }

    if (offDays.length > 0 && offDays.length < 7) {
      const offStr =
        offDays.length === 1
          ? offDays[0].name
          : `${offDays[0].name}-${offDays[offDays.length - 1].name}`;
      summary += summary ? `, ${offStr} off` : `${offStr} off`;
    }

    return `${summary} (${pattern.contractedHours}h/week)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Working Patterns</h1>
          <p className="text-muted-foreground">
            Manage flexible working arrangements with day-by-day hour tracking
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Working Pattern
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patterns
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.workingPatterns?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active working patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Full-Time Staff
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.workingPatterns?.filter(
                (p) => p.patternType === "full_time",
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Standard patterns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flexible Patterns
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.workingPatterns?.filter(
                (p) =>
                  p.patternType !== "full_time" && p.contractedHours < 37.5,
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Part-time & compressed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Working Patterns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Working Patterns</CardTitle>
          <CardDescription>
            View and manage staff working patterns with day-by-day schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Pattern Type</TableHead>
                  <TableHead>Weekly Schedule</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  [
                    "skeleton-0",
                    "skeleton-1",
                    "skeleton-2",
                    "skeleton-3",
                    "skeleton-4",
                  ].map((key) => (
                    <TableRow key={key}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data?.workingPatterns && data.workingPatterns.length > 0 ? (
                  data.workingPatterns.map((pattern) => (
                    <TableRow key={pattern.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pattern.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {pattern.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            PATTERN_TYPE_COLORS[pattern.patternType] ||
                            "outline"
                          }
                        >
                          {PATTERN_TYPE_LABELS[pattern.patternType] ||
                            pattern.patternType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatPatternSummary(pattern)}
                        </div>
                        {pattern.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {pattern.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(
                            new Date(pattern.effectiveFrom),
                            "MMM d, yyyy",
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(pattern.userId)}
                          >
                            History
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pattern)}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No working patterns found. Create your first pattern to
                      get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <WorkingPatternFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingPattern(null);
        }}
        onSuccess={handleCreateSuccess}
        editingPattern={editingPattern}
      />

      {selectedUserId && (
        <WorkingPatternHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          userId={selectedUserId}
        />
      )}
    </div>
  );
}
