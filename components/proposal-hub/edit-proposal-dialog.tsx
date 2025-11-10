"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProposalDialogProps {
  proposalId: string;
  proposalTitle: string;
  currentNotes?: string | null;
  currentTerms?: string | null;
  currentServices?: Array<{
    id: string;
    componentCode: string;
    componentName: string;
    calculation?: string | null;
    price: string;
    config?: Record<string, unknown>;
  }>;
  onSuccess?: () => void;
}

export function EditProposalDialog({
  proposalId,
  proposalTitle,
  currentNotes,
  currentTerms,
  currentServices = [],
  onSuccess,
}: EditProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes || "");
  const [terms, setTerms] = useState(currentTerms || "");
  const [changeDescription, setChangeDescription] = useState("");
  const [services, setServices] = useState<
    Array<{
      componentCode: string;
      componentName: string;
      calculation?: string;
      price: number;
      config?: Record<string, unknown>;
    }>
  >(
    currentServices.map((s) => ({
      componentCode: s.componentCode,
      componentName: s.componentName,
      calculation: s.calculation || undefined,
      price: Number(s.price),
      config: s.config,
    })),
  );

  const utils = trpc.useUtils();

  const { mutate: updateProposal, isPending } =
    trpc.proposals.updateWithVersion.useMutation({
      onSuccess: (data) => {
        toast.success(`Proposal updated to version ${data.newVersion}`);
        utils.proposals.getById.invalidate(proposalId);
        utils.proposals.list.invalidate();
        setOpen(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update proposal");
      },
    });

  const handleSave = () => {
    if (!changeDescription.trim()) {
      toast.error("Please enter a change description");
      return;
    }

    // Calculate totals
    const monthlyTotal = services.reduce(
      (sum, service) => sum + service.price,
      0,
    );
    const annualTotal = monthlyTotal * 12;

    updateProposal({
      id: proposalId,
      changeDescription: changeDescription.trim(),
      data: {
        notes: notes.trim() || undefined,
        termsAndConditions: terms.trim() || undefined,
        services,
        monthlyTotal: monthlyTotal.toString(),
        annualTotal: annualTotal.toString(),
      },
    });
  };

  const handleAddService = () => {
    setServices([
      ...services,
      {
        componentCode: "NEW",
        componentName: "New Service",
        price: 0,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleUpdateService = (
    index: number,
    field:
      | "componentCode"
      | "componentName"
      | "calculation"
      | "price"
      | "config",
    value: string | number | Record<string, unknown>,
  ) => {
    const updated = [...services];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setServices(updated);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Edit Proposal</DialogTitle>
        <DialogDescription className="sr-only">
          Edit services, notes, and terms for "{proposalTitle}". A new version
          will be created.
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Edit Proposal</CardTitle>
            <CardDescription>
              Edit services, notes, and terms for "{proposalTitle}". A new
              version will be created.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 md:px-10">
            {/* Change Description */}
            <div className="space-y-2">
              <Label htmlFor="changeDescription">
                Change Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="changeDescription"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="e.g., Updated pricing for Q2 2025"
              />
              <p className="text-xs text-muted-foreground">
                Brief description of changes for version history
              </p>
            </div>

            {/* Services */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Services</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddService}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              <div className="space-y-3 border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No services added. Click "Add Service" to get started.
                  </p>
                ) : (
                  services.map((service) => {
                    const serviceIndex = services.indexOf(service);
                    return (
                      <div
                        key={`${service.componentCode}-${service.componentName}`}
                        className="border rounded-lg p-3 space-y-2 bg-muted/30"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Component Code</Label>
                            <Input
                              value={service.componentCode}
                              onChange={(e) =>
                                handleUpdateService(
                                  serviceIndex,
                                  "componentCode",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., BOOKKEEPING"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Component Name</Label>
                            <Input
                              value={service.componentName}
                              onChange={(e) =>
                                handleUpdateService(
                                  serviceIndex,
                                  "componentName",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Monthly Bookkeeping"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Price (£/month)</Label>
                            <Input
                              type="number"
                              value={service.price}
                              onChange={(e) =>
                                handleUpdateService(
                                  serviceIndex,
                                  "price",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">
                              Calculation (optional)
                            </Label>
                            <Input
                              value={service.calculation || ""}
                              onChange={(e) =>
                                handleUpdateService(
                                  serviceIndex,
                                  "calculation",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Base + Transactions"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(serviceIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Monthly Total:</span>
                  <span className="font-bold">
                    £{services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Annual Total:</span>
                  <span>
                    £
                    {(
                      services.reduce((sum, s) => sum + s.price, 0) * 12
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this proposal..."
                rows={4}
              />
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Terms and conditions for this proposal..."
                rows={4}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !changeDescription.trim()}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
