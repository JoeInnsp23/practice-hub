"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { RouterOutputs } from "@/app/providers/trpc-provider";
import { trpc } from "@/app/providers/trpc-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EventType = "meeting" | "deadline" | "event" | "out_of_office";
type CalendarEvent = RouterOutputs["calendar"]["listEvents"][number];

export default function CalendarPage() {
  const _utils = trpc.useUtils();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [_viewMode, _setViewMode] = useState<"month" | "week" | "day">("month");
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Calculate date range based on selected date
  const startOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
  );

  // Fetch events for current month
  const { data: eventsData } = trpc.calendar.listEvents.useQuery(
    {
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    {
      refetchInterval: 30000, // Poll every 30 seconds
    },
  );

  const events = eventsData || [];

  // Get events for selected date
  const selectedDateEvents = events.filter((event) => {
    const eventDate = new Date(event.event.startTime);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Navigate month
  const previousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1),
    );
  };

  const today = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your schedule and events
          </p>
        </div>

        <Button onClick={() => setIsNewEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar */}
        <Card className="lg:col-span-2 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={today}>
                Today
              </Button>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousMonth}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={selectedDate}
            onMonthChange={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasEvents: events.map((e) => new Date(e.event.startTime)),
            }}
            modifiersClassNames={{
              hasEvents: "bg-primary/10 font-semibold",
            }}
          />

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary/10" />
              <span>Has events</span>
            </div>
          </div>
        </Card>

        {/* Right Column - Events List */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          <div className="space-y-3">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No events scheduled
                </p>
              </div>
            ) : (
              selectedDateEvents.map((event) => (
                <EventCard
                  key={event.event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* New Event Dialog */}
      <NewEventDialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen} />

      {/* Event Details Dialog */}
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const eventData = event.event;
  const typeColors: Record<EventType, string> = {
    meeting: "bg-blue-500",
    deadline: "bg-red-500",
    event: "bg-green-500",
    out_of_office: "bg-purple-500",
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
            typeColors[eventData.type as EventType],
          )}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 truncate">
            {eventData.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(eventData.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(eventData.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {eventData.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{eventData.location}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// New Event Dialog
function NewEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "meeting" as EventType,
    startTime: "",
    endTime: "",
    location: "",
    allDay: false,
  });

  const createEventMutation = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully");
      utils.calendar.listEvents.invalidate();
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        type: "meeting",
        startTime: "",
        endTime: "",
        location: "",
        allDay: false,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    createEventMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      location: formData.location || undefined,
      allDay: formData.allDay,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Schedule a new event, meeting, or deadline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as EventType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="out_of_office">Out of Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Meeting room, video call link, etc."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add event details..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) =>
                setFormData({ ...formData, allDay: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              All day event
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending}>
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Event Details Dialog
function EventDetailsDialog({
  event,
  open,
  onOpenChange,
}: {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const eventData = event.event;
  const creator = event.creator;

  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
      utils.calendar.listEvents.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ eventId: eventData.id });
    }
  };

  const typeLabels: Record<EventType, string> = {
    meeting: "Meeting",
    deadline: "Deadline",
    event: "Event",
    out_of_office: "Out of Office",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{eventData.title}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mt-2">
              {typeLabels[eventData.type as EventType]}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {new Date(eventData.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(eventData.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(eventData.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Location */}
          {eventData.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm">{eventData.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {eventData.description && (
            <div className="pt-2">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {eventData.description}
              </p>
            </div>
          )}

          {/* Creator */}
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-2">Organizer</h4>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {creator.firstName?.[0]}
                  {creator.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {creator.firstName} {creator.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{creator.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending}
            >
              Delete Event
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
