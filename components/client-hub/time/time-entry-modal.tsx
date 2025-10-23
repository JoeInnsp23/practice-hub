"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useWorkTypes, useWorkTypeByCode } from "@/lib/hooks/use-work-types";
import {
  useDeleteTimeEntry,
  useUpdateTimeEntry,
} from "@/lib/hooks/use-time-entries";
import { cn } from "@/lib/utils";

export interface TimeEntryFormData {
  date: Date;
  clientId?: string;
  taskId?: string;
  description: string;
  hours: number;
  billable: boolean;
  workType: string;
  startTime: string;
  endTime: string;
  fullDescription: string;
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimeEntryFormData) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  selectedDate?: Date;
  selectedEntry?: Partial<TimeEntryFormData> & { id?: string };
  selectedHour?: number | null;
  clients?: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; name: string; clientId?: string }>;
}

export function TimeEntryModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  selectedDate = new Date(),
  selectedEntry,
  selectedHour,
  clients = [],
  tasks = [],
}: TimeEntryModalProps) {
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();

  // Fetch work types from database
  const { data: workTypesData } = useWorkTypes();
  const workTypes = workTypesData?.workTypes || [];

  const getDefaultStartTime = useCallback(() => {
    if (selectedEntry?.startTime) return selectedEntry.startTime;
    if (selectedHour !== null && selectedHour !== undefined) {
      return `${selectedHour.toString().padStart(2, "0")}:00`;
    }
    return "09:00";
  }, [selectedEntry, selectedHour]);

  const getDefaultEndTime = useCallback(() => {
    if (selectedEntry?.endTime) return selectedEntry.endTime;
    if (selectedHour !== null && selectedHour !== undefined) {
      const endHour = selectedHour + 1;
      return `${endHour.toString().padStart(2, "0")}:00`;
    }
    return "10:00";
  }, [selectedEntry, selectedHour]);

  const [formData, setFormData] = useState<TimeEntryFormData>({
    date: selectedEntry?.date || selectedDate,
    clientId: selectedEntry?.clientId || "none",
    taskId: selectedEntry?.taskId || "none",
    description: selectedEntry?.description || "",
    hours: selectedEntry?.hours || 1,
    billable:
      selectedEntry?.billable !== undefined ? selectedEntry.billable : false,
    workType: selectedEntry?.workType || "WORK",
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    fullDescription: selectedEntry?.fullDescription || "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form data when props change
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: selectedEntry?.date || selectedDate,
        clientId: selectedEntry?.clientId || "none",
        taskId: selectedEntry?.taskId || "none",
        description: selectedEntry?.description || "",
        hours: selectedEntry?.hours || 1,
        billable:
          selectedEntry?.billable !== undefined
            ? selectedEntry.billable
            : false,
        workType: selectedEntry?.workType || "WORK",
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
        fullDescription: selectedEntry?.fullDescription || "",
      });
    }
  }, [
    isOpen,
    selectedDate,
    selectedEntry,
    getDefaultEndTime,
    getDefaultStartTime,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter tasks based on selected client
  const availableTasks =
    formData.clientId && formData.clientId !== "none"
      ? tasks.filter((task) => task.clientId === formData.clientId)
      : tasks;

  // Calculate duration when start/end times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(":").map(Number);
      const [endHour, endMin] = formData.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes > startMinutes) {
        const diffMinutes = endMinutes - startMinutes;
        const hours = Math.round((diffMinutes / 60) * 4) / 4; // Round to nearest 0.25
        setFormData((prev) => ({ ...prev, hours }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  // Auto-set billable based on work type and client
  useEffect(() => {
    const workType = workTypes.find((wt) => wt.code === formData.workType.toUpperCase());
    const hasClient = formData.clientId !== "none";

    // Only set billable if work type is typically billable AND there's a client
    setFormData((prev) => ({
      ...prev,
      billable: hasClient && workType?.isBillable !== false,
    }));
  }, [formData.workType, formData.clientId, workTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hours || formData.hours <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    if (!formData.description) {
      toast.error("Please enter a description");
      return;
    }

    // Check for time overlaps (would need to implement overlap detection)
    // This would query existing entries and check for conflicts

    const entryData = {
      ...formData,
      id: selectedEntry?.id,
      clientId: formData.clientId === "none" ? undefined : formData.clientId,
      taskId: formData.taskId === "none" ? undefined : formData.taskId,
      client:
        formData.clientId !== "none"
          ? clients.find((c) => c.id === formData.clientId)?.name
          : undefined,
      task:
        formData.taskId !== "none"
          ? tasks.find((t) => t.id === formData.taskId)?.name
          : undefined,
    };

    if (selectedEntry?.id) {
      await updateTimeEntry.mutateAsync(selectedEntry.id, entryData);
      if (onUpdate) onUpdate();
      toast.success("Time entry updated");
    } else {
      await onSave(entryData);
      toast.success("Time entry created");
    }

    onClose();
  };

  const handleDelete = async () => {
    if (selectedEntry?.id) {
      await deleteTimeEntry.mutateAsync(selectedEntry.id);
      if (onDelete) onDelete();
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleReset = () => {
    setFormData({
      date: selectedDate,
      clientId: "none",
      taskId: "none",
      description: "",
      hours: 1,
      billable: false,
      workType: "work",
      startTime: getDefaultStartTime(),
      endTime: getDefaultEndTime(),
      fullDescription: "",
    });
  };

  return (
    <>
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
              {/* Work Type */}
              <div className="space-y-2">
                <Label htmlFor="workType">Work Type</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, workType: value })
                  }
                >
                  <SelectTrigger id="workType">
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: type.colorCode }}
                          />
                          <span>{type.label}</span>
                          {type.isBillable && (
                            <span className="text-xs text-muted-foreground">(Billable)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                        !formData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date
                        ? format(formData.date, "PPP")
                        : "Pick a date"}
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
                    setFormData({
                      ...formData,
                      clientId: value,
                      taskId: "none",
                    })
                  }
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
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
                    <SelectItem value="none">No task</SelectItem>
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

              {/* Time Selection */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>

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

              {/* Advanced Options */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between"
                >
                  <span>Advanced Options</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullDescription">Full Description</Label>
                      <Textarea
                        id="fullDescription"
                        placeholder="Detailed description of work performed (optional)"
                        value={formData.fullDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fullDescription: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedEntry && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit">
                  {selectedEntry ? "Update" : "Save"} Entry
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this time entry. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
