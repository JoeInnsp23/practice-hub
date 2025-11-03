"use client";

import { BarChart3, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import type { WizardFormData } from "@/components/client-hub/clients/client-wizard-modal";
import { ClientWizardModal } from "@/components/client-hub/clients/client-wizard-modal";
import { TaskModal } from "@/components/client-hub/tasks/task-modal";
import type { TaskFormPayload } from "@/components/client-hub/tasks/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleSaveClient = (_clientData: WizardFormData) => {
    toast.success("Client added successfully");
    setIsClientModalOpen(false);
  };

  const handleSaveTask = (_taskData: TaskFormPayload) => {
    toast.success("Task created successfully");
    setIsTaskModalOpen(false);
  };

  const actions = [
    {
      label: "New Task",
      icon: Plus,
      onClick: () => setIsTaskModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "Add Client",
      icon: Users,
      onClick: () => setIsClientModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "View Reports",
      icon: BarChart3,
      onClick: () => router.push("/client-hub/reports"),
      variant: "secondary" as const,
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
    </>
  );
}
