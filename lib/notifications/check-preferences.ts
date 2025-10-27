import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";

/**
 * Notification types that map to user preference fields
 */
export type NotificationType =
  | "task_assigned"
  | "task_mention"
  | "task_reassigned"
  | "deadline_approaching"
  | "approval_needed"
  | "client_message";

/**
 * Check if a notification should be sent to a user based on their preferences
 *
 * @param userId - The user to check preferences for
 * @param notificationType - The type of notification to check
 * @param channel - The notification channel (email or in_app)
 * @returns true if the notification should be sent, false otherwise
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType,
  channel: "email" | "in_app" = "in_app",
): Promise<boolean> {
  // Query user settings
  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  // If no settings exist, default to sending notifications
  if (settings.length === 0) {
    return true;
  }

  const userPrefs = settings[0];

  // Check global channel toggle first
  if (channel === "email" && !userPrefs.emailNotifications) {
    return false;
  }
  if (channel === "in_app" && !userPrefs.inAppNotifications) {
    return false;
  }

  // Map notification type to preference field
  const preferenceMap: Record<NotificationType, boolean> = {
    task_assigned: userPrefs.notifTaskAssigned ?? true,
    task_mention: userPrefs.notifTaskMention ?? true,
    task_reassigned: userPrefs.notifTaskReassigned ?? true,
    deadline_approaching: userPrefs.notifDeadlineApproaching ?? true,
    approval_needed: userPrefs.notifApprovalNeeded ?? true,
    client_message: userPrefs.notifClientMessage ?? true,
  };

  // Return the specific preference value
  return preferenceMap[notificationType];
}
