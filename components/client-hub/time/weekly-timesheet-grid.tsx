"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface WeeklyTimesheetGridProps {
  weekStartDate: Date;
  isReadOnly?: boolean;
}

interface DayData {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  entries: Array<{
    id: string;
    hours: string;
    workType: string;
    clientId: string | null;
    taskId: string | null;
    description: string | null;
    billable: boolean;
  }>;
  totalHours: number;
}

interface EntryFormData {
  hours: string;
  workType: string;
  description: string;
  billable: boolean;
}

export function WeeklyTimesheetGrid({
  weekStartDate,
  isReadOnly = false,
}: WeeklyTimesheetGridProps) {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [formData, setFormData] = useState<EntryFormData>({
    hours: "",
    workType: "WORK",
    description: "",
    billable: true,
  });

  const formRef = useRef<HTMLFormElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.timesheets.getWeek.useQuery({
    weekStartDate: weekStartStr,
    weekEndDate: weekEndStr,
  });

  const createMutation = trpc.timesheets.create.useMutation({
    onSuccess: () => {
      toast.success("Entry added");
      utils.timesheets.getWeek.invalidate();
      utils.timesheets.summary.invalidate();
      utils.timesheets.getWeeklySummary.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add entry");
    },
  });

  const updateMutation = trpc.timesheets.update.useMutation({
    onSuccess: () => {
      toast.success("Entry updated");
      utils.timesheets.getWeek.invalidate();
      utils.timesheets.summary.invalidate();
      utils.timesheets.getWeeklySummary.invalidate();
      setEditingEntry(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update entry");
    },
  });

  const deleteMutation = trpc.timesheets.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      utils.timesheets.getWeek.invalidate();
      utils.timesheets.summary.invalidate();
      utils.timesheets.getWeeklySummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete entry");
    },
  });

  const resetForm = () => {
    setFormData({
      hours: "",
      workType: "WORK",
      description: "",
      billable: true,
    });
    setAddingToDay(null);
    setEditingEntry(null);
  };

  const handleAddEntry = (date: string) => {
    if (isReadOnly) return;
    setAddingToDay(date);
    setEditingEntry(null);
    setFormData({
      hours: "",
      workType: "WORK",
      description: "",
      billable: true,
    });
    setTimeout(() => hoursInputRef.current?.focus(), 100);
  };

  const handleEditEntry = (entry: DayData["entries"][0]) => {
    if (isReadOnly) return;
    setEditingEntry(entry.id);
    setAddingToDay(null);
    setFormData({
      hours: entry.hours,
      workType: entry.workType,
      description: entry.description || "",
      billable: entry.billable,
    });
    setTimeout(() => hoursInputRef.current?.focus(), 100);
  };

  const handleSaveNew = (date: string) => {
    if (!formData.hours || Number.parseFloat(formData.hours) <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    createMutation.mutate({
      date,
      hours: formData.hours,
      workType: formData.workType,
      description: formData.description || null,
      billable: formData.billable,
      status: "draft",
      clientId: null,
      serviceId: null,
      taskId: null,
      rate: null,
      amount: null,
      startTime: null,
      endTime: null,
      notes: null,
      billed: false,
      invoiceId: null,
      submissionId: null,
      submittedAt: null,
      approvedById: null,
      approvedAt: null,
      metadata: null,
    });
  };

  const handleSaveEdit = (entryId: string) => {
    if (!formData.hours || Number.parseFloat(formData.hours) <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    updateMutation.mutate({
      id: entryId,
      data: {
        hours: formData.hours,
        workType: formData.workType,
        description: formData.description || null,
        billable: formData.billable,
      },
    });
  };

  const handleDelete = (entryId: string) => {
    if (isReadOnly) return;
    if (confirm("Delete this entry?")) {
      deleteMutation.mutate(entryId);
    }
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (
    e: React.KeyboardEvent,
    context: {
      type: "form";
      date?: string;
      entryId?: string;
    },
  ) => {
    // Enter to save
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (context.type === "form" && context.date && addingToDay) {
        handleSaveNew(context.date);
      } else if (context.type === "form" && context.entryId && editingEntry) {
        handleSaveEdit(context.entryId);
      }
    }

    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      resetForm();
    }
  };

  // Focus management for keyboard shortcuts
  useEffect(() => {
    if (addingToDay || editingEntry) {
      hoursInputRef.current?.focus();
    }
  }, [addingToDay, editingEntry]);

  // Prepare 7-day structure
  const days: DayData[] = Array.from({ length: 7 }, (_, i) => {
    const currentDate = addDays(weekStart, i);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    const dayEntries = entries.filter((e) => e.date === dateStr);
    const totalHours = dayEntries.reduce(
      (sum, e) => sum + Number.parseFloat(e.hours),
      0,
    );

    return {
      date: dateStr,
      dayName: format(currentDate, "EEE"),
      dayNumber: currentDate.getDate(),
      isToday: dateStr === today,
      isWeekend: i >= 5,
      entries: dayEntries.map((e) => ({
        id: e.id,
        hours: e.hours,
        workType: e.workType || "WORK",
        clientId: e.clientId,
        taskId: e.taskId,
        description: e.description,
        billable: e.billable,
      })),
      totalHours,
    };
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Loading timesheet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day) => {
          const isLowHours = day.totalHours < 7.5 && day.totalHours > 0;
          const isZeroHours = day.totalHours === 0;
          const isAddingToThisDay = addingToDay === day.date;

          return (
            <Card
              key={day.date}
              className={cn(
                "glass-card min-h-[250px] flex flex-col",
                day.isToday &&
                  "border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20",
                day.isWeekend && !day.isToday && "bg-muted/30",
              )}
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {day.dayName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {day.dayNumber}
                    </p>
                  </div>
                  {!isReadOnly && !isAddingToThisDay && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddEntry(day.date)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-2 flex-grow flex flex-col">
                <div className="space-y-2 flex-grow">
                  {/* Add Entry Form */}
                  {isAddingToThisDay && (
                    <form
                      ref={formRef as React.RefObject<HTMLFormElement>}
                      className="p-3 border rounded-lg bg-card space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveNew(day.date);
                      }}
                      onKeyDown={(e) =>
                        handleKeyDown(e, { type: "form", date: day.date })
                      }
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          ref={hoursInputRef}
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          placeholder="Hours"
                          value={formData.hours}
                          onChange={(e) =>
                            setFormData({ ...formData, hours: e.target.value })
                          }
                          className="text-sm h-8"
                        />
                        <Select
                          value={formData.workType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, workType: value })
                          }
                        >
                          <SelectTrigger className="text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WORK">Work</SelectItem>
                            <SelectItem value="TOIL">TOIL</SelectItem>
                            <SelectItem value="HOLIDAY">Holiday</SelectItem>
                            <SelectItem value="SICK">Sick</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        placeholder="Description (optional)"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.billable}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                billable: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          Billable
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveNew(day.date)}
                          disabled={createMutation.isPending}
                          className="flex-1"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={resetForm}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Existing Entries */}
                  {day.entries.length === 0 && !isAddingToThisDay && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No entries
                    </div>
                  )}

                  {day.entries.map((entry) => {
                    const isEditing = editingEntry === entry.id;

                    if (isEditing) {
                      return (
                        <form
                          key={entry.id}
                          ref={formRef as React.RefObject<HTMLFormElement>}
                          className="p-3 border rounded-lg bg-card space-y-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEdit(entry.id);
                          }}
                          onKeyDown={(e) =>
                            handleKeyDown(e, {
                              type: "form",
                              entryId: entry.id,
                            })
                          }
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              ref={hoursInputRef}
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              placeholder="Hours"
                              value={formData.hours}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  hours: e.target.value,
                                })
                              }
                              className="text-sm h-8"
                            />
                            <Select
                              value={formData.workType}
                              onValueChange={(value) =>
                                setFormData({ ...formData, workType: value })
                              }
                            >
                              <SelectTrigger className="text-sm h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WORK">Work</SelectItem>
                                <SelectItem value="TOIL">TOIL</SelectItem>
                                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                <SelectItem value="SICK">Sick</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            placeholder="Description (optional)"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            className="text-sm min-h-[60px]"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.billable}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    billable: e.target.checked,
                                  })
                                }
                                className="rounded"
                              />
                              Billable
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(entry.id)}
                              disabled={updateMutation.isPending}
                              className="flex-1"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={resetForm}
                              className="flex-1"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "text-xs p-2 rounded border-l-2 group relative",
                          entry.billable
                            ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
                            : "border-l-gray-400 bg-muted/50",
                        )}
                      >
                        <div className="font-semibold text-foreground">
                          {Number.parseFloat(entry.hours).toFixed(1)}h
                        </div>
                        <div className="text-muted-foreground">
                          {entry.workType}
                        </div>
                        {entry.description && (
                          <div className="text-muted-foreground truncate mt-1">
                            {entry.description}
                          </div>
                        )}

                        {/* Edit/Delete buttons (show on hover) */}
                        {!isReadOnly && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditEntry(entry)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-950"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Daily Total with highlighting */}
                <div
                  className={cn(
                    "mt-auto pt-3 border-t flex-shrink-0",
                    isLowHours &&
                      "border-t-orange-300 dark:border-t-orange-700 bg-orange-50/50 dark:bg-orange-950/20 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg",
                    isZeroHours &&
                      "border-t-red-300 dark:border-t-red-700 bg-red-50/30 dark:bg-red-950/10",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        isLowHours && "text-orange-700 dark:text-orange-400",
                        isZeroHours && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {day.totalHours.toFixed(1)}h
                    </div>
                    {isLowHours && !day.isWeekend && (
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-400 text-orange-700 dark:text-orange-400"
                      >
                        Low
                      </Badge>
                    )}
                    {isZeroHours && !day.isWeekend && (
                      <Badge
                        variant="outline"
                        className="text-xs border-red-400 text-red-600 dark:text-red-400"
                      >
                        Empty
                      </Badge>
                    )}
                  </div>
                  {(isLowHours || isZeroHours) && !day.isWeekend && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Need {(7.5 - day.totalHours).toFixed(1)}h more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Week Summary */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {days.reduce((sum, day) => sum + day.totalHours, 0).toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {entries
                  .filter((e) => e.billable)
                  .reduce((sum, e) => sum + Number.parseFloat(e.hours), 0)
                  .toFixed(1)}
                h
              </div>
              <div className="text-sm text-muted-foreground">
                Billable Hours
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {days.filter((d) => d.totalHours > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Days Worked</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{entries.length}</div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      {!isReadOnly && (addingToDay || editingEntry) && (
        <div className="text-xs text-muted-foreground text-center">
          <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> to save •{" "}
          <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> to cancel
        </div>
      )}
    </div>
  );
}
