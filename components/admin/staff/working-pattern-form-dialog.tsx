"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import type { WorkingPattern } from "@/lib/trpc/types";

// Pattern templates
const PATTERN_TEMPLATES = {
  full_time_37_5: {
    name: "Standard Full-Time (37.5h)",
    patternType: "full_time" as const,
    contractedHours: 37.5,
    mondayHours: 7.5,
    tuesdayHours: 7.5,
    wednesdayHours: 7.5,
    thursdayHours: 7.5,
    fridayHours: 7.5,
    saturdayHours: 0,
    sundayHours: 0,
  },
  full_time_40: {
    name: "Full-Time 40h (Mon-Fri 8h)",
    patternType: "full_time" as const,
    contractedHours: 40,
    mondayHours: 8,
    tuesdayHours: 8,
    wednesdayHours: 8,
    thursdayHours: 8,
    fridayHours: 8,
    saturdayHours: 0,
    sundayHours: 0,
  },
  compressed_36: {
    name: "Compressed 4-Day (36h)",
    patternType: "compressed_hours" as const,
    contractedHours: 36,
    mondayHours: 9,
    tuesdayHours: 9,
    wednesdayHours: 9,
    thursdayHours: 9,
    fridayHours: 0,
    saturdayHours: 0,
    sundayHours: 0,
  },
  part_time_20: {
    name: "Part-Time 20h (Mon-Wed 6h, Thu 2h)",
    patternType: "part_time" as const,
    contractedHours: 20,
    mondayHours: 6,
    tuesdayHours: 6,
    wednesdayHours: 6,
    thursdayHours: 2,
    fridayHours: 0,
    saturdayHours: 0,
    sundayHours: 0,
  },
  part_time_30: {
    name: "Part-Time 30h (Mon-Fri 6h)",
    patternType: "part_time" as const,
    contractedHours: 30,
    mondayHours: 6,
    tuesdayHours: 6,
    wednesdayHours: 6,
    thursdayHours: 6,
    fridayHours: 6,
    saturdayHours: 0,
    sundayHours: 0,
  },
};

const formSchema = z
  .object({
    userId: z.string().min(1, "User is required"),
    patternType: z.enum([
      "full_time",
      "part_time",
      "compressed_hours",
      "job_share",
      "custom",
    ]),
    contractedHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(168, "Cannot exceed 168 hours per week"),
    mondayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    tuesdayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    wednesdayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    thursdayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    fridayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    saturdayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    sundayHours: z
      .number()
      .min(0, "Must be at least 0")
      .max(24, "Cannot exceed 24 hours"),
    effectiveFrom: z.string().min(1, "Effective date is required"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const total =
        data.mondayHours +
        data.tuesdayHours +
        data.wednesdayHours +
        data.thursdayHours +
        data.fridayHours +
        data.saturdayHours +
        data.sundayHours;
      return Math.abs(total - data.contractedHours) < 0.01;
    },
    {
      message: "Sum of day hours must equal contracted hours",
      path: ["contractedHours"],
    },
  );

type FormData = z.infer<typeof formSchema>;

interface WorkingPatternFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingPattern?: WorkingPattern | null;
}

export function WorkingPatternFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingPattern,
}: WorkingPatternFormDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Fetch users for dropdown
  const { data: usersData } = trpc.users.list.useQuery({});

  // Mutations
  const createMutation = trpc.workingPatterns.create.useMutation();
  const updateMutation = trpc.workingPatterns.update.useMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      patternType: "full_time",
      contractedHours: 37.5,
      mondayHours: 7.5,
      tuesdayHours: 7.5,
      wednesdayHours: 7.5,
      thursdayHours: 7.5,
      fridayHours: 7.5,
      saturdayHours: 0,
      sundayHours: 0,
      effectiveFrom: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Update form when editing pattern
  useEffect(() => {
    if (editingPattern) {
      form.reset({
        userId: editingPattern.userId,
        patternType: editingPattern.patternType as
          | "full_time"
          | "part_time"
          | "compressed_hours"
          | "job_share"
          | "custom",
        contractedHours: editingPattern.contractedHours,
        mondayHours: editingPattern.mondayHours,
        tuesdayHours: editingPattern.tuesdayHours,
        wednesdayHours: editingPattern.wednesdayHours,
        thursdayHours: editingPattern.thursdayHours,
        fridayHours: editingPattern.fridayHours,
        saturdayHours: editingPattern.saturdayHours,
        sundayHours: editingPattern.sundayHours,
        effectiveFrom: editingPattern.effectiveFrom,
        notes: editingPattern.notes || "",
      });
    } else {
      form.reset({
        userId: "",
        patternType: "full_time",
        contractedHours: 37.5,
        mondayHours: 7.5,
        tuesdayHours: 7.5,
        wednesdayHours: 7.5,
        thursdayHours: 7.5,
        fridayHours: 7.5,
        saturdayHours: 0,
        sundayHours: 0,
        effectiveFrom: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [editingPattern, form]);

  // Apply template
  const applyTemplate = (templateKey: string) => {
    const template =
      PATTERN_TEMPLATES[templateKey as keyof typeof PATTERN_TEMPLATES];
    if (template) {
      form.setValue("patternType", template.patternType);
      form.setValue("contractedHours", template.contractedHours);
      form.setValue("mondayHours", template.mondayHours);
      form.setValue("tuesdayHours", template.tuesdayHours);
      form.setValue("wednesdayHours", template.wednesdayHours);
      form.setValue("thursdayHours", template.thursdayHours);
      form.setValue("fridayHours", template.fridayHours);
      form.setValue("saturdayHours", template.saturdayHours);
      form.setValue("sundayHours", template.sundayHours);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingPattern) {
        await updateMutation.mutateAsync({
          id: editingPattern.id,
          ...data,
        });
        toast.success("Working pattern updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Working pattern created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save working pattern",
      );
    }
  };

  // Calculate total hours
  const totalHours =
    (form.watch("mondayHours") || 0) +
    (form.watch("tuesdayHours") || 0) +
    (form.watch("wednesdayHours") || 0) +
    (form.watch("thursdayHours") || 0) +
    (form.watch("fridayHours") || 0) +
    (form.watch("saturdayHours") || 0) +
    (form.watch("sundayHours") || 0);

  const isValid =
    Math.abs(totalHours - (form.watch("contractedHours") || 0)) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPattern ? "Edit Working Pattern" : "Add Working Pattern"}
          </DialogTitle>
          <DialogDescription>
            Define a flexible working pattern with day-by-day hour allocation
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Pattern Templates */}
            {!editingPattern && (
              <div className="space-y-2">
                <FormLabel>Quick Templates</FormLabel>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    setSelectedTemplate(value);
                    applyTemplate(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PATTERN_TEMPLATES).map(
                      ([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Start with a template and customize as needed
                </FormDescription>
              </div>
            )}

            {/* User Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Member *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!editingPattern}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersData?.users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pattern Type */}
            <FormField
              control={form.control}
              name="patternType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full_time">Full-Time</SelectItem>
                      <SelectItem value="part_time">Part-Time</SelectItem>
                      <SelectItem value="compressed_hours">
                        Compressed Hours
                      </SelectItem>
                      <SelectItem value="job_share">Job Share</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contracted Hours */}
            <FormField
              control={form.control}
              name="contractedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contracted Hours (per week) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Total contracted hours per week
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day-by-Day Hours */}
            <div className="space-y-3">
              <FormLabel>Weekly Schedule *</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "mondayHours", label: "Monday" },
                  { name: "tuesdayHours", label: "Tuesday" },
                  { name: "wednesdayHours", label: "Wednesday" },
                  { name: "thursdayHours", label: "Thursday" },
                  { name: "fridayHours", label: "Friday" },
                  { name: "saturdayHours", label: "Saturday" },
                  { name: "sundayHours", label: "Sunday" },
                ].map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total: {totalHours.toFixed(1)}h /{" "}
                  {form.watch("contractedHours")}h
                </span>
                {!isValid && (
                  <span className="text-destructive">
                    Sum must equal contracted hours
                  </span>
                )}
              </div>
            </div>

            {/* Effective From */}
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Date when this pattern becomes active
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this pattern..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingPattern
                    ? "Update Pattern"
                    : "Create Pattern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
