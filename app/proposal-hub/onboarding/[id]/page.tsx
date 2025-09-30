"use client";

import {
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  FileText,
  Mail,
  Phone,
  UserCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();

  // Fetch onboarding session with tasks
  const { data: sessionData, isLoading } = trpc.onboarding.getById.useQuery(id);

  // Update task mutation
  const { mutate: updateTask } = trpc.onboarding.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      utils.onboarding.getById.invalidate(id);
      utils.onboarding.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  // Update session mutation
  const { mutate: updateSession } = trpc.onboarding.updateSession.useMutation({
    onSuccess: () => {
      toast.success("Session updated");
      utils.onboarding.getById.invalidate(id);
      utils.onboarding.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update session");
    },
  });

  const handleTaskToggle = (taskId: string, done: boolean) => {
    updateTask({ taskId, done });
  };

  const handleTaskNotesBlur = (taskId: string) => {
    const notes = taskNotes[taskId];
    if (notes !== undefined) {
      updateTask({ taskId, notes });
    }
  };

  const handleStatusChange = (
    status: "not_started" | "in_progress" | "completed",
  ) => {
    updateSession({ sessionId: id, status });
  };

  const handlePriorityChange = (priority: "low" | "medium" | "high") => {
    updateSession({ sessionId: id, priority });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: { label: "Not Started", variant: "secondary" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    return (
      <Badge
        variant={config.variant}
        className={
          status === "completed"
            ? "bg-green-600 hover:bg-green-700"
            : status === "in_progress"
              ? "bg-blue-600 hover:bg-blue-700"
              : ""
        }
      >
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Low", variant: "outline" as const },
      medium: { label: "Medium", variant: "secondary" as const },
      high: { label: "High", variant: "destructive" as const },
    };
    const config =
      priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">
          Loading onboarding details...
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Onboarding session not found</p>
        <Button onClick={() => router.push("/proposal-hub/onboarding")}>
          Back to Onboarding
        </Button>
      </div>
    );
  }

  const completedTasks = sessionData.tasks.filter((t) => t.done).length;
  const totalTasks = sessionData.tasks.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push("/proposal-hub/onboarding")}
            className="rounded-full p-3 hover:bg-primary/10"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={3} />
          </Button>
          <div className="border-l pl-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {sessionData.clientName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground font-mono">
                {sessionData.clientCode}
              </span>
              {getStatusBadge(sessionData.status)}
              {getPriorityBadge(sessionData.priority)}
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                Account Manager: {sessionData.accountManagerName || "Unassigned"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/client-hub/clients/${sessionData.clientId}`)}
          >
            View Client Record
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Progress</span>
          </div>
          <p className="text-2xl font-bold">
            {completedTasks}/{totalTasks} tasks
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {sessionData.progress}% complete
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Start Date</span>
          </div>
          <p className="text-lg font-medium">
            {format(new Date(sessionData.startDate), "MMM d, yyyy")}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Target Completion
            </span>
          </div>
          <p className="text-lg font-medium">
            {sessionData.targetCompletionDate
              ? format(new Date(sessionData.targetCompletionDate), "MMM d, yyyy")
              : "—"}
          </p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Onboarding Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {sessionData.progress}%
                  </span>
                </div>
                <Progress value={sessionData.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Task Checklist */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Onboarding Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {sessionData.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    task.done
                      ? "bg-muted/50 border-green-200 dark:border-green-900"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleTaskToggle(task.id, !task.done)}
                      className="mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0 hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 space-y-2">
                      <div
                        onClick={() => handleTaskToggle(task.id, !task.done)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`text-base font-medium ${
                              task.done ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            <span className="text-xs text-muted-foreground mr-2">
                              {task.sequence}.
                            </span>
                            {task.taskName}
                            {task.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Due: {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          </div>
                        )}
                        {task.completionDate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>
                              Completed:{" "}
                              {format(new Date(task.completionDate), "MMM d")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`notes-${task.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Notes
                        </Label>
                        <Textarea
                          id={`notes-${task.id}`}
                          placeholder="Add notes..."
                          value={taskNotes[task.id] ?? task.notes ?? ""}
                          onChange={(e) =>
                            setTaskNotes({
                              ...taskNotes,
                              [task.id]: e.target.value,
                            })
                          }
                          onBlur={() => handleTaskNotesBlur(task.id)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Session Info */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              {sessionData.clientEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">
                      {sessionData.clientEmail}
                    </p>
                  </div>
                </div>
              )}

              {sessionData.clientPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">
                      {sessionData.clientPhone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Client Added</p>
                  <p className="font-medium text-sm">
                    {format(new Date(sessionData.clientCreatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Manager</p>
                <p className="text-sm font-medium">
                  {sessionData.accountManagerName || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                <p className="text-sm font-medium">
                  {format(new Date(sessionData.startDate), "MMM d, yyyy")}
                </p>
              </div>

              {sessionData.actualCompletionDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Completed On
                  </p>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(sessionData.actualCompletionDate),
                      "MMM d, yyyy",
                    )}
                  </p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Update Status</Label>
                <Select
                  value={sessionData.status}
                  onValueChange={(value: any) => handleStatusChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Change Priority</Label>
                <Select
                  value={sessionData.priority}
                  onValueChange={(value: any) => handlePriorityChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/client-hub/clients/${sessionData.clientId}`)
                }
              >
                View Client Record
              </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
