"use client";

import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
  showAddActivity?: boolean;
}

// Map action types to icons and colors
const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return { Icon: Plus, color: "text-green-600 dark:text-green-400" };
    case "updated":
    case "edited":
      return { Icon: Edit, color: "text-blue-600 dark:text-blue-400" };
    case "deleted":
      return { Icon: Trash, color: "text-red-600 dark:text-red-400" };
    case "assigned":
    case "reassigned":
      return { Icon: UserPlus, color: "text-purple-600 dark:text-purple-400" };
    case "status_changed":
    case "stage_changed":
      return { Icon: ArrowRight, color: "text-amber-600 dark:text-amber-400" };
    case "email_sent":
      return { Icon: Mail, color: "text-indigo-600 dark:text-indigo-400" };
    case "called":
    case "phone_call":
      return { Icon: Phone, color: "text-cyan-600 dark:text-cyan-400" };
    case "note_added":
    case "commented":
      return {
        Icon: MessageSquare,
        color: "text-slate-600 dark:text-slate-400",
      };
    case "meeting_scheduled":
    case "follow_up_scheduled":
      return { Icon: Calendar, color: "text-orange-600 dark:text-orange-400" };
    case "completed":
      return {
        Icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
      };
    case "rejected":
    case "cancelled":
      return { Icon: XCircle, color: "text-red-600 dark:text-red-400" };
    default:
      return { Icon: Activity, color: "text-slate-600 dark:text-slate-400" };
  }
};

// Group activities by date
const groupActivitiesByDate = (
  activities: Array<{
    id: string;
    action: string;
    description: string | null;
    userName: string | null;
    createdAt: Date;
  }>,
) => {
  const grouped: Record<
    string,
    Array<{
      id: string;
      action: string;
      description: string | null;
      userName: string | null;
      createdAt: Date;
    }>
  > = {};

  for (const activity of activities) {
    const date = new Date(activity.createdAt).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  }

  return grouped;
};

export function ActivityTimeline({
  entityType,
  entityId,
  showAddActivity = true,
}: ActivityTimelineProps) {
  const utils = trpc.useUtils();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newActivityAction, setNewActivityAction] = useState("note_added");
  const [newActivityDescription, setNewActivityDescription] = useState("");

  // Fetch activities
  const { data, isLoading } = trpc.activities.list.useQuery({
    entityType,
    entityId,
    limit: 50,
  });

  const activities = data?.activities || [];

  // Create activity mutation
  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Activity added");
      utils.activities.list.invalidate();
      setIsAddDialogOpen(false);
      setNewActivityDescription("");
      setNewActivityAction("note_added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add activity");
    },
  });

  const handleAddActivity = () => {
    if (!newActivityDescription.trim()) {
      toast.error("Please enter a description");
      return;
    }

    createActivity.mutate({
      entityType,
      entityId,
      action: newActivityAction,
      description: newActivityDescription,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading activities...</div>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);
  const dateGroups = Object.keys(groupedActivities);

  return (
    <div className="space-y-4">
      {/* Add Activity Button */}
      {showAddActivity && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      )}

      {/* Timeline */}
      {dateGroups.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground">
                Activity will appear here as actions are taken
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateGroups.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-sm font-semibold text-foreground">
                  {date}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Activities for this date */}
              <div className="space-y-3 pl-6">
                {groupedActivities[date].map((activity, index) => {
                  const { Icon, color } = getActionIcon(activity.action);
                  const isLast = index === groupedActivities[date].length - 1;

                  return (
                    <div key={activity.id} className="relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
                      )}

                      {/* Activity Item */}
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full bg-background border-2 border-current ${color} flex items-center justify-center`}
                        >
                          <Icon className="h-3 w-3" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <Card className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground line-clamp-2">
                                {activity.description || activity.action}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(
                                  activity.createdAt,
                                ).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {activity.userName && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{activity.userName}</span>
                              </div>
                            )}
                          </Card>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Log a manual activity for this record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Activity Type</Label>
              <Select
                value={newActivityAction}
                onValueChange={setNewActivityAction}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note_added">Note</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="email_sent">Email</SelectItem>
                  <SelectItem value="meeting_scheduled">
                    Meeting Scheduled
                  </SelectItem>
                  <SelectItem value="follow_up_scheduled">
                    Follow-up Scheduled
                  </SelectItem>
                  <SelectItem value="commented">Comment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Enter activity details..."
                value={newActivityDescription}
                onChange={(e) => setNewActivityDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddActivity}
              disabled={createActivity.isPending}
            >
              {createActivity.isPending ? "Adding..." : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
