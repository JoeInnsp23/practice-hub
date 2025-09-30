"use client";

import { CheckCircle2, ChevronDown, ChevronRight, Circle, Package } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceConfig {
  complexity?: "clean" | "average" | "complex" | "disaster";
  employees?: number;
  payrollFrequency?: "monthly" | "weekly" | "fortnightly" | "4weekly";
  [key: string]: any;
}

interface SelectedService {
  componentCode: string;
  quantity?: number;
  config?: ServiceConfig;
}

interface ServiceSelectorProps {
  selectedServices: SelectedService[];
  onChange: (services: SelectedService[]) => void;
}

export function ServiceSelector({
  selectedServices,
  onChange,
}: ServiceSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["compliance", "bookkeeping"]),
  );

  const { data: components, isLoading } =
    trpc.pricing.getComponents.useQuery();

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Select Services</h2>
        </div>
        <p className="text-muted-foreground">Loading services...</p>
      </Card>
    );
  }

  // Group components by category
  const groupedComponents = components?.reduce(
    (acc, comp) => {
      const category = comp.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(comp);
      return acc;
    },
    {} as Record<string, typeof components>,
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const isServiceSelected = (code: string) => {
    return selectedServices.some((s) => s.componentCode === code);
  };

  const getServiceConfig = (code: string): ServiceConfig | undefined => {
    return selectedServices.find((s) => s.componentCode === code)?.config;
  };

  const handleToggleService = (code: string) => {
    if (isServiceSelected(code)) {
      onChange(selectedServices.filter((s) => s.componentCode !== code));
    } else {
      onChange([...selectedServices, { componentCode: code }]);
    }
  };

  const handleUpdateConfig = (code: string, config: ServiceConfig) => {
    const updated = selectedServices.map((s) =>
      s.componentCode === code ? { ...s, config } : s,
    );
    onChange(updated);
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Select Services</h2>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedComponents || {}).map(([category, comps]) => (
          <div key={category} className="border rounded-lg">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{getCategoryLabel(category)}</span>
                <span className="text-xs text-muted-foreground">
                  ({comps.filter((c) => isServiceSelected(c.code)).length}/
                  {comps.length})
                </span>
              </div>
            </button>

            {/* Category Content */}
            {expandedCategories.has(category) && (
              <div className="p-4 pt-0 space-y-4">
                {comps.map((comp) => (
                  <div
                    key={comp.code}
                    className={`border rounded-lg p-4 transition-colors ${
                      isServiceSelected(comp.code)
                        ? "bg-muted/50 border-green-200 dark:border-green-900"
                        : "border-border"
                    }`}
                  >
                    {/* Service Item */}
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleService(comp.code)}
                        className="mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                      >
                        {isServiceSelected(comp.code) ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0 hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div
                          onClick={() => handleToggleService(comp.code)}
                          className="cursor-pointer"
                        >
                          <p className="text-base font-medium">
                            {comp.name}
                          </p>
                          {comp.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {comp.description}
                            </p>
                          )}
                        </div>

                        {/* Service Configuration */}
                        {isServiceSelected(comp.code) && (
                          <div className="space-y-3 mt-3">
                            {/* Complexity selector for bookkeeping */}
                            {comp.supportsComplexity &&
                              (comp.code.includes("BOOK") ||
                                comp.code.includes("ACCOUNTS")) && (
                                <div>
                                  <Label className="text-sm">
                                    Complexity Level
                                  </Label>
                                  <Select
                                    value={
                                      getServiceConfig(comp.code)?.complexity ||
                                      "average"
                                    }
                                    onValueChange={(value) =>
                                      handleUpdateConfig(comp.code, {
                                        ...getServiceConfig(comp.code),
                                        complexity: value as ServiceConfig["complexity"],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="clean">
                                        Clean (Well organized, up to date)
                                      </SelectItem>
                                      <SelectItem value="average">
                                        Average (Mostly okay)
                                      </SelectItem>
                                      <SelectItem value="complex">
                                        Complex (Behind, needs work)
                                      </SelectItem>
                                      <SelectItem value="disaster">
                                        Disaster (Major cleanup needed)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                            {/* Payroll configuration */}
                            {comp.code.includes("PAYROLL") && (
                              <>
                                <div>
                                  <Label className="text-sm">
                                    Number of Employees
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={
                                      getServiceConfig(comp.code)?.employees || 1
                                    }
                                    onChange={(e) =>
                                      handleUpdateConfig(comp.code, {
                                        ...getServiceConfig(comp.code),
                                        employees: Number.parseInt(e.target.value),
                                      })
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">
                                    Payroll Frequency
                                  </Label>
                                  <Select
                                    value={
                                      getServiceConfig(comp.code)?.payrollFrequency ||
                                      "monthly"
                                    }
                                    onValueChange={(value) =>
                                      handleUpdateConfig(comp.code, {
                                        ...getServiceConfig(comp.code),
                                        payrollFrequency:
                                          value as ServiceConfig["payrollFrequency"],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="weekly">
                                        Weekly (3x monthly rate)
                                      </SelectItem>
                                      <SelectItem value="fortnightly">
                                        Fortnightly (2x monthly rate)
                                      </SelectItem>
                                      <SelectItem value="4weekly">
                                        4-Weekly (2x monthly rate)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedServices.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </Card>
  );
}
