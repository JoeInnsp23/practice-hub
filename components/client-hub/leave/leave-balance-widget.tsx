import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeaveBalanceWidgetProps {
  balance: {
    entitlement: number;
    used: number;
    remaining: number;
    carriedOver: number;
    toilBalance: number;
    sickUsed: number;
  };
  className?: string;
}

// Note: This interface expects transformed data from the page
// Database schema uses: annualEntitlement, annualUsed, etc.
// Page transforms to: entitlement, used, remaining for consistency

export function LeaveBalanceWidget({
  balance,
  className,
}: LeaveBalanceWidgetProps) {
  const percentageUsed = (balance.used / balance.entitlement) * 100;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Leave Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Annual Leave</span>
            <span className="font-medium">
              {balance.remaining} of {balance.entitlement} days
            </span>
          </div>
          <Progress value={percentageUsed} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{balance.used} days used</span>
            <span>{percentageUsed.toFixed(0)}%</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {balance.remaining}
            </div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{balance.used}</div>
            <div className="text-xs text-muted-foreground">Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {balance.carriedOver}
            </div>
            <div className="text-xs text-muted-foreground">Carried Over</div>
          </div>
        </div>

        {/* Additional Balances */}
        <div className="pt-4 border-t space-y-2">
          {balance.toilBalance > 0 && (
            <Badge className="bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 w-full justify-center">
              <Clock className="h-3 w-3 mr-1" />
              {balance.toilBalance} TOIL day
              {balance.toilBalance !== 1 ? "s" : ""} available
            </Badge>
          )}
          {balance.sickUsed > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              {balance.sickUsed} sick day{balance.sickUsed !== 1 ? "s" : ""}{" "}
              used this year
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
