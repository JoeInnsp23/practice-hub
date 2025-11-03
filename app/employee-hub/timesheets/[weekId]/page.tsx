"use client";

import { parse, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { use } from "react";

interface WeeklyTimesheetPageProps {
  params: Promise<{ weekId: string }>;
}

export default function WeeklyTimesheetPage({
  params,
}: WeeklyTimesheetPageProps) {
  const { weekId } = use(params);

  // Parse weekId (expected format: YYYY-MM-DD or YYYYMMDD)
  let weekDate: Date;

  try {
    // Try ISO format first (YYYY-MM-DD)
    if (weekId.includes("-")) {
      weekDate = parse(weekId, "yyyy-MM-dd", new Date());
    } else {
      // Try compact format (YYYYMMDD)
      weekDate = parse(weekId, "yyyyMMdd", new Date());
    }

    // Ensure it's a valid Monday (week start)
    weekDate = startOfWeek(weekDate, { weekStartsOn: 1 });
  } catch {
    // Invalid weekId format - redirect to current week
    redirect("/employee-hub/time-entries");
  }

  // Redirect to the main time-entries page
  // The time-entries page already has week navigation and handles all weeks
  redirect("/employee-hub/time-entries");
}
