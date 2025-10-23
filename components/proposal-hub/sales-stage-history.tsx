"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Bot, User } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Card } from "@/components/ui/card";
import { SALES_STAGES } from "@/lib/constants/sales-stages";
import { calculateTimeInStage } from "@/lib/utils/sales-stage-automation";

interface SalesStageHistoryProps {
  proposalId: string;
}

export function SalesStageHistory({ proposalId }: SalesStageHistoryProps) {
  // Fetch activity logs for this proposal (sales stage changes only)
  const { data: activitiesData, isLoading } =
    trpc.activityLogs.getByEntity.useQuery({
      entityType: "proposal",
      entityId: proposalId,
    });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Stage History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading history...</div>
        </div>
      </Card>
    );
  }

  // Filter for sales stage related activities only
  const stageActivities =
    activitiesData?.activities?.filter(
      (a) =>
        a.action === "sales_stage_updated" ||
        a.action === "sales_stage_automated",
    ) || [];

  if (stageActivities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Stage History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No stage transitions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Stage changes will appear here when the proposal moves through the
              pipeline
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Sort by date descending (most recent first)
  const sortedActivities = [...stageActivities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Calculate time in each stage
  const activitiesWithDuration = sortedActivities.map((activity, index) => {
    const nextActivity = sortedActivities[index + 1];
    const duration = nextActivity
      ? calculateTimeInStage(
          new Date(nextActivity.createdAt),
          new Date(activity.createdAt),
        )
      : calculateTimeInStage(new Date(activity.createdAt)); // Current stage

    return {
      ...activity,
      duration,
      isCurrentStage: index === 0,
    };
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Sales Stage History</h3>

      {/* Timeline */}
      <div className="space-y-4">
        {activitiesWithDuration.map((activity) => {
          const oldStage = activity.oldValues?.salesStage as string | undefined;
          const newStage = activity.newValues?.salesStage as string | undefined;
          const isAutomated = activity.action === "sales_stage_automated";

          const oldStageConfig = oldStage
            ? SALES_STAGES[oldStage as keyof typeof SALES_STAGES]
            : null;
          const newStageConfig = newStage
            ? SALES_STAGES[newStage as keyof typeof SALES_STAGES]
            : null;

          const OldIcon = oldStageConfig?.icon;
          const NewIcon = newStageConfig?.icon;

          return (
            <div
              key={activity.id}
              className={`
                relative pl-8 pb-4 border-l-2
                ${activity.isCurrentStage ? "border-primary" : "border-border"}
              `}
            >
              {/* Icon */}
              <div
                className={`
                  absolute -left-4 top-0 w-8 h-8 rounded-full
                  flex items-center justify-center
                  ${activity.isCurrentStage ? "bg-primary" : "bg-muted"}
                `}
              >
                {isAutomated ? (
                  <Bot
                    className={`h-4 w-4 ${activity.isCurrentStage ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                ) : (
                  <User
                    className={`h-4 w-4 ${activity.isCurrentStage ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                )}
              </div>

              {/* Content */}
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {/* Old Stage */}
                    {OldIcon && oldStageConfig && (
                      <>
                        <div className="flex items-center gap-1">
                          <OldIcon
                            className={`h-4 w-4 ${oldStageConfig.color}`}
                          />
                          <span className="text-sm font-medium">
                            {oldStageConfig.label}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}

                    {/* New Stage */}
                    {NewIcon && newStageConfig && (
                      <div className="flex items-center gap-1">
                        <NewIcon
                          className={`h-4 w-4 ${newStageConfig.color}`}
                        />
                        <span
                          className={`text-sm font-medium ${activity.isCurrentStage ? "text-primary" : ""}`}
                        >
                          {newStageConfig.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Duration Badge */}
                  {activity.duration > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {activity.duration}{" "}
                      {activity.duration === 1 ? "day" : "days"}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    {isAutomated ? "Automated" : activity.userName || "Unknown"}
                  </span>
                  <span>•</span>
                  <span title={format(new Date(activity.createdAt), "PPpp")}>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Transitions</p>
            <p className="text-xl font-semibold">{stageActivities.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Automated Changes</p>
            <p className="text-xl font-semibold">
              {
                stageActivities.filter(
                  (a) => a.action === "sales_stage_automated",
                ).length
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
