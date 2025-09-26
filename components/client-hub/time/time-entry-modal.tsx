"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  selectedDate?: Date;
  selectedEntry?: any;
  clients?: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; name: string; clientId?: string }>;
}

export function TimeEntryModal({
  isOpen,
  onClose,
  onSave,
  selectedDate = new Date(),
  selectedEntry,
  clients = [],
  tasks = [],
}: TimeEntryModalProps) {
  const [formData, setFormData] = useState({
    date: selectedEntry?.date || selectedDate,
    clientId: selectedEntry?.clientId || "",
    taskId: selectedEntry?.taskId || "",
    description: selectedEntry?.description || "",
    hours: selectedEntry?.hours || 0,
    billable: selectedEntry?.billable !== undefined ? selectedEntry.billable : true,
  });

  // Filter tasks based on selected client
  const availableTasks = formData.clientId
    ? tasks.filter((task) => task.clientId === formData.clientId)
    : tasks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hours || formData.hours <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    if (!formData.description) {
      toast.error("Please enter a description");
      return;
    }

    onSave({
      ...formData,
      id: selectedEntry?.id,
      client: clients.find((c) => c.id === formData.clientId)?.name,
      task: tasks.find((t) => t.id === formData.taskId)?.name,
    });

    toast.success(selectedEntry ? "Time entry updated" : "Time entry created");
    onClose();
  };

  const handleReset = () => {
    setFormData({
      date: selectedDate,
      clientId: "",
      taskId: "",
      description: "",
      hours: 0,
      billable: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedEntry ? "Edit Time Entry" : "New Time Entry"}
          </DialogTitle>
          <DialogDescription>
            Record your time spent on client work
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      setFormData({ ...formData, date: date || new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value, taskId: "" })
                }
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task */}
            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select
                value={formData.taskId}
                onValueChange={(value) =>
                  setFormData({ ...formData, taskId: value })
                }
                disabled={!formData.clientId && availableTasks.length === 0}
              >
                <SelectTrigger id="task">
                  <SelectValue placeholder="Select task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What did you work on?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                placeholder="0.00"
                value={formData.hours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Billable */}
            <div className="flex items-center space-x-2">
              <Switch
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, billable: checked })
                }
              />
              <Label htmlFor="billable" className="font-normal">
                Billable time
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit">
              {selectedEntry ? "Update" : "Save"} Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}