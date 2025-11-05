"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SimpleIconPicker } from "./simple-icon-picker";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  icon: z.string().min(1, "Icon is required"),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color (use hex format like #ff0000)"),
  priority: z.enum(["info", "warning", "critical"]).default("info"),
  isPinned: z.boolean().default(false),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementFormSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string;
  iconColor: string;
  priority: "info" | "warning" | "critical";
  isPinned: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  onSuccess: () => void;
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  onSuccess,
}: AnnouncementFormDialogProps) {
  const createMutation = trpc.announcements.create.useMutation();
  const updateMutation = trpc.announcements.update.useMutation();

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      icon: "Megaphone",
      iconColor: "#8b5cf6",
      priority: "info",
      isPinned: false,
      startsAt: null,
      endsAt: null,
    },
  });

  // Reset form when dialog opens/closes or announcement changes
  useEffect(() => {
    if (open && announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        icon: announcement.icon,
        iconColor: announcement.iconColor,
        priority: announcement.priority,
        isPinned: announcement.isPinned,
        startsAt: announcement.startsAt,
        endsAt: announcement.endsAt,
      });
    } else if (open && !announcement) {
      form.reset({
        title: "",
        content: "",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });
    }
  }, [open, announcement, form]);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      if (announcement) {
        // Update existing
        await updateMutation.mutateAsync({
          id: announcement.id,
          ...data,
        });
        toast.success("Announcement updated successfully");
      } else {
        // Create new
        await createMutation.mutateAsync(data);
        toast.success("Announcement created successfully");
      }
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(
        announcement
          ? "Failed to update announcement"
          : "Failed to create announcement",
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
          <DialogDescription>
            {announcement
              ? "Update the announcement details below."
              : "Fill in the details to create a new company announcement."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter announcement title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter announcement content"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Icon */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon *</FormLabel>
                    <SimpleIconPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon Color */}
              <FormField
                control={form.control}
                name="iconColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Color *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="#8b5cf6"
                          {...field}
                          className="flex-1"
                        />
                      </FormControl>
                      <div
                        className="w-12 h-10 rounded border"
                        style={{ backgroundColor: field.value }}
                      />
                    </div>
                    <FormDescription className="text-xs">
                      Hex format: #RRGGBB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Critical announcements appear with red badges and higher
                    priority
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pin */}
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Pin to Top</FormLabel>
                    <FormDescription>
                      Pinned announcements appear first in the list
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Schedule Window */}
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h4 className="font-medium text-sm mb-2">
                  Schedule Window (Optional)
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Set start and end dates to control when this announcement is
                  visible
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Starts At */}
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Starts At</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ends At */}
                <FormField
                  control={form.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ends At</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {announcement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
