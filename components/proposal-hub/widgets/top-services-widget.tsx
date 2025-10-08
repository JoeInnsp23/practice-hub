"use client";

import { TrendingUp } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Card } from "@/components/ui/card";

export function TopServicesWidget() {
  // Fetch top 5 services
  const { data, isLoading } = trpc.analytics.getServicePopularity.useQuery({
    limit: 5,
  });

  const services = data?.services || [];
  const totalProposals = data?.totalProposals || 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Services</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-sm">Loading services...</div>
        </div>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Services</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No service data yet</p>
            <p className="text-xs text-muted-foreground">
              Create proposals to see popular services
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Top Services</h3>
        <span className="text-xs text-muted-foreground">
          From {totalProposals} proposals
        </span>
      </div>
      <div className="space-y-4">
        {services.map((service, index) => {
          const percentage = service.percentage;
          const avgPrice = Number(service.avgPrice);

          return (
            <div key={service.componentCode} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground truncate">
                      {service.componentName}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">
                    {percentage.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {service.count} proposals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  £{avgPrice.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
