import { Metadata } from "next";
import TaskDetails from "./task-details";

export const metadata: Metadata = {
  title: "Task Details | Practice Hub",
  description: "View and manage task details",
};

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  // In a real app, fetch task data from database here
  // For now, we'll pass the ID to the client component which has the mock data

  return <TaskDetails taskId={id} />;
}
