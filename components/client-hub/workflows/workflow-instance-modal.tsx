"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  service: { name: string; code: string };
  stages: { id: string; name: string; order: number }[];
  estimatedDays: number;
}

interface WorkflowInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  templates: WorkflowTemplate[];
}

// Mock clients data
const mockClients = [
  { id: "1", name: "ABC Company Ltd" },
  { id: "2", name: "XYZ Ltd" },
  { id: "3", name: "Tech Innovations Ltd" },
  { id: "4", name: "Green Solutions Ltd" },
  { id: "5", name: "Global Services Inc" },
];

// Mock assignees data
const mockAssignees = [
  "John Smith",
  "Jane Wilson",
  "Bob Johnson",
  "Alice Brown",
  "Charlie Davis",
];

// Mock tasks without workflows
const mockTasksWithoutWorkflow = [
  { id: "5", title: "Bookkeeping for September", client: "Small Business Co" },
  { id: "7", title: "Client meeting - Tax planning", client: "John Doe" },
  { id: "8", title: "Quarterly review", client: "ABC Company Ltd" },
];

export function WorkflowInstanceModal({
  isOpen,
  onClose,
  onSave,
  templates,
}: WorkflowInstanceModalProps) {
  const [taskMode, setTaskMode] = useState<"existing" | "new">("existing");
  const [formData, setFormData] = useState({
    name: "",
    client: null as any,
    template: null as any,
    dueDate: null as Date | null,
    assignee: "",
    notes: "",
    // For existing task
    existingTask: null as any,
    // For new task
    taskTitle: "",
    taskDescription: "",
    taskPriority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on mode
    if (taskMode === "existing" && !formData.existingTask) {
      return;
    }
    if (taskMode === "new" && (!formData.taskTitle || !formData.client)) {
      return;
    }
    if (!formData.template || !formData.dueDate || !formData.assignee) {
      return;
    }

    onSave({
      ...formData,
      taskMode,
    });
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: "",
      client: null,
      template: null,
      dueDate: null,
      assignee: "",
      notes: "",
      existingTask: null,
      taskTitle: "",
      taskDescription: "",
      taskPriority: "medium",
    });
    setTaskMode("existing");
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template,
        name: template.name, // Auto-fill name with template name
      });
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = mockClients.find((c) => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client,
        // Update name if template is selected
        name: formData.template
          ? `${formData.template.name} - ${client.name}`
          : formData.name,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Assign a workflow template to a task to track progress through
            stages
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Mode Selection */}
          <div className="space-y-3">
            <Label>Assign Workflow To</Label>
            <RadioGroup
              value={taskMode}
              onValueChange={(value) =>
                setTaskMode(value as "existing" | "new")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label
                  htmlFor="existing"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  Existing Task (without workflow)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label
                  htmlFor="new"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create New Task
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Task Selection/Creation based on mode */}
          {taskMode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="task">Select Task *</Label>
              <Select
                value={formData.existingTask?.id}
                onValueChange={(value) => {
                  const task = mockTasksWithoutWorkflow.find(
                    (t) => t.id === value,
                  );
                  setFormData({ ...formData, existingTask: task });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task without workflow" />
                </SelectTrigger>
                <SelectContent>
                  {mockTasksWithoutWorkflow.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Client: {task.client}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={formData.taskTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, taskTitle: e.target.value })
                  }
                  placeholder="Enter task title"
                  required={taskMode === "new"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDescription">Task Description</Label>
                <Textarea
                  id="taskDescription"
                  value={formData.taskDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taskDescription: e.target.value,
                    })
                  }
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.taskPriority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, taskPriority: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Workflow Template *</Label>
            <Select onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.service.name} • {template.stages.length}{" "}
                        stages • Est. {template.estimatedDays} days
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection (only for new tasks) */}
          {taskMode === "new" && (
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Workflow Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter workflow name"
              required
            />
            <p className="text-xs text-muted-foreground">
              You can customize the workflow name or use the auto-generated one
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP")
                  ) : (
                    <span>Pick a due date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dueDate || undefined}
                  onSelect={(date) =>
                    setFormData({ ...formData, dueDate: date || null })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee *</Label>
            <Select
              value={formData.assignee}
              onValueChange={(value) =>
                setFormData({ ...formData, assignee: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an assignee" />
              </SelectTrigger>
              <SelectContent>
                {mockAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any additional notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.client ||
                !formData.template ||
                !formData.dueDate ||
                !formData.assignee ||
                !formData.name
              }
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
