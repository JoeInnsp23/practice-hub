"use client";

import { AlertCircle, ChevronDown, DollarSign, Loader2, Send } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FloatingPriceWidgetProps {
  turnover: string;
  industry: string;
  services: Array<{
    componentCode: string;
    quantity?: number;
    config?: Record<string, any>;
  }>;
  transactionData?: {
    monthlyTransactions: number;
    source: "xero" | "manual" | "estimated";
  };
  onCreateProposal?: () => void;
  onViewBreakdown?: () => void;
}

export function FloatingPriceWidget({
  turnover,
  industry,
  services,
  transactionData,
  onCreateProposal,
  onViewBreakdown,
}: FloatingPriceWidgetProps) {
  const { data, isLoading, error } = trpc.pricing.calculate.useQuery({
    turnover,
    industry,
    services,
    transactionData,
  });

  // Don't show widget if no services selected
  if (services.length === 0) {
    return null;
  }

  const recommendedModel =
    data?.recommendation?.model === "B" && data?.modelB
      ? data.modelB
      : data?.modelA;

  return (
    <Card className="glass-card fixed right-6 top-24 z-50 w-80 shadow-2xl hidden lg:block">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live Pricing</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Service Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Services Selected</span>
          <Badge variant="secondary">{services.length}</Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error.message || "Failed to calculate pricing"}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Display */}
        {data && recommendedModel && (
          <div className="space-y-3">
            {/* Recommended Model Badge */}
            {data.recommendation && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Recommended:
                </span>
                <Badge className="bg-primary">
                  Model {data.recommendation.model}
                </Badge>
              </div>
            )}

            {/* Monthly Total */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Monthly</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  £{recommendedModel.monthlyTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Annual</span>
                <span className="text-lg font-semibold">
                  £{recommendedModel.annualTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Discount Info */}
            {recommendedModel.discounts.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {recommendedModel.discounts.reduce((sum, d) => sum + d.amount, 0) > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    💰 Saving £
                    {recommendedModel.discounts
                      .reduce((sum, d) => sum + d.amount, 0)
                      .toFixed(2)}
                    /month
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={onViewBreakdown}
            disabled={isLoading || !data}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            View Full Breakdown
          </Button>
          <Button
            className="w-full"
            size="sm"
            onClick={onCreateProposal}
            disabled={isLoading || !data}
          >
            <Send className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>
    </Card>
  );
}
