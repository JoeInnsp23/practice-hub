"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/lib/trpc/types";

const serviceSchema = z.object({
  code: z.string().min(1, "Service code is required"),
  name: z.string().min(1, "Service name is required"),
  category: z.enum([
    "compliance",
    "vat",
    "bookkeeping",
    "payroll",
    "management",
    "secretarial",
    "tax_planning",
    "addon",
  ]),
  description: z.string().optional(),
  pricingModel: z.enum(["turnover", "transaction", "both", "fixed"]),
  basePrice: z.number().min(0, "Base price must be 0 or greater").optional(),
  defaultRate: z
    .number()
    .min(0, "Default rate must be 0 or greater")
    .optional(),
  priceType: z.enum(["hourly", "fixed", "retainer", "project", "percentage"]),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  supportsComplexity: z.boolean(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

// Form data type for service (used for form input/output)
interface ServiceFormData {
  code: string;
  name: string;
  category:
    | "compliance"
    | "vat"
    | "bookkeeping"
    | "payroll"
    | "management"
    | "secretarial"
    | "tax_planning"
    | "addon";
  description?: string;
  pricingModel: "turnover" | "transaction" | "both" | "fixed";
  basePrice?: number;
  defaultRate?: number;
  priceType: "hourly" | "fixed" | "retainer" | "project" | "percentage";
  duration?: number;
  supportsComplexity: boolean;
  tags?: string[];
  isActive: boolean;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
  service?: Partial<ServiceFormData & { price?: number | string }>;
}

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
}: ServiceModalProps) {
  const [tags, setTags] = useState<string[]>(service?.tags || []);
  const [newTag, setNewTag] = useState("");

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      code: service?.code || "",
      name: service?.name || "",
      category: service?.category || "compliance",
      description: service?.description || "",
      pricingModel: service?.pricingModel || "fixed",
      basePrice: service?.basePrice || undefined,
      defaultRate: service?.defaultRate || undefined,
      priceType: service?.priceType || "fixed",
      duration: service?.duration || undefined,
      supportsComplexity: service?.supportsComplexity || false,
      tags: service?.tags || [],
      isActive: service?.isActive !== undefined ? service.isActive : true,
    },
  });

  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ServiceFormValues) => {
    onSave({
      ...data,
      tags,
    });
    form.reset();
    setTags([]);
    toast.success(service ? "Service updated" : "Service created");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Update the service details below"
              : "Add a new service to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., COMP_ACCOUNTS" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Company Accounts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="vat">VAT</SelectItem>
                      <SelectItem value="bookkeeping">Bookkeeping</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="secretarial">Secretarial</SelectItem>
                      <SelectItem value="tax_planning">Tax Planning</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the service..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="turnover">Turnover</SelectItem>
                        <SelectItem value="transaction">Transaction</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="retainer">Retainer</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Rate (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supportsComplexity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Supports Complexity Pricing
                    </FormLabel>
                    <FormDescription>
                      Enable complexity-based pricing for this service
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/10 dark:bg-blue-900 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Service</FormLabel>
                    <FormDescription>
                      Make this service available to clients
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {service ? "Update" : "Create"} Service
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
