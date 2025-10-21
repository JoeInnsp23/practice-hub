"use client";

import { TrendingDown, TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AnalyticsKpiCardsProps {
  winRate?: number;
  avgDealSize?: number;
  avgSalesCycle?: number;
  pipelineValue?: number;
  isLoading?: boolean;
}

export function AnalyticsKpiCards({
  winRate = 0,
  avgDealSize = 0,
  avgSalesCycle = 0,
  pipelineValue = 0,
  isLoading = false,
}: AnalyticsKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-32" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 50 ? "text-green-600" : "text-yellow-600",
      bgColor: winRate >= 50 ? "bg-green-100 dark:bg-green-900/20" : "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      title: "Avg Deal Size",
      value: `£${Math.round(avgDealSize).toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Sales Cycle",
      value: `${avgSalesCycle.toFixed(0)} days`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Pipeline Value",
      value: `£${Math.round(pipelineValue).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
