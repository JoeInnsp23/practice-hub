import { Umbrella } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaveBalancePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          My Leave Balances
        </h1>
        <p className="text-muted-foreground mt-2">
          View your current leave balances and entitlements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Umbrella className="h-5 w-5 text-emerald-600" />
            Leave Balance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Leave balance view will be created in Task 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
