import { AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToilBalanceWidgetProps {
  balance: {
    totalHours: number;
    totalDays: number;
    expiringHours: number;
    expiringDays: number;
    expiryDate: string | null;
  };
  className?: string;
}

export function ToilBalanceWidget({
  balance,
  className,
}: ToilBalanceWidgetProps) {
  const hasExpiringToil = balance.expiringHours > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          TOIL Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-muted-foreground">
              Time Off In Lieu
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {balance.totalHours.toFixed(1)} hrs
              </div>
              <div className="text-sm text-muted-foreground">
                {balance.totalDays} day{balance.totalDays !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Earned from approved overtime hours
          </p>
        </div>

        {/* Expiring TOIL Warning */}
        {hasExpiringToil && (
          <div className="pt-4 border-t">
            <Badge
              variant="outline"
              className="w-full justify-center bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {balance.expiringHours.toFixed(1)} hrs ({balance.expiringDays} day
              {balance.expiringDays !== 1 ? "s" : ""}) expiring soon
            </Badge>
            {balance.expiryDate && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Expires on{" "}
                {new Date(balance.expiryDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {balance.totalHours.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{balance.totalDays}</div>
            <div className="text-xs text-muted-foreground">
              Day{balance.totalDays !== 1 ? "s" : ""} Available
            </div>
          </div>
        </div>

        {/* Info Message */}
        {balance.totalHours === 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              TOIL is earned when you work overtime. Submit timesheets with
              hours exceeding your weekly capacity to accrue TOIL.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
