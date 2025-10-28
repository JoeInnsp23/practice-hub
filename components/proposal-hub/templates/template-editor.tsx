"use client";

import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { ServiceSelector } from "@/components/proposal-hub/calculator/service-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
}

export function TemplateEditor({
  isOpen,
  onClose,
  templateId,
}: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedServices, setSelectedServices] = useState<
    Array<{
      serviceCode: string;
      quantity?: number;
      config?: Record<string, unknown>;
    }>
  >([]);

  // Fetch template if editing
  const { data: templateData } = trpc.proposalTemplates.getById.useQuery(
    templateId!,
    { enabled: !!templateId },
  );

  // Create/Update mutations
  const { mutate: createTemplate, isPending: isCreating } =
    trpc.proposalTemplates.create.useMutation({
      onSuccess: () => {
        toast.success("Template created");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create template");
      },
    });

  const { mutate: updateTemplate, isPending: isUpdating } =
    trpc.proposalTemplates.update.useMutation({
      onSuccess: () => {
        toast.success("Template updated");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update template");
      },
    });

  // Populate form when editing
  useEffect(() => {
    if (templateData?.template) {
      const t = templateData.template;
      setName(t.name);
      setDescription(t.description || "");
      setCategory(t.category || "");
      setTermsAndConditions(t.termsAndConditions || "");
      setNotes(t.notes || "");
      setIsDefault(t.isDefault);
      setSelectedServices(
        Array.isArray(t.defaultServices) ? t.defaultServices : [],
      );
    } else {
      // Reset form for new template
      setName("");
      setDescription("");
      setCategory("");
      setTermsAndConditions("");
      setNotes("");
      setIsDefault(false);
      setSelectedServices([]);
    }
  }, [templateData]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("Select at least one service");
      return;
    }

    const data = {
      name,
      description: description || null,
      category: category || null,
      defaultServices: selectedServices.map((s) => ({
        componentCode: s.serviceCode,
        config: s.config,
      })),
      termsAndConditions: termsAndConditions || null,
      notes: notes || null,
      isDefault,
    };

    if (templateId) {
      updateTemplate({
        id: templateId,
        data,
      });
    } else {
      createTemplate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Startup Package, SME Standard"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="small-business">
                      Small Business
                    </SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault">Set as default template</Label>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <Label className="text-lg mb-4 block">Default Services *</Label>
            <ServiceSelector
              selectedServices={selectedServices}
              onChange={setSelectedServices}
            />
          </div>

          {/* Terms & Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="terms">Default Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Standard terms and conditions..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Default Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Default internal notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isCreating || isUpdating ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
