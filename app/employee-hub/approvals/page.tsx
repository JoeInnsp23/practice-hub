import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApprovalsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve team timesheets and leave requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Approval queue will be migrated from Client Hub and Admin Hub in
            Tasks 2 and 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
