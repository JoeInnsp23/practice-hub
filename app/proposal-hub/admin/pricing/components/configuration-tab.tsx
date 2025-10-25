"use client";

import type { inferProcedureOutput } from "@trpc/server";
import { AlertCircle, Download, RefreshCcw, Save } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import type { AppRouter } from "@/app/server";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

// Type inference from tRPC router
type PricingConfigOutput = inferProcedureOutput<
  AppRouter["pricingConfig"]["getConfig"]
>;
type PricingConfig = NonNullable<PricingConfigOutput["config"]>;
type ComplexityMultipliers = PricingConfig["complexityMultipliers"]["modelA"];
type IndustryMultipliers = PricingConfig["industryMultipliers"];
type DiscountRules = PricingConfig["discountRules"];
type GlobalSettings = PricingConfig["globalSettings"];

export function ConfigurationTab() {
  const { data, isLoading, refetch } = trpc.pricingConfig.getConfig.useQuery();
  const updateComplexityMutation =
    trpc.pricingConfig.updateComplexityMultipliers.useMutation();
  const updateIndustryMutation =
    trpc.pricingConfig.updateIndustryMultipliers.useMutation();
  const updateDiscountsMutation =
    trpc.pricingConfig.updateDiscountRules.useMutation();
  const updateGlobalMutation =
    trpc.pricingConfig.updateGlobalSettings.useMutation();
  const resetMutation = trpc.pricingConfig.resetToDefaults.useMutation();
  const _exportMutation = trpc.pricingConfig.exportConfig.useQuery(undefined, {
    enabled: false,
  });

  const config = data?.config;
  const isDefault = data?.isDefault;

  const [complexityA, setComplexityA] = useState<ComplexityMultipliers>(
    config?.complexityMultipliers.modelA || {
      clean: 0.95,
      average: 1.0,
      complex: 1.15,
      disaster: 1.4,
    },
  );
  const [complexityB, setComplexityB] = useState<ComplexityMultipliers>(
    config?.complexityMultipliers.modelB || {
      clean: 0.95,
      average: 1.0,
      complex: 1.1,
      disaster: 1.25,
    },
  );
  const [industry, setIndustry] = useState<IndustryMultipliers>(
    config?.industryMultipliers || {
      simple: 0.95,
      standard: 1.0,
      complex: 1.15,
      regulated: 1.3,
    },
  );
  const [discounts, setDiscounts] = useState<DiscountRules>(
    config?.discountRules || {
      volumeTier1: {
        threshold: 500,
        percentage: 5,
        description: "5% volume discount (over £500/month)",
      },
      volumeTier2: {
        threshold: 1000,
        percentage: 3,
        description: "Additional 3% discount (over £1000/month)",
      },
      rushFee: {
        percentage: 25,
        description: "25% rush fee (within 1 month of deadline)",
      },
      newClient: {
        percentage: 10,
        duration: 12,
        description: "10% first-year discount (new client)",
      },
      customDiscount: {
        maxPercentage: 25,
        requiresApproval: true,
        description: "Custom discount (requires approval)",
      },
    },
  );
  const [global, setGlobal] = useState<GlobalSettings>(
    config?.globalSettings || {
      defaultTurnoverBand: "90k-149k",
      defaultIndustry: "standard" as const,
      roundingRule: "nearest_1" as const,
      currencySymbol: "£",
      taxRate: 0,
    },
  );

  // Update local state when config loads
  React.useEffect(() => {
    if (config) {
      setComplexityA(config.complexityMultipliers.modelA);
      setComplexityB(config.complexityMultipliers.modelB);
      setIndustry(config.industryMultipliers);
      setDiscounts(config.discountRules);
      setGlobal(config.globalSettings);
    }
  }, [config]);

  const handleSaveComplexity = async (model: "modelA" | "modelB") => {
    try {
      await updateComplexityMutation.mutateAsync({
        model,
        multipliers: model === "modelA" ? complexityA : complexityB,
      });
      toast.success(
        `${model === "modelA" ? "Model A" : "Model B"} complexity multipliers saved`,
      );
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveIndustry = async () => {
    try {
      await updateIndustryMutation.mutateAsync(industry);
      toast.success("Industry multipliers saved");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveDiscounts = async () => {
    try {
      await updateDiscountsMutation.mutateAsync(discounts);
      toast.success("Discount rules saved");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveGlobal = async () => {
    try {
      // Type assertion needed due to TypeScript widening literal types in state updates
      await updateGlobalMutation.mutateAsync({
        ...global,
        defaultIndustry: global.defaultIndustry as
          | "simple"
          | "standard"
          | "complex"
          | "regulated",
        roundingRule: global.roundingRule as
          | "none"
          | "nearest_1"
          | "nearest_5"
          | "nearest_10",
      });
      toast.success("Global settings saved");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Reset all pricing configuration to defaults? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await resetMutation.mutateAsync();
      toast.success("Configuration reset to defaults");
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleExport = () => {
    const exportData = JSON.stringify(config, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pricing-config-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  if (isLoading || !config) {
    return (
      <Card className="glass-card p-6">
        <p>Loading configuration...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Pricing Configuration</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isDefault
                ? "Using default configuration"
                : "Using custom configuration"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </Card>

      {/* Complexity Multipliers - Model A */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Model A Complexity Multipliers
            </h3>
            <p className="text-sm text-muted-foreground">
              Turnover-based pricing adjustments
            </p>
          </div>
          <Button onClick={() => handleSaveComplexity("modelA")} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["clean", "average", "complex", "disaster"].map((level) => (
            <div key={level}>
              <Label htmlFor={`modelA-${level}`} className="capitalize">
                {level}
              </Label>
              <Input
                id={`modelA-${level}`}
                type="number"
                step="0.01"
                min="0.5"
                max="2"
                value={complexityA[level as keyof typeof complexityA]}
                onChange={(e) =>
                  setComplexityA({
                    ...complexityA,
                    [level]: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {complexityA[level as keyof typeof complexityA] * 100 - 100 > 0
                  ? "+"
                  : ""}
                {(
                  (complexityA[level as keyof typeof complexityA] - 1) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Complexity Multipliers - Model B */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Model B Complexity Multipliers
            </h3>
            <p className="text-sm text-muted-foreground">
              Transaction-based pricing adjustments (typically lower)
            </p>
          </div>
          <Button onClick={() => handleSaveComplexity("modelB")} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["clean", "average", "complex", "disaster"].map((level) => (
            <div key={level}>
              <Label htmlFor={`modelB-${level}`} className="capitalize">
                {level}
              </Label>
              <Input
                id={`modelB-${level}`}
                type="number"
                step="0.01"
                min="0.5"
                max="2"
                value={complexityB[level as keyof typeof complexityB]}
                onChange={(e) =>
                  setComplexityB({
                    ...complexityB,
                    [level]: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {complexityB[level as keyof typeof complexityB] * 100 - 100 > 0
                  ? "+"
                  : ""}
                {(
                  (complexityB[level as keyof typeof complexityB] - 1) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Industry Multipliers */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Industry Multipliers</h3>
            <p className="text-sm text-muted-foreground">
              Pricing adjustments based on business industry
            </p>
          </div>
          <Button onClick={handleSaveIndustry} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["simple", "standard", "complex", "regulated"].map((type) => (
            <div key={type}>
              <Label htmlFor={`industry-${type}`} className="capitalize">
                {type}
              </Label>
              <Input
                id={`industry-${type}`}
                type="number"
                step="0.01"
                min="0.5"
                max="2"
                value={industry[type as keyof typeof industry]}
                onChange={(e) =>
                  setIndustry({
                    ...industry,
                    [type]: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {industry[type as keyof typeof industry] * 100 - 100 > 0
                  ? "+"
                  : ""}
                {((industry[type as keyof typeof industry] - 1) * 100).toFixed(
                  0,
                )}
                %
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Discount Rules */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Discount Rules</h3>
            <p className="text-sm text-muted-foreground">
              Volume discounts and special fees
            </p>
          </div>
          <Button onClick={handleSaveDiscounts} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="space-y-6">
          {/* Volume Tier 1 */}
          <div>
            <Label className="text-base font-semibold">
              Volume Discount Tier 1
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="volume1-threshold">Threshold (£/month)</Label>
                <Input
                  id="volume1-threshold"
                  type="number"
                  min="0"
                  value={discounts.volumeTier1.threshold}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      volumeTier1: {
                        ...discounts.volumeTier1,
                        threshold: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="volume1-percentage">Discount (%)</Label>
                <Input
                  id="volume1-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={discounts.volumeTier1.percentage}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      volumeTier1: {
                        ...discounts.volumeTier1,
                        percentage: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Volume Tier 2 */}
          <div>
            <Label className="text-base font-semibold">
              Volume Discount Tier 2
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="volume2-threshold">Threshold (£/month)</Label>
                <Input
                  id="volume2-threshold"
                  type="number"
                  min="0"
                  value={discounts.volumeTier2.threshold}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      volumeTier2: {
                        ...discounts.volumeTier2,
                        threshold: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="volume2-percentage">
                  Additional Discount (%)
                </Label>
                <Input
                  id="volume2-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={discounts.volumeTier2.percentage}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      volumeTier2: {
                        ...discounts.volumeTier2,
                        percentage: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Rush Fee */}
          <div>
            <Label className="text-base font-semibold">Rush Fee</Label>
            <div className="mt-2">
              <Label htmlFor="rush-percentage">Percentage (%)</Label>
              <Input
                id="rush-percentage"
                type="number"
                min="0"
                max="100"
                value={discounts.rushFee.percentage}
                onChange={(e) =>
                  setDiscounts({
                    ...discounts,
                    rushFee: {
                      ...discounts.rushFee,
                      percentage: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          {/* New Client Discount */}
          <div>
            <Label className="text-base font-semibold">
              New Client Discount
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="newclient-percentage">Discount (%)</Label>
                <Input
                  id="newclient-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={discounts.newClient.percentage}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      newClient: {
                        ...discounts.newClient,
                        percentage: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newclient-duration">Duration (months)</Label>
                <Input
                  id="newclient-duration"
                  type="number"
                  min="1"
                  max="36"
                  value={discounts.newClient.duration}
                  onChange={(e) =>
                    setDiscounts({
                      ...discounts,
                      newClient: {
                        ...discounts.newClient,
                        duration: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Global Settings */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Global Settings</h3>
            <p className="text-sm text-muted-foreground">
              Default values and system preferences
            </p>
          </div>
          <Button onClick={handleSaveGlobal} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="default-turnover">Default Turnover Band</Label>
            <Select
              value={global.defaultTurnoverBand}
              onValueChange={(value) => {
                setGlobal({
                  defaultTurnoverBand: value,
                  defaultIndustry: global.defaultIndustry as
                    | "simple"
                    | "standard"
                    | "complex"
                    | "regulated",
                  roundingRule: global.roundingRule as
                    | "none"
                    | "nearest_1"
                    | "nearest_5"
                    | "nearest_10",
                  currencySymbol: global.currencySymbol,
                  taxRate: global.taxRate,
                });
              }}
            >
              <SelectTrigger id="default-turnover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-89k">£0 - £89k</SelectItem>
                <SelectItem value="90k-149k">£90k - £149k</SelectItem>
                <SelectItem value="150k-249k">£150k - £249k</SelectItem>
                <SelectItem value="250k-499k">£250k - £499k</SelectItem>
                <SelectItem value="500k-749k">£500k - £749k</SelectItem>
                <SelectItem value="750k-999k">£750k - £999k</SelectItem>
                <SelectItem value="1m+">£1M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="default-industry">Default Industry</Label>
            <Select
              value={global.defaultIndustry}
              onValueChange={(value) => {
                setGlobal({
                  defaultTurnoverBand: global.defaultTurnoverBand,
                  defaultIndustry: value as
                    | "simple"
                    | "standard"
                    | "complex"
                    | "regulated",
                  roundingRule: global.roundingRule as
                    | "none"
                    | "nearest_1"
                    | "nearest_5"
                    | "nearest_10",
                  currencySymbol: global.currencySymbol,
                  taxRate: global.taxRate,
                });
              }}
            >
              <SelectTrigger id="default-industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
                <SelectItem value="regulated">Regulated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rounding-rule">Rounding Rule</Label>
            <Select
              value={global.roundingRule}
              onValueChange={(value) => {
                setGlobal({
                  defaultTurnoverBand: global.defaultTurnoverBand,
                  defaultIndustry: global.defaultIndustry as
                    | "simple"
                    | "standard"
                    | "complex"
                    | "regulated",
                  roundingRule: value as
                    | "none"
                    | "nearest_1"
                    | "nearest_5"
                    | "nearest_10",
                  currencySymbol: global.currencySymbol,
                  taxRate: global.taxRate,
                });
              }}
            >
              <SelectTrigger id="rounding-rule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Rounding</SelectItem>
                <SelectItem value="nearest_1">Nearest £1</SelectItem>
                <SelectItem value="nearest_5">Nearest £5</SelectItem>
                <SelectItem value="nearest_10">Nearest £10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">Currency Symbol</Label>
            <Input
              id="currency"
              value={global.currencySymbol}
              onChange={(e) => {
                setGlobal({
                  defaultTurnoverBand: global.defaultTurnoverBand,
                  defaultIndustry: global.defaultIndustry as
                    | "simple"
                    | "standard"
                    | "complex"
                    | "regulated",
                  roundingRule: global.roundingRule as
                    | "none"
                    | "nearest_1"
                    | "nearest_5"
                    | "nearest_10",
                  currencySymbol: e.target.value,
                  taxRate: global.taxRate,
                });
              }}
              maxLength={3}
            />
          </div>
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Changes to pricing configuration will affect all new quotes
          immediately. Existing proposals will not be updated.
        </AlertDescription>
      </Alert>
    </div>
  );
}
