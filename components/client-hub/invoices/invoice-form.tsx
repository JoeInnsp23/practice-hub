"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

const invoiceSchema = z.object({
  client: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  paymentTerms: z.string(),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  total: number;
}

interface InvoiceFormProps {
  invoice?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems || [
      {
        id: "1",
        description: "",
        quantity: 1,
        rate: 0,
        tax: 0,
        total: 0,
      },
    ],
  );

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client: invoice?.client || "",
      invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
      issueDate: invoice?.issueDate || new Date().toISOString().split("T")[0],
      dueDate: invoice?.dueDate || "",
      status: invoice?.status || "draft",
      paymentTerms: invoice?.paymentTerms || "Net 30",
      notes: invoice?.notes || "",
    },
  });

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        rate: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Calculate total
          const subtotal = updated.quantity * updated.rate;
          const taxAmount = (subtotal * updated.tax) / 100;
          updated.total = subtotal + taxAmount;
          return updated;
        }
        return item;
      }),
    );
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );
    const taxTotal = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      return sum + (itemSubtotal * item.tax) / 100;
    }, 0);
    const total = subtotal + taxTotal;

    return { subtotal, taxTotal, total };
  };

  const onSubmit = (data: InvoiceFormValues) => {
    const totals = calculateTotals();
    onSave({
      ...data,
      lineItems,
      ...totals,
    });
  };

  const { subtotal, taxTotal, total } = calculateTotals();

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
                name="client"
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
                      <Input {...field} />
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Due on receipt">
                          Due on receipt
                        </SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Quantity</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-1 text-right">Tax %</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Line Items */}
                  {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
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
                      <div className="col-span-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.tax}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "tax",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end font-medium">
                        {formatCurrency(item.total)}
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
                          Tax:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(taxTotal)}
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Calculator className="h-4 w-4 mr-2" />
            {invoice ? "Update" : "Create"} Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
