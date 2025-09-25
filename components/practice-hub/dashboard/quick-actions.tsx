import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Clock, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      label: "New Task",
      icon: Plus,
      onClick: () => router.push("/practice-hub/tasks"),
      color: "bg-primary hover:bg-primary/90",
    },
    {
      label: "New Client",
      icon: Users,
      onClick: () => router.push("/practice-hub/clients"),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "Log Time",
      icon: Clock,
      onClick: () => router.push("/practice-hub/time-entry"),
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      label: "View Reports",
      icon: BarChart3,
      onClick: () => router.push("/practice-hub/reports"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            onClick={action.onClick}
            className={`w-full justify-start text-white ${action.color}`}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}