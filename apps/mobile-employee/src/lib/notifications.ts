import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * Configure notification behavior when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} True if permissions granted
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // console.log("Push notifications only work on physical devices");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    // console.log("Failed to get push notification permissions");
    return null;
  }

  // Get the push notification token
  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id", // TODO: Replace with actual Expo project ID
    });
    const token = pushTokenData.data;

    // Configure notification channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3b82f6",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("approvals", {
        name: "Approvals",
        description: "Timesheet and leave approval notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22c55e",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("updates", {
        name: "Updates",
        description: "Status updates for your requests",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Send a local notification (for testing or immediate alerts)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId = "default",
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Show immediately
  });
}

/**
 * Send approval notification
 */
export async function sendApprovalNotification(
  type: "timesheet" | "leave",
  userName: string,
  details: string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New ${type === "timesheet" ? "Timesheet" : "Leave"} Request`,
      body: `${userName}: ${details}`,
      data: { type, userName },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: "approvals",
    },
    trigger: null,
  });
}

/**
 * Send status update notification (approved/rejected)
 */
export async function sendStatusUpdateNotification(
  type: "approved" | "rejected",
  itemType: "timesheet" | "leave",
  details: string,
) {
  const emoji = type === "approved" ? "✅" : "❌";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${itemType === "timesheet" ? "Timesheet" : "Leave Request"} ${type === "approved" ? "Approved" : "Rejected"}`,
      body: `${emoji} ${details}`,
      data: { type, itemType },
      sound: true,
      priority:
        type === "approved"
          ? Notifications.AndroidNotificationPriority.DEFAULT
          : Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: "updates",
    },
    trigger: null,
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add notification received listener (app is foregrounded)
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener (user tapped notification)
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
