import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimeEntryHistoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Time Entry History
        </h1>
        <p className="text-muted-foreground mt-2">
          View your historical time entries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            Entry History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Time entry history will be migrated from Client Hub in Task 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
