"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/format";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  subtotal: z.number().min(0, "Subtotal must be 0 or greater"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  taxAmount: z.number().min(0, "Tax amount must be 0 or greater"),
  discount: z.number().min(0, "Discount must be 0 or greater").default(0),
  total: z.number().min(0, "Total must be 0 or greater"),
  amountPaid: z.number().min(0, "Amount paid must be 0 or greater").default(0),
  currency: z.string().default("GBP"),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Quantity must be greater than 0"),
        rate: z.number().min(0, "Rate must be 0 or greater"),
        amount: z.number().min(0, "Amount must be 0 or greater"),
        sortOrder: z.number().default(0),
      }),
    )
    .optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Form-specific types (numbers instead of decimal strings for form inputs)
interface LocalLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder: number;
}

interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  currency: string;
  terms?: string;
  notes?: string;
  lineItems?: LocalLineItem[];
}

interface InvoiceFormProps {
  invoice?: InvoiceFormData;
  onSave: (data: InvoiceFormData) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LocalLineItem[]>(
    invoice?.lineItems || [
      {
        id: "1",
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
        sortOrder: 0,
      },
    ],
  );
  const [taxRate, setTaxRate] = useState<number>(invoice?.taxRate || 0);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(
      invoiceSchema,
    ) as unknown as Resolver<InvoiceFormValues>,
    defaultValues: {
      clientId: invoice?.clientId || "",
      invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
      issueDate: invoice?.issueDate || new Date().toISOString().split("T")[0],
      dueDate: invoice?.dueDate || "",
      status: invoice?.status || "draft",
      subtotal: invoice?.subtotal || 0,
      taxRate: invoice?.taxRate || 0,
      taxAmount: invoice?.taxAmount || 0,
      discount: invoice?.discount || 0,
      total: invoice?.total || 0,
      amountPaid: invoice?.amountPaid || 0,
      currency: invoice?.currency || "GBP",
      terms: invoice?.terms || "",
      notes: invoice?.notes || "",
      items: invoice?.lineItems || [],
    },
  });

  const addLineItem = () => {
    const newSortOrder = lineItems.length;
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
        sortOrder: newSortOrder,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: keyof LocalLineItem,
    value: string | number,
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Calculate line amount (quantity * rate)
          updated.amount = updated.quantity * updated.rate;
          return updated;
        }
        return item;
      }),
    );
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const onSubmit = (data: InvoiceFormValues) => {
    const totals = calculateTotals();

    // Build final invoice data with calculated totals
    const invoiceData: InvoiceFormData = {
      ...data,
      ...totals,
      lineItems: lineItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    };

    onSave(invoiceData);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="details">Invoice Details</TabsTrigger>
            <TabsTrigger value="items">Line Items</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="invoice-form-number-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          setTaxRate(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Net 30, Due on receipt"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or payment instructions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Line Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Quantity</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Line Items */}
                  {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "rate",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end font-medium">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Subtotal:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Tax ({taxRate}%):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(taxAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="invoice-form-cancel-button"
          >
            Cancel
          </Button>
          <Button type="submit" data-testid="invoice-form-save-button">
            <Calculator className="h-4 w-4 mr-2" />
            {invoice ? "Update" : "Create"} Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
