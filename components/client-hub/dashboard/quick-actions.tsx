"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Clock, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClientWizardModal } from "@/components/client-hub/clients/client-wizard-modal";
import { TaskModal } from "@/components/client-hub/tasks/task-modal";
import { TimeEntryModal } from "@/components/client-hub/time/time-entry-modal";
import toast from "react-hot-toast";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);

  const handleSaveClient = (clientData: any) => {
    toast.success("Client added successfully");
    setIsClientModalOpen(false);
  };

  const handleSaveTask = (taskData: any) => {
    toast.success("Task created successfully");
    setIsTaskModalOpen(false);
  };

  const handleSaveTimeEntry = (timeData: any) => {
    toast.success("Time entry logged successfully");
    setIsTimeEntryModalOpen(false);
  };

  const actions = [
    {
      label: "New Task",
      icon: Plus,
      onClick: () => setIsTaskModalOpen(true),
      variant: "default" as const,
    },
    {
      label: "Add Client",
      icon: Users,
      onClick: () => setIsClientModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "Log Time",
      icon: Clock,
      onClick: () => setIsTimeEntryModalOpen(true),
      variant: "outline" as const,
    },
    {
      label: "View Reports",
      icon: BarChart3,
      onClick: () => router.push("/client-hub/reports"),
      variant: "ghost" as const,
    },
  ];

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              variant={action.variant}
              className="w-full justify-start"
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <ClientWizardModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
      />

      <TimeEntryModal
        isOpen={isTimeEntryModalOpen}
        onClose={() => setIsTimeEntryModalOpen(false)}
        onSave={handleSaveTimeEntry}
      />
    </>
  );
}