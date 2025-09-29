import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  subtext?: string;
}

export function KPIWidget({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  onClick,
  className,
  loading = false,
  subtext,
}: KPIWidgetProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            {(change || subtext) && <Skeleton className="h-4 w-32" />}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <p
                className={cn(
                  "text-xs mt-1",
                  change.trend === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-destructive",
                )}
              >
                {change.trend === "up" ? "↑" : "↓"} {Math.abs(change.value)}%
                from last month
              </p>
            )}
            {subtext && !change && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
