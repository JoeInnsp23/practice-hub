"use client";

import { Calendar, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { LeaveCalendar } from "@/components/client-hub/leave/leave-calendar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeaveCalendarPage() {
  const [userFilter, setUserFilter] = useState("all");

  // Fetch calendar data
  const { data: calendarData, isLoading } = trpc.leave.getCalendar.useQuery();
  const { data: teamLeave } = trpc.leave.getTeamLeave.useQuery();

  // Get unique team members
  const teamMembers = useMemo(() => {
    if (!calendarData) return [];
    const uniqueUsers = new Map<string, { id: string; name: string }>();
    calendarData.forEach((leave) => {
      if (!uniqueUsers.has(leave.userId)) {
        uniqueUsers.set(leave.userId, {
          id: leave.userId,
          name: leave.userName,
        });
      }
    });
    return Array.from(uniqueUsers.values());
  }, [calendarData]);

  // Filter calendar data by user
  const filteredCalendarData = useMemo(() => {
    if (!calendarData) return [];
    if (userFilter === "all") return calendarData;
    return calendarData.filter((leave) => leave.userId === userFilter);
  }, [calendarData, userFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!calendarData) {
      return {
        totalOnLeaveToday: 0,
        totalThisWeek: 0,
        totalApproved: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    weekFromNow.setHours(23, 59, 59, 999);

    const onLeaveToday = new Set(
      calendarData
        .filter((leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          return (
            leave.status === "approved" &&
            today >= start &&
            today <= end
          );
        })
        .map((leave) => leave.userId),
    ).size;

    const onLeaveThisWeek = new Set(
      calendarData
        .filter((leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          return (
            leave.status === "approved" &&
            ((start >= today && start <= weekFromNow) ||
              (end >= today && end <= weekFromNow) ||
              (start <= today && end >= weekFromNow))
          );
        })
        .map((leave) => leave.userId),
    ).size;

    const totalApproved = calendarData.filter(
      (leave) => leave.status === "approved",
    ).length;

    return {
      totalOnLeaveToday: onLeaveToday,
      totalThisWeek: onLeaveThisWeek,
      totalApproved,
    };
  }, [calendarData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Calendar</h1>
          <p className="text-muted-foreground mt-2">
            View team leave schedule at a glance
          </p>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget
          title="On Leave Today"
          value={`${stats.totalOnLeaveToday} ${stats.totalOnLeaveToday === 1 ? "person" : "people"}`}
          icon={Users}
          loading={isLoading}
          iconColor="text-orange-600"
        />
        <KPIWidget
          title="On Leave This Week"
          value={`${stats.totalThisWeek} ${stats.totalThisWeek === 1 ? "person" : "people"}`}
          icon={Calendar}
          loading={isLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Total Approved Leave"
          value={stats.totalApproved.toString()}
          icon={Calendar}
          loading={isLoading}
          iconColor="text-green-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar - Takes 3 columns */}
        <div className="lg:col-span-3">
          <LeaveCalendar leaveRequests={filteredCalendarData} />
        </div>

        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Team Member
                </label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Team Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team Members</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Upcoming Leave */}
          {teamLeave && teamLeave.length > 0 && (
            <Card className="mt-6 p-6">
              <h3 className="font-semibold mb-4">Upcoming Leave</h3>
              <div className="space-y-3">
                {teamLeave
                  .filter((leave) => leave.status === "approved")
                  .sort(
                    (a, b) =>
                      new Date(a.startDate).getTime() -
                      new Date(b.startDate).getTime(),
                  )
                  .slice(0, 5)
                  .map((leave) => (
                    <div key={leave.id} className="text-sm">
                      <div className="font-medium">{leave.userName}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(leave.startDate).toLocaleDateString()} -{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
