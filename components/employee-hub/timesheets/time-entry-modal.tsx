"use client";

import { format } from "date-fns";
import { AlertCircle, CalendarIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  useDeleteTimeEntry,
  useUpdateTimeEntry,
} from "@/lib/hooks/use-time-entries";
import { useWorkTypes } from "@/lib/hooks/use-work-types";
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

  // Fetch existing time entries for the selected date (for validation)
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: existingEntries } = trpc.timesheets.list.useQuery(
    {
      startDate: dateStr,
      endDate: dateStr,
    },
    {
      enabled: !!dateStr && isOpen,
    },
  );

  // Client-side validation helpers
  const checkOverlap = useCallback(
    (startTime: string, endTime: string): string | null => {
      if (!startTime || !endTime || !existingEntries) return null;

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const newStart = startHour * 60 + startMinute;
      const newEnd = endHour * 60 + endMinute;

      // Check if endTime > startTime
      if (newEnd <= newStart) {
        return "End time must be after start time";
      }

      // Check overlap with existing entries (exclude current entry if editing)
      const overlaps = existingEntries.filter((entry) => {
        if (selectedEntry?.id && entry.id === selectedEntry.id) return false;
        if (!entry.startTime || !entry.endTime) return false;

        const [eStartHour, eStartMinute] = entry.startTime
          .split(":")
          .map(Number);
        const [eEndHour, eEndMinute] = entry.endTime.split(":").map(Number);
        const eStart = eStartHour * 60 + eStartMinute;
        const eEnd = eEndHour * 60 + eEndMinute;

        // Overlap: (newStart < eEnd) AND (newEnd > eStart)
        return newStart < eEnd && newEnd > eStart;
      });

      if (overlaps.length > 0) {
        const overlapTimes = overlaps
          .map((e) => `${e.startTime}-${e.endTime}`)
          .join(", ");
        return `Time overlaps with existing ${overlaps.length === 1 ? "entry" : "entries"}: ${overlapTimes}`;
      }

      return null; // No overlap
    },
    [existingEntries, selectedEntry?.id],
  );

  const checkDailyLimit = useCallback(
    (hours: number): string | null => {
      if (!existingEntries) return null;

      const currentTotal = existingEntries.reduce((sum, entry) => {
        // Exclude current entry if editing
        if (selectedEntry?.id && entry.id === selectedEntry.id) return sum;
        return sum + Number(entry.hours || 0);
      }, 0);

      const newTotal = currentTotal + hours;

      if (newTotal > 24) {
        return `Daily total would be ${newTotal.toFixed(2)}h, exceeding 24-hour limit (current: ${currentTotal.toFixed(2)}h)`;
      }

      return null; // Within limit
    },
    [existingEntries, selectedEntry?.id],
  );

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

  // Track the last auto-generated description to know if user has manually edited
  const lastAutoDescriptionRef = useRef<string>("");
  const userHasEditedDescriptionRef = useRef<boolean>(false);

  // Filter tasks based on selected client
  const availableTasks =
    formData.clientId && formData.clientId !== "none"
      ? tasks.filter((task) => task.clientId === formData.clientId)
      : tasks;

  // Generate auto-description based on work type, client, and task
  const autoDescription = useMemo(() => {
    const parts: string[] = [];
    const seen = new Set<string>();

    // Helper to normalize a value for comparison (case-insensitive, trimmed)
    const normalize = (value: string) => value.toLowerCase().trim();

    // Helper to add individual parts, checking each one for duplicates
    const addParts = (value: string) => {
      if (!value || !value.trim()) return;

      // Split by common separators (dash, comma, pipe, etc.)
      const valueParts = value
        .split(/\s*[-–—,|]\s*/)
        .map((p) => p.trim())
        .filter((p) => p);

      // Add each part if not already seen
      for (const part of valueParts) {
        const normalized = normalize(part);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          parts.push(part);
        }
      }
    };

    // Add work type
    const workType = workTypes.find(
      (wt) => wt.code === formData.workType.toUpperCase(),
    );
    if (workType) {
      addParts(workType.label);
    }

    // Add client
    if (formData.clientId && formData.clientId !== "none") {
      const client = clients.find((c) => c.id === formData.clientId);
      if (client) {
        addParts(client.name);
      }
    }

    // Add task
    if (formData.taskId && formData.taskId !== "none") {
      const task = availableTasks.find((t) => t.id === formData.taskId);
      if (task) {
        addParts(task.name);
      }
    }

    if (parts.length === 0) {
      return "";
    }

    return parts.join(" - ");
  }, [
    formData.workType,
    formData.clientId,
    formData.taskId,
    workTypes,
    clients,
    availableTasks,
  ]);

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
    const workType = workTypes.find(
      (wt) => wt.code === formData.workType.toUpperCase(),
    );
    const hasClient = formData.clientId !== "none";

    // Only set billable if work type is typically billable AND there's a client
    // Check if billable actually needs to change to avoid infinite loops
    const newBillable = hasClient && workType?.isBillable !== false;

    setFormData((prev) => {
      // Only update if billable value actually changed
      if (prev.billable !== newBillable) {
        return {
          ...prev,
          billable: newBillable,
        };
      }
      return prev;
    });
  }, [formData.workType, formData.clientId, workTypes]);

  // Auto-generate description when work type, client, or task changes
  useEffect(() => {
    // Skip auto-generation if:
    // 1. User has manually edited the description
    // 2. There's no auto-description to generate
    // 3. The description is already set from selectedEntry
    if (!autoDescription || userHasEditedDescriptionRef.current) {
      return;
    }

    // Only auto-populate if description is empty or matches the last auto-generated one
    if (
      formData.description === "" ||
      formData.description === lastAutoDescriptionRef.current
    ) {
      setFormData((prev) => ({
        ...prev,
        description: autoDescription,
      }));
      lastAutoDescriptionRef.current = autoDescription;
    }
  }, [autoDescription, formData.description]);

  // Reset user edit flag when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      userHasEditedDescriptionRef.current = false;
      // If description comes from selectedEntry, mark as user-edited to preserve it
      if (selectedEntry?.description) {
        userHasEditedDescriptionRef.current = true;
        lastAutoDescriptionRef.current = selectedEntry.description;
      }
    } else {
      userHasEditedDescriptionRef.current = false;
      lastAutoDescriptionRef.current = "";
    }
  }, [isOpen, selectedEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startTime || !formData.endTime) {
      toast.error("Please select both a start time and an end time");
      return;
    }

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
        <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">
            {selectedEntry ? "Edit Time Entry" : "New Time Entry"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Record your time spent on client work
          </DialogDescription>

          <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
              <CardTitle>
                {selectedEntry ? "Edit Time Entry" : "New Time Entry"}
              </CardTitle>
              <CardDescription>
                Record your time spent on client work
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 px-8 md:px-10">
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
                              <span className="text-xs text-muted-foreground">
                                (Billable)
                              </span>
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
                    placeholder={autoDescription || "What did you work on?"}
                    value={formData.description}
                    onChange={(e) => {
                      // Mark as user-edited when user types
                      if (!userHasEditedDescriptionRef.current) {
                        userHasEditedDescriptionRef.current = true;
                      }
                      setFormData({ ...formData, description: e.target.value });
                    }}
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

                {/* Validation errors */}
                {formData.startTime && formData.endTime && (
                  <>
                    {(() => {
                      const overlapError = checkOverlap(
                        formData.startTime,
                        formData.endTime,
                      );
                      return overlapError ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{overlapError}</AlertDescription>
                        </Alert>
                      ) : null;
                    })()}

                    {(() => {
                      const limitError = checkDailyLimit(formData.hours);
                      return limitError ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{limitError}</AlertDescription>
                        </Alert>
                      ) : null;
                    })()}
                  </>
                )}

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
                        <Label htmlFor="fullDescription">
                          Full Description
                        </Label>
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
              </CardContent>

              <CardFooter className="flex items-center justify-between px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
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
                  <Button
                    type="submit"
                    disabled={
                      !!checkOverlap(formData.startTime, formData.endTime) ||
                      !!checkDailyLimit(formData.hours)
                    }
                  >
                    {selectedEntry ? "Update" : "Save"} Entry
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
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
