"use client";

import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

interface ClientData {
  clientId?: string;
  name: string;
  revenue: number;
  percentage: number;
  change: number;
  services: number;
}

interface ClientBreakdownProps {
  data: ClientData[];
  totalRevenue: number;
  "data-testid"?: string;
}

export function ClientBreakdown({ data, totalRevenue, "data-testid": dataTestId }: ClientBreakdownProps) {
  const router = useRouter();
  const topClients = data.slice(0, 10);

  const getColorClass = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-gray-500",
    ];
    return colors[index % colors.length];
  };

  const handleClientClick = (clientId?: string) => {
    if (clientId) {
      router.push(`/client-hub/clients/${clientId}`);
    }
  };

  return (
    <Card data-testid={dataTestId}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clients
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue breakdown by client
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pie Chart Representation */}
          <div className="relative h-48 flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Simple donut chart using divs */}
              <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-800"></div>
              <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-900"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{topClients.length}</p>
                  <p className="text-xs text-muted-foreground">Top Clients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div
                key={client.name}
                onClick={() => handleClientClick(client.clientId)}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  client.clientId
                    ? "cursor-pointer hover:bg-accent/50"
                    : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${getColorClass(index)}`}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.services} services
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(client.revenue)}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {client.percentage.toFixed(1)}%
                    </span>
                    {client.change !== 0 && (
                      <span
                        className={`flex items-center text-xs ${client.change > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
                      >
                        {client.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(client.change)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More */}
          {data.length > 10 && (
            <div className="pt-4 border-t text-center">
              <Badge variant="secondary">
                +{data.length - 10} more clients
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
