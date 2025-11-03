import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyTimesheetPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function WeeklyTimesheetPage({
  params,
}: WeeklyTimesheetPageProps) {
  const { weekId } = await params;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Weekly Timesheet</h1>
        <p className="text-muted-foreground mt-2">Week ID: {weekId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Timesheet Entry Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Weekly timesheet entry form will be migrated from Client Hub in Task
            2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
