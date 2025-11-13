import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "../lib/notifications";

/**
 * Hook to manage push notifications in the app
 * Handles registration, listeners, and navigation from notifications
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      setExpoPushToken(token);
      // TODO: Send token to backend to register device
      // trpc.notifications.registerDevice.mutate({ pushToken: token })
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      },
    );

    // Listen for user interactions with notifications
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;

      // Handle navigation based on notification data
      // Example: Navigate to approval detail screen
      if (data.type === "timesheet" && data.submissionId) {
        // navigation.navigate("Approvals", {
        //   screen: "TimesheetDetail",
        //   params: { submissionId: data.submissionId }
        // });
      } else if (data.type === "leave" && data.requestId) {
        // navigation.navigate("Approvals", {
        //   screen: "LeaveRequestDetail",
        //   params: { requestId: data.requestId }
        // });
      }

      // TODO: Add more navigation handlers as needed
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}
