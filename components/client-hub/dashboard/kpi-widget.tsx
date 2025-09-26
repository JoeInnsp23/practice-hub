import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
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
}

export function KPIWidget({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  onClick,
  className,
}: KPIWidgetProps) {
  return (
    <Card
      className={cn(
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={cn(
              "text-xs mt-1",
              change.trend === "up" ? "text-green-600" : "text-red-600"
            )}
          >
            {change.trend === "up" ? "↑" : "↓"} {Math.abs(change.value)}% from
            last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}