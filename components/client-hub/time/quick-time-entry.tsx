"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pause, Play, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatHours } from "@/lib/utils/format";

const timeEntrySchema = z.object({
  client: z.string().min(1, "Client is required"),
  task: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hours: z.string().min(0.1, "Hours must be greater than 0"),
  date: z.string(),
  billable: z.boolean(),
});

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

interface QuickTimeEntryProps {
  onSave?: (data: any) => void;
}

export function QuickTimeEntry({ onSave }: QuickTimeEntryProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [_elapsedTime, setElapsedTime] = useState(0);

  const form = useForm<TimeEntryFormValues, any, TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      client: "",
      task: "",
      description: "",
      hours: "",
      date: new Date().toISOString().split("T")[0],
      billable: true,
    },
  });

  const startTimer = () => {
    setStartTime(new Date());
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (startTime) {
      const endTime = new Date();
      const hours =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      form.setValue("hours", hours.toFixed(2));
      setElapsedTime(hours);
    }
    setIsTimerRunning(false);
    setStartTime(null);
  };

  const onSubmit = async (data: TimeEntryFormValues) => {
    const timeEntry = {
      ...data,
      hours: parseFloat(data.hours),
      date: new Date(data.date),
      createdAt: new Date(),
    };

    if (onSave) {
      await onSave(timeEntry);
    }

    toast.success("Time entry saved successfully");
    form.reset();
    setElapsedTime(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Time Entry
          </CardTitle>
          <Button
            type="button"
            variant={isTimerRunning ? "destructive" : "outline"}
            size="sm"
            onClick={isTimerRunning ? stopTimer : startTimer}
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Timer
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </>
            )}
          </Button>
        </div>
        {isTimerRunning && (
          <p className="text-sm text-muted-foreground mt-2">
            Timer running...{" "}
            {startTime &&
              formatHours(
                (Date.now() - startTime.getTime()) / (1000 * 60 * 60),
              )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="abc-company">
                          ABC Company Ltd
                        </SelectItem>
                        <SelectItem value="xyz-ltd">XYZ Ltd</SelectItem>
                        <SelectItem value="john-doe">John Doe</SelectItem>
                        <SelectItem value="tech-innovations">
                          Tech Innovations Ltd
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="task"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Related task" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you work on?"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billable"
                render={({ field }) => (
                  <FormItem className="flex items-end space-x-2 pb-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="pb-0 cursor-pointer">
                      Billable
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Entry
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
