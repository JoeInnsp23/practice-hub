"use client";

import {
  AlertCircle,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
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

interface PricingRule {
  id: string;
  componentId: string;
  ruleType: string;
  minValue: string | null;
  maxValue: string | null;
  price: string;
  complexityLevel: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
}

interface RuleWithComponent extends PricingRule {
  componentName: string;
  componentCode: string;
}

export function PricingRulesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [componentFilter, setComponentFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleWithComponent | null>(null);

  const { data, isLoading, refetch } = trpc.pricingAdmin.getAllRules.useQuery();
  const { data: componentsData } = trpc.pricingAdmin.getAllComponents.useQuery();
  const deleteMutation = trpc.pricingAdmin.deleteRule.useMutation();

  const rules = (data?.rules || []).map((r) => ({
    ...r.rule,
    componentName: r.componentName || "Unknown",
    componentCode: r.componentCode || "UNKNOWN",
  }));

  const components = componentsData?.components || [];

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.componentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComponent =
      componentFilter === "all" || rule.componentId === componentFilter;
    return matchesSearch && matchesComponent;
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    inactive: rules.filter((r) => !r.isActive).length,
  };

  const handleCreate = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEdit = (rule: RuleWithComponent) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDelete = async (rule: PricingRule) => {
    if (!confirm("Delete this pricing rule? This cannot be undone.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(rule.id);
      toast.success("Pricing rule deleted");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const formatRange = (rule: PricingRule) => {
    if (!rule.minValue && !rule.maxValue) return "N/A";
    if (rule.ruleType === "per_unit") return "Per unit";

    const min = rule.minValue ? `£${Number(rule.minValue).toLocaleString()}` : "0";
    const max = rule.maxValue ? `£${Number(rule.maxValue).toLocaleString()}` : "∞";
    return `${min} - ${max}`;
  };

  return (
    <>
      <Card className="glass-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Pricing Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} total • {stats.active} active • {stats.inactive} inactive
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={componentFilter} onValueChange={setComponentFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {components.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.name}
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
                <TableHead>Service</TableHead>
                <TableHead>Rule Type</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Complexity</TableHead>
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
              ) : filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No pricing rules found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.componentName}
                      <div className="text-xs text-muted-foreground font-mono">
                        {rule.componentCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {rule.ruleType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatRange(rule)}</TableCell>
                    <TableCell className="font-semibold">
                      £{Number(rule.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {rule.complexityLevel ? (
                        <Badge variant="secondary" className="capitalize">
                          {rule.complexityLevel}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.isActive ? "default" : "secondary"}
                        className={rule.isActive ? "bg-green-600" : "bg-gray-500"}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(rule)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(rule)}
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
        <PricingRuleForm
          rule={editingRule}
          components={components}
          onClose={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRule(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

interface PricingRuleFormProps {
  rule: RuleWithComponent | null;
  components: Array<{ id: string; code: string; name: string; pricingModel: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

function PricingRuleForm({ rule, components, onClose, onSuccess }: PricingRuleFormProps) {
  const [formData, setFormData] = useState({
    componentId: rule?.componentId || "",
    ruleType: rule?.ruleType || ("turnover_band" as const),
    minValue: rule?.minValue || "",
    maxValue: rule?.maxValue || "",
    price: rule?.price || "",
    complexityLevel: rule?.complexityLevel || "",
    metadata: rule?.metadata || {},
    isActive: rule?.isActive ?? true,
  });

  const createMutation = trpc.pricingAdmin.createRule.useMutation();
  const updateMutation = trpc.pricingAdmin.updateRule.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.minValue && formData.maxValue) {
      if (Number(formData.minValue) >= Number(formData.maxValue)) {
        toast.error("Minimum value must be less than maximum value");
        return;
      }
    }

    try {
      if (rule) {
        await updateMutation.mutateAsync({
          id: rule.id,
          data: formData,
        });
        toast.success("Pricing rule updated");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Pricing rule created");
      }
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const selectedComponent = components.find((c) => c.id === formData.componentId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Pricing Rule" : "Add Pricing Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure pricing for a service component
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="componentId">Service Component *</Label>
            <Select
              value={formData.componentId}
              onValueChange={(value) =>
                setFormData({ ...formData, componentId: value })
              }
            >
              <SelectTrigger id="componentId">
                <SelectValue placeholder="Select service..." />
              </SelectTrigger>
              <SelectContent>
                {components.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name} ({comp.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ruleType">Rule Type *</Label>
            <Select
              value={formData.ruleType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  ruleType: value as typeof formData.ruleType,
                })
              }
            >
              <SelectTrigger id="ruleType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="turnover_band">Turnover Band</SelectItem>
                <SelectItem value="transaction_band">Transaction Band</SelectItem>
                <SelectItem value="employee_band">Employee Band</SelectItem>
                <SelectItem value="per_unit">Per Unit</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.ruleType !== "fixed" && formData.ruleType !== "per_unit" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minValue">Minimum Value</Label>
                <Input
                  id="minValue"
                  type="number"
                  step="0.01"
                  value={formData.minValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minValue: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxValue">Maximum Value</Label>
                <Input
                  id="maxValue"
                  type="number"
                  step="0.01"
                  value={formData.maxValue}
                  onChange={(e) =>
                    setFormData({ ...formData, maxValue: e.target.value })
                  }
                  placeholder="999999"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="price">
              Price (£{formData.ruleType === "per_unit" ? "/unit" : "/month"}) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {selectedComponent?.pricingModel !== "fixed" && (
            <div>
              <Label htmlFor="complexityLevel">Complexity Level (Optional)</Label>
              <Select
                value={formData.complexityLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, complexityLevel: value })
                }
              >
                <SelectTrigger id="complexityLevel">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                  <SelectItem value="disaster">Disaster</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

          {formData.minValue && formData.maxValue && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rule will apply to values from £{Number(formData.minValue).toLocaleString()} to £
                {Number(formData.maxValue).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
