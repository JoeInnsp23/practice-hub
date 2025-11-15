"use client";

import {
  AlertCircle,
  Check,
  Copy,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

type ServicePriceType = "hourly" | "fixed" | "retainer";

interface ServiceComponent {
  id: string;
  tenantId?: string;
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
  description: string | null;
  pricingModel: "turnover" | "transaction" | "both" | "fixed";
  basePrice: string | null;
  price: string | null;
  priceType: ServicePriceType | null;
  supportsComplexity: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  pricingRulesCount?: number;
  sortOrder?: number | null;
}

export function ServiceComponentsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<ServiceComponent | null>(null);

  const { data, isLoading, refetch } =
    trpc.pricingAdmin.getAllComponents.useQuery();
  const _createMutation = trpc.pricingAdmin.createComponent.useMutation();
  const updateMutation = trpc.pricingAdmin.updateComponent.useMutation();
  const deleteMutation = trpc.pricingAdmin.deleteComponent.useMutation();
  const cloneMutation = trpc.pricingAdmin.cloneComponent.useMutation();

  const components = data?.components || [];

  // Filter components
  const filteredComponents = components.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || comp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: components.length,
    active: components.filter((c) => c.isActive).length,
    inactive: components.filter((c) => !c.isActive).length,
  };

  const handleCreate = () => {
    setEditingComponent(null);
    setShowForm(true);
  };

  const handleEdit = (component: ServiceComponent) => {
    setEditingComponent(component);
    setShowForm(true);
  };

  const handleClone = async (component: ServiceComponent) => {
    try {
      await cloneMutation.mutateAsync({
        id: component.id,
        newCode: `${component.code}_COPY`,
        newName: `${component.name} (Copy)`,
      });
      toast.success("Service component cloned successfully");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDelete = async (component: ServiceComponent) => {
    if (!confirm(`Delete "${component.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(component.id);
      toast.success("Service component deleted");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleActive = async (component: ServiceComponent) => {
    try {
      await updateMutation.mutateAsync({
        id: component.id,
        data: { isActive: !component.isActive },
      });
      toast.success(
        `Service component ${component.isActive ? "deactivated" : "activated"}`,
      );
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const categories = ["all", ...new Set(components.map((c) => c.category))];

  return (
    <>
      <Card className="glass-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Service Components</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} total • {stats.active} active • {stats.inactive}{" "}
              inactive
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing Model</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No service components found
                  </TableCell>
                </TableRow>
              ) : (
                filteredComponents.map((component) => (
                  <TableRow key={component.id} className="table-row">
                    <TableCell className="font-mono text-xs">
                      {component.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {component.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{component.category}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {component.pricingModel}
                    </TableCell>
                    <TableCell>
                      {component.basePrice ? `£${component.basePrice}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={component.isActive ? "default" : "secondary"}
                        className={
                          component.isActive ? "bg-green-600" : "bg-gray-500"
                        }
                      >
                        {component.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={GLASS_DROPDOWN_MENU_STYLES}
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleEdit(component as ServiceComponent)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleClone(component as ServiceComponent)
                            }
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleActive(component as ServiceComponent)
                            }
                          >
                            {component.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(component as ServiceComponent)
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Form Dialog */}
      {showForm && (
        <ServiceComponentForm
          component={editingComponent}
          onClose={() => {
            setShowForm(false);
            setEditingComponent(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingComponent(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

interface ServiceComponentFormProps {
  component: ServiceComponent | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ServiceComponentForm({
  component,
  onClose,
  onSuccess,
}: ServiceComponentFormProps) {
  const [formData, setFormData] = useState({
    code: component?.code || "",
    name: component?.name || "",
    category: (component?.category || "compliance") as
      | "compliance"
      | "vat"
      | "bookkeeping"
      | "payroll"
      | "management"
      | "secretarial"
      | "tax_planning"
      | "addon",
    description: component?.description || "",
    pricingModel: (component?.pricingModel || "fixed") as
      | "fixed"
      | "turnover"
      | "transaction"
      | "both",
    basePrice: component?.basePrice || "",
    price: component?.price || "",
    priceType: (component?.priceType || "fixed") as
      | "fixed"
      | "hourly"
      | "retainer"
      | "project"
      | "percentage",
    supportsComplexity: component?.supportsComplexity || false,
    isActive: component?.isActive ?? true,
  });

  const createMutation = trpc.pricingAdmin.createComponent.useMutation();
  const updateMutation = trpc.pricingAdmin.updateComponent.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (component) {
        await updateMutation.mutateAsync({
          id: component.id,
          data: formData,
        });
        toast.success("Service component updated");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Service component created");
      }
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {component ? "Edit Service Component" : "Add Service Component"}
          </DialogTitle>
          <DialogDescription>
            Configure a service component that can be included in proposals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">
                Code *{" "}
                <span className="text-xs text-muted-foreground">
                  (e.g., COMP_ACCOUNTS)
                </span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="COMP_ACCOUNTS"
                required
                disabled={!!component}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as
                      | "compliance"
                      | "vat"
                      | "bookkeeping"
                      | "payroll"
                      | "management"
                      | "secretarial"
                      | "tax_planning"
                      | "addon",
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                  <SelectItem value="bookkeeping">Bookkeeping</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="secretarial">Secretarial</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                  <SelectItem value="addon">Add-On</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Annual Accounts & Corporation Tax"
              required
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
              placeholder="Year-end accounts preparation and Corporation Tax return filing"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pricingModel">Pricing Model *</Label>
              <Select
                value={formData.pricingModel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    pricingModel: value as typeof formData.pricingModel,
                  })
                }
              >
                <SelectTrigger id="pricingModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="turnover">Turnover-Based</SelectItem>
                  <SelectItem value="transaction">Transaction-Based</SelectItem>
                  <SelectItem value="both">
                    Both (Turnover & Transaction)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.pricingModel === "transaction" ||
              formData.pricingModel === "both" ||
              formData.pricingModel === "fixed") && (
              <div>
                <Label htmlFor="basePrice">Base Price (£/month)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="supportsComplexity"
              checked={formData.supportsComplexity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supportsComplexity: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
            <Label
              htmlFor="supportsComplexity"
              className="font-normal cursor-pointer"
            >
              Supports Complexity Multipliers
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>

          {formData.pricingModel !== "fixed" &&
            formData.pricingModel !== "turnover" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll need to create pricing rules for this component after
                  saving.
                </AlertDescription>
              </Alert>
            )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : component
                  ? "Update Service"
                  : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
