import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaveRequestPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Request Leave</h1>
        <p className="text-muted-foreground mt-2">Submit a new leave request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Leave Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Leave request form will be migrated from Client Hub in Task 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
