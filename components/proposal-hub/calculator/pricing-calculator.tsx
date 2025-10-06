"use client";

import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PricingCalculatorProps {
  turnover: string;
  industry: "simple" | "standard" | "complex" | "regulated";
  services: Array<{
    componentCode: string;
    quantity?: number;
    config?: Record<string, unknown>;
  }>;
  transactionData?: {
    monthlyTransactions: number;
    source: "xero" | "manual" | "estimated";
  };
}

export function PricingCalculator({
  turnover,
  industry,
  services,
  transactionData,
}: PricingCalculatorProps) {
  const { data, isLoading, error } = trpc.pricing.calculate.useQuery({
    turnover,
    industry,
    services,
    transactionData,
  });

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Pricing Calculation</h2>
        </div>
        <p className="text-muted-foreground">Calculating pricing...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Pricing Calculation</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { modelA, modelB, recommendation } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Pricing Calculation</h2>
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <Alert className="border-primary/50 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>
            <span className="font-semibold">
              Recommended: Model {recommendation.model}
            </span>
            {" - "}
            {recommendation.reason}
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model A */}
        <PricingModelCard
          model={modelA}
          isRecommended={recommendation?.model === "A"}
          label="Model A"
          description="Turnover-Based Pricing"
        />

        {/* Model B */}
        {modelB ? (
          <PricingModelCard
            model={modelB}
            isRecommended={recommendation?.model === "B"}
            label="Model B"
            description="Transaction-Based Pricing"
          />
        ) : (
          <Card className="glass-card p-6 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Model B</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction-Based Pricing
                </p>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Transaction data required for Model B calculation. Enter or
                estimate monthly transactions above.
              </AlertDescription>
            </Alert>
          </Card>
        )}
      </div>
    </div>
  );
}

interface PricingModelCardProps {
  model: {
    name: string;
    services: Array<{
      componentCode: string;
      componentName: string;
      calculation: string;
      basePrice: number;
      adjustments: Array<{
        type: string;
        description: string;
        multiplier?: number;
        amount?: number;
      }>;
      finalPrice: number;
    }>;
    subtotal: number;
    discounts: Array<{
      type: string;
      description: string;
      percentage?: number;
      amount: number;
    }>;
    total: number;
    monthlyTotal: number;
    annualTotal: number;
  };
  isRecommended: boolean;
  label: string;
  description: string;
}

function PricingModelCard({
  model,
  isRecommended,
  label,
  description,
}: PricingModelCardProps) {
  return (
    <Card
      className={`glass-card p-6 ${
        isRecommended ? "border-2 border-primary shadow-lg" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{label}</h3>
            {isRecommended && <Badge className="bg-primary">Recommended</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Services Breakdown */}
      <div className="space-y-3 mb-6">
        {model.services.map((service, _index) => (
          <div
            key={service.componentCode}
            className="flex justify-between items-start text-sm"
          >
            <div className="flex-1">
              <p className="font-medium">{service.componentName}</p>
              <p className="text-xs text-muted-foreground">
                {service.calculation}
              </p>
              {service.adjustments.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {service.adjustments.map((adj) => (
                    <p
                      key={`${adj.type}-${adj.description}`}
                      className="text-xs text-muted-foreground italic"
                    >
                      • {adj.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <p className="font-semibold whitespace-nowrap ml-4">
              £{service.finalPrice.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between text-sm">
          <p className="text-muted-foreground">Subtotal</p>
          <p className="font-medium">£{model.subtotal.toFixed(2)}</p>
        </div>

        {/* Discounts */}
        {model.discounts.length > 0 && (
          <div className="space-y-1">
            {model.discounts.map((discount) => (
              <div
                key={`${discount.type}-${discount.description}`}
                className="flex justify-between text-sm"
              >
                <p className="text-muted-foreground flex items-center gap-1">
                  {discount.amount < 0 ? (
                    <span className="text-orange-600">⚠</span>
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-600" />
                  )}
                  {discount.description}
                </p>
                <p
                  className={
                    discount.amount < 0
                      ? "text-orange-600 font-medium"
                      : "text-green-600 font-medium"
                  }
                >
                  {discount.amount < 0 ? "+" : "-"}£
                  {Math.abs(discount.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t">
          <div>
            <p className="font-bold text-lg">Monthly Total</p>
            <p className="text-xs text-muted-foreground">
              £{model.annualTotal.toFixed(2)} per year
            </p>
          </div>
          <p className="font-bold text-2xl text-primary">
            £{model.monthlyTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
