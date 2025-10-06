export type TaskStatus =
  | "pending"
  | "in_progress"
  | "review"
  | "completed"
  | "cancelled"
  | "blocked"
  | "records_received"
  | "queries_sent"
  | "queries_received";

export type TaskPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical"
  | null;

export interface TaskSummary {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus | null;
  priority: TaskPriority;
  dueDate?: string | Date | null;
  targetDate?: string | Date | null;
  completedAt?: string | Date | null;
  assigneeName?: string | null;
  reviewerName?: string | null;
  clientName?: string | null;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  tags?: string[] | null;
  progress?: number | null;
  workflowName?: string | null;
  category?: string | null;
  clientId?: string | null;
  assignedToId?: string | null;
  reviewerId?: string | null;
  [key: string]: unknown;
}

export type TaskFormStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
export type TaskFormPriority = "low" | "medium" | "high" | "urgent";

export interface TaskFormPayload {
  title: string;
  description?: string;
  status: TaskFormStatus;
  priority: TaskFormPriority;
  client?: string;
  assignee?: { name: string };
  dueDate?: Date;
  estimatedHours?: number;
  category?: string;
  [key: string]: unknown;
}
