"use client";

import { Calendar, Clock, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { HourlyTimesheet } from "@/components/employee-hub/timesheets/hourly-timesheet";
import { MonthlyTimesheet } from "@/components/employee-hub/timesheets/monthly-timesheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

export default function TimeTrackingPage() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined,
  );
  const { data: session } = useSession();

  const currentUserId = session?.user?.id ?? "";

  // Fetch the current user's profile to determine role
  const { data: currentUser } = trpc.users.getById.useQuery(currentUserId, {
    enabled: Boolean(currentUserId),
  });

  // Fetch users list for admin staff selector
  const { data: usersData } = trpc.users.list.useQuery(
    {},
    {
      enabled: currentUser?.role === "admin",
    },
  );

  const isAdmin = useMemo(() => {
    if (!currentUser?.role) return false;
    return currentUser.role === "admin" || currentUser.role === "org:admin";
  }, [currentUser?.role]);

  useEffect(() => {
    if (isAdmin && currentUserId && !selectedUserId) {
      setSelectedUserId(currentUserId);
    }
  }, [isAdmin, currentUserId, selectedUserId]);

  const effectiveSelectedUserId = isAdmin
    ? (selectedUserId ?? currentUserId)
    : session?.user?.id;

  const handleViewChange = (value: string) => {
    if (value === "daily" || value === "weekly" || value === "monthly") {
      setView(value);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground mt-2">
          {isAdmin
            ? "View and manage timesheets for staff members"
            : "Track your time and monitor productivity across projects"}
        </p>
      </div>

      {/* Control Bar: View Toggle + Staff Selector */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList className="grid max-w-md grid-cols-2">
            <TabsTrigger value="weekly">
              <Clock className="h-4 w-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="h-4 w-4 mr-2" />
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {isAdmin && (
          <div className="glass-card h-9 px-4 py-1.5 rounded-lg flex items-center gap-2">
            <Label htmlFor="staff-selector" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Member:
            </Label>
            <Select
              value={selectedUserId ?? currentUserId}
              onValueChange={(value) => setSelectedUserId(value)}
            >
              <SelectTrigger id="staff-selector" className="w-[200px]">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent
                className={cn(GLASS_DROPDOWN_MENU_STYLES, "max-h-[300px]")}
              >
                {usersData?.users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                    {user.email && ` (${user.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <TabsContent value="weekly" className="space-y-4">
        {/* Weekly View - Hourly Timesheet */}
        <div className="h-[calc(100vh-220px)]">
          <HourlyTimesheet selectedUserId={effectiveSelectedUserId} />
        </div>
      </TabsContent>

      <TabsContent value="monthly" className="space-y-4">
        {/* Monthly View - Calendar */}
        <div className="h-[calc(100vh-220px)]">
          <MonthlyTimesheet selectedUserId={effectiveSelectedUserId} />
        </div>
      </TabsContent>
    </div>
  );
}
